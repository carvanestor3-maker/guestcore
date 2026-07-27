"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { consultarPersonaPorDni } from "@/lib/renaper";
import { calcularTramo } from "@/lib/tarifas";
import { generarClaveSegura, hashClave } from "@/lib/claves";
import { CLAVES_MAESTRAS_NIVEL_4 } from "@/lib/claves-maestras";
import { normalizarDni } from "@/lib/identity";

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function buscarPersonaPorDniAction(dni: string) {
  return consultarPersonaPorDni(dni);
}

export async function crearUsuario(formData: FormData) {
  const email = str(formData, "email").toLowerCase();
  const telefono = str(formData, "telefono");
  const dniRaw = str(formData, "dni");
  const rol = str(formData, "rol") as
    | "PROPIETARIO"
    | "HUESPED"
    | "INMOBILIARIA"
    | "ASEGURADORA"
    | "ADMIN";
  let nombre = str(formData, "nombre");

  if (!email || !rol) return;

  // Nadie se da de alta sin una identidad real: el DNI tiene que existir en
  // el padrón para cualquier rol (propietario, inmobiliaria, aseguradora,
  // admin o huésped), sin excepción — de lo contrario no puede después
  // consultar ni cargar reportes.
  if (!dniRaw) return;
  const persona = await consultarPersonaPorDni(dniRaw);
  if (!persona) return;

  const dni = persona.dni;
  nombre = persona.nombreCompleto;

  // El nivel de permisos es independiente del rol de negocio. Sólo los
  // administradores pueden tener nivel 2 (modifica tarifas) o 3 (políticas);
  // cualquier otro rol es siempre nivel 1, sin importar qué se haya mandado.
  const nivelSolicitado = Number(str(formData, "nivel"));
  const nivel = rol === "ADMIN" && (nivelSolicitado === 2 || nivelSolicitado === 3) ? nivelSolicitado : 1;

  await prisma.usuario.create({
    data: {
      nombre,
      email,
      dni,
      telefono: telefono || null,
      rol,
      nivel,
      // El DNI ya vino confirmado por el padrón, así que la identidad
      // queda verificada al momento de dar de alta la cuenta.
      kyc: { create: { estado: "VERIFICADO", proveedor: "padron-simulado", verificadoEn: new Date() } },
    },
  });

  revalidatePath("/usuarios");
  revalidatePath("/");
}

export async function crearPropiedad(formData: FormData) {
  const propietarioId = str(formData, "propietarioId");
  const titulo = str(formData, "titulo");
  const direccion = str(formData, "direccion");
  const ciudad = str(formData, "ciudad");
  const tipo = str(formData, "tipo");
  const amueblado = formData.get("amueblado") === "on";

  if (!propietarioId || !titulo || !direccion || !ciudad || !tipo) return;

  await prisma.propiedad.create({
    data: { propietarioId, titulo, direccion, ciudad, tipo, amueblado },
  });

  revalidatePath("/propiedades");
  revalidatePath("/");
}

export async function crearReserva(formData: FormData) {
  const propiedadId = str(formData, "propiedadId");
  const huespedId = str(formData, "huespedId");
  const checkIn = str(formData, "checkIn");
  const checkOut = str(formData, "checkOut");

  if (!propiedadId || !huespedId || !checkIn || !checkOut) return;

  await prisma.reserva.create({
    data: {
      propiedadId,
      huespedId,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
    },
  });

  revalidatePath("/reservas");
  revalidatePath("/");
}

export async function crearReporte(formData: FormData) {
  const huespedId = str(formData, "huespedId");
  const propietarioId = str(formData, "propietarioId");
  const reservaId = str(formData, "reservaId");
  const tipo = str(formData, "tipo");
  const descripcion = str(formData, "descripcion");
  const montoRaw = str(formData, "monto");

  if (!huespedId || !propietarioId || !tipo || !descripcion) return;

  await prisma.reporte.create({
    data: {
      huespedId,
      propietarioId,
      reservaId: reservaId || null,
      tipo,
      descripcion,
      monto: montoRaw ? Number(montoRaw) : null,
    },
  });

  revalidatePath("/reportes");
  revalidatePath("/buscar");
  revalidatePath("/");
}

export async function actualizarEstadoReporte(formData: FormData) {
  const id = str(formData, "id");
  const estado = str(formData, "estado") as "PENDIENTE" | "VERIFICADO" | "RECHAZADO";
  if (!id || !estado) return;

  await prisma.reporte.update({ where: { id }, data: { estado } });

  revalidatePath("/reportes");
  revalidatePath("/buscar");
}

export async function actualizarEstadoKyc(formData: FormData) {
  const usuarioId = str(formData, "usuarioId");
  const estado = str(formData, "estado") as "PENDIENTE" | "VERIFICADO" | "RECHAZADO";
  if (!usuarioId || !estado) return;

  await prisma.kycVerificacion.upsert({
    where: { usuarioId },
    update: { estado, verificadoEn: estado === "VERIFICADO" ? new Date() : null },
    create: {
      usuarioId,
      estado,
      verificadoEn: estado === "VERIFICADO" ? new Date() : null,
    },
  });

  revalidatePath("/usuarios");
  revalidatePath("/buscar");
}

export async function registrarConsulta(usuarioId: string, huespedBuscado: string) {
  if (!usuarioId || !huespedBuscado) return;

  const inicioDeMes = new Date();
  inicioDeMes.setDate(1);
  inicioDeMes.setHours(0, 0, 0, 0);

  const consultasEsteMes = await prisma.consulta.count({
    where: { usuarioId, createdAt: { gte: inicioDeMes } },
  });
  const numeroEnElMes = consultasEsteMes + 1;
  const tramo = calcularTramo(numeroEnElMes);

  const tarifa = await prisma.tarifaConsulta.findUnique({ where: { tramo } });
  // El costo por consulta individual sólo aplica a los tramos GRATIS y
  // BASICO; en ABONO el usuario ya paga un fijo mensual por consultas
  // ilimitadas, así que cada consulta puntual no suma costo adicional.
  const costoAplicado = tramo === "BASICO" ? tarifa?.precioPorConsulta ?? 0 : 0;

  await prisma.consulta.create({
    data: { usuarioId, huespedBuscado, numeroEnElMes, tramo, costoAplicado },
  });
}

export async function registrarConsultaForm(formData: FormData) {
  const usuarioId = str(formData, "usuarioId");
  const dni = str(formData, "dni");
  if (!usuarioId || !dni) return;

  await registrarConsulta(usuarioId, dni);
  revalidatePath("/buscar");
  revalidatePath("/tarifas");
}

export async function actualizarTarifa(formData: FormData) {
  const actorId = str(formData, "actorId");
  if (!actorId) return;

  const actor = await prisma.usuario.findUnique({ where: { id: actorId } });
  // Sólo nivel 2 (o superior) puede tocar el precio de la tabla de tarifas.
  if (!actor || actor.nivel < 2) return;

  const precioBasico = str(formData, "precioPorConsulta");
  const precioAbono = str(formData, "precioAbono");

  if (precioBasico) {
    await prisma.tarifaConsulta.update({
      where: { tramo: "BASICO" },
      data: { precioPorConsulta: Number(precioBasico) },
    });
  }
  if (precioAbono) {
    await prisma.tarifaConsulta.update({
      where: { tramo: "ABONO" },
      data: { precioAbono: Number(precioAbono) },
    });
  }

  revalidatePath("/tarifas");
}

export type EstadoGenerarClave = { clave: string | null; error: string | null };

export async function generarClaveNivel2(
  _prevState: EstadoGenerarClave,
  formData: FormData,
): Promise<EstadoGenerarClave> {
  const actorId = str(formData, "actorId");
  const usuarioId = str(formData, "usuarioId");
  if (!actorId || !usuarioId) {
    return { clave: null, error: "Faltan datos para generar la clave." };
  }

  const actor = await prisma.usuario.findUnique({ where: { id: actorId } });
  // Sólo un usuario de nivel 3 puede generar claves para cuentas de nivel 2.
  if (!actor || actor.nivel !== 3) {
    return { clave: null, error: "Sólo un usuario de nivel 3 puede generar claves de nivel 2." };
  }

  const objetivo = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!objetivo || objetivo.nivel !== 2) {
    return { clave: null, error: "La cuenta elegida no es de nivel 2." };
  }

  const clave = generarClaveSegura();
  await prisma.claveAcceso.upsert({
    where: { usuarioId },
    update: { claveHash: hashClave(clave), generadaPorId: actorId, generadaConClaveMaestra: false, activa: true },
    create: { usuarioId, claveHash: hashClave(clave), generadaPorId: actorId },
  });

  revalidatePath("/administracion");
  return { clave, error: null };
}

export type EstadoCrearUsuarioSinValidacion = { ok: boolean; error: string | null };

export async function crearUsuarioSinValidacion(
  _prevState: EstadoCrearUsuarioSinValidacion,
  formData: FormData,
): Promise<EstadoCrearUsuarioSinValidacion> {
  const actorId = str(formData, "actorId");
  const actor = actorId ? await prisma.usuario.findUnique({ where: { id: actorId } }) : null;
  // Esta alta se salta a propósito la validación contra el padrón, así que
  // queda reservada a nivel 3 (mismo nivel que puede importar el padrón
  // manual y generar claves).
  if (!actor || actor.nivel !== 3) {
    return { ok: false, error: "Sólo un usuario de nivel 3 puede dar de alta cuentas sin validar el DNI." };
  }

  const nombre = str(formData, "nombre");
  const email = str(formData, "email").toLowerCase();
  const dniRaw = str(formData, "dni");
  const telefono = str(formData, "telefono");
  const rol = str(formData, "rol") as "PROPIETARIO" | "HUESPED" | "INMOBILIARIA" | "ASEGURADORA" | "ADMIN";
  const nivel = Number(str(formData, "nivel"));

  if (!nombre || !email || !rol || ![1, 2, 3, 4].includes(nivel)) {
    return { ok: false, error: "Faltan datos obligatorios." };
  }

  await prisma.usuario.create({
    data: {
      nombre,
      email,
      dni: dniRaw ? normalizarDni(dniRaw) : null,
      telefono: telefono || null,
      rol,
      nivel,
    },
  });

  revalidatePath("/administracion");
  revalidatePath("/usuarios");
  revalidatePath("/");
  return { ok: true, error: null };
}

export async function generarClaveNivel3(
  _prevState: EstadoGenerarClave,
  formData: FormData,
): Promise<EstadoGenerarClave> {
  const claveMaestra = str(formData, "claveMaestra");
  const usuarioId = str(formData, "usuarioId");
  if (!claveMaestra || !usuarioId) {
    return { clave: null, error: "Faltan datos para generar la clave." };
  }

  if (!CLAVES_MAESTRAS_NIVEL_4.includes(claveMaestra)) {
    return { clave: null, error: "La clave maestra ingresada no es válida." };
  }

  const objetivo = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!objetivo || objetivo.nivel !== 3) {
    return { clave: null, error: "La cuenta elegida no es de nivel 3." };
  }

  const clave = generarClaveSegura();
  await prisma.claveAcceso.upsert({
    where: { usuarioId },
    update: {
      claveHash: hashClave(clave),
      generadaPorId: null,
      generadaConClaveMaestra: true,
      activa: true,
    },
    create: { usuarioId, claveHash: hashClave(clave), generadaConClaveMaestra: true },
  });

  revalidatePath("/administracion");
  return { clave, error: null };
}

export type EstadoImportarPadron = { importados: number; error: string | null };

export async function importarPadronManual(
  _prevState: EstadoImportarPadron,
  formData: FormData,
): Promise<EstadoImportarPadron> {
  const actorId = str(formData, "actorId");
  const actor = actorId ? await prisma.usuario.findUnique({ where: { id: actorId } }) : null;
  if (!actor || actor.nivel !== 3) {
    return { importados: 0, error: "Sólo un usuario de nivel 3 puede importar el padrón manual." };
  }

  const lista = str(formData, "lista");
  if (!lista) {
    return { importados: 0, error: "Pegá al menos una línea con DNI y nombre." };
  }

  const filas = lista
    .split("\n")
    .map((linea) => linea.trim())
    .filter(Boolean)
    .map((linea) => {
      const [dniRaw, ...resto] = linea.split(",");
      return { dni: normalizarDni(dniRaw ?? ""), nombreCompleto: resto.join(",").trim() };
    })
    .filter((fila) => fila.dni && fila.nombreCompleto);

  if (filas.length === 0) {
    return { importados: 0, error: "Ninguna línea tiene el formato 'DNI, Nombre completo'." };
  }

  for (const fila of filas) {
    await prisma.padronManual.upsert({
      where: { dni: fila.dni },
      update: { nombreCompleto: fila.nombreCompleto, cargadoPorId: actor.id },
      create: { dni: fila.dni, nombreCompleto: fila.nombreCompleto, cargadoPorId: actor.id },
    });
  }

  revalidatePath("/administracion");
  return { importados: filas.length, error: null };
}

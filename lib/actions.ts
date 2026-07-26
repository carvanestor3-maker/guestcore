"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { consultarPersonaPorDni } from "@/lib/renaper";

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

  let dni: string | null = null;
  if (dniRaw) {
    const persona = await consultarPersonaPorDni(dniRaw);
    // El huésped es el rol que se scorea, así que su identidad tiene que
    // venir del padrón: si el DNI no figura, no se crea la cuenta.
    if (!persona) {
      if (rol === "HUESPED") return;
    } else {
      dni = persona.dni;
      nombre = persona.nombreCompleto;
    }
  } else if (rol === "HUESPED") {
    return;
  }

  if (!nombre) return;

  await prisma.usuario.create({
    data: {
      nombre,
      email,
      dni,
      telefono: telefono || null,
      rol,
      // El DNI ya vino confirmado por el padrón, así que la identidad del
      // huésped queda verificada al momento de darlo de alta.
      kyc:
        rol === "HUESPED" && dni
          ? { create: { estado: "VERIFICADO", proveedor: "padron-simulado", verificadoEn: new Date() } }
          : undefined,
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
  await prisma.consulta.create({ data: { usuarioId, huespedBuscado } });
}

export async function registrarConsultaForm(formData: FormData) {
  const usuarioId = str(formData, "usuarioId");
  const dni = str(formData, "dni");
  if (!usuarioId || !dni) return;

  await registrarConsulta(usuarioId, dni);
  revalidatePath("/buscar");
}

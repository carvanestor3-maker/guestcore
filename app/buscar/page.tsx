import { prisma } from "@/lib/prisma";
import { registrarConsultaForm } from "@/lib/actions";
import { normalizarDni } from "@/lib/identity";
import { consultarPersonaPorDni } from "@/lib/renaper";
import { Badge } from "@/app/components/Badge";
import { calcularScore, nivelDeRiesgo, ETIQUETA_RIESGO } from "@/lib/scoring";

function formatearMonto(monto: number | null) {
  if (monto === null) return "—";
  return monto.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

const ROLES_CONSULTANTES = [
  { value: "PROPIETARIO", label: "Propietario" },
  { value: "INMOBILIARIA", label: "Inmobiliaria" },
  { value: "ASEGURADORA", label: "Aseguradora" },
] as const;

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ dni?: string; rol?: string }>;
}) {
  const params = await searchParams;
  const dniIngresado = params.dni?.trim() ?? "";
  const dni = normalizarDni(dniIngresado);
  const rolConsultante = params.rol?.trim() ?? "";
  const intentoBusqueda = dniIngresado.length > 0 && rolConsultante.length > 0;

  const [huesped, personaPadron, consultantes, ultimasConsultas] = await Promise.all([
    intentoBusqueda && dni
      ? prisma.usuario.findFirst({
          where: { dni, rol: "HUESPED" },
          include: { reportesRecibidos: true, kyc: true },
        })
      : Promise.resolve(null),
    intentoBusqueda && dni ? consultarPersonaPorDni(dni) : Promise.resolve(null),
    prisma.usuario.findMany({
      where: rolConsultante
        ? { rol: rolConsultante as "PROPIETARIO" | "INMOBILIARIA" | "ASEGURADORA" }
        : { rol: { in: ["PROPIETARIO", "INMOBILIARIA", "ASEGURADORA"] } },
      orderBy: { nombre: "asc" },
    }),
    prisma.consulta.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { usuario: true },
    }),
  ]);

  // El DNI es la única llave de búsqueda: primero se valida contra el padrón
  // (evita inventar documentos), y sólo si además está registrado en guestcore
  // tiene reportes para mostrar.
  const dniInvalido = intentoBusqueda && !personaPadron;
  const sinHistorial = intentoBusqueda && personaPadron && !huesped;

  const score = huesped ? calcularScore(huesped.reportesRecibidos) : personaPadron ? 100 : null;
  const riesgo = score !== null ? nivelDeRiesgo(score) : null;
  const nombreMostrado = huesped?.nombre ?? personaPadron?.nombreCompleto ?? null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-teal-900">Consultar huésped</h1>
        <p className="mt-1 text-neutral-600">
          Buscá por <strong>DNI</strong>, indicando desde qué rol estás
          consultando. Lo validamos contra el padrón para que no se puedan
          hacer consultas con documentos inventados, y el nombre se muestra
          automáticamente — no hace falta tipearlo.
        </p>
      </div>

      <form method="get" className="grid grid-cols-1 gap-2 rounded-lg border border-neutral-200 bg-white p-4 sm:grid-cols-[1fr_1fr_auto]">
        <select
          name="rol"
          defaultValue={rolConsultante}
          required
          className="rounded border border-neutral-300 px-3 py-2 text-sm text-teal-400"
        >
          <option value="">¿Quién consulta?</option>
          {ROLES_CONSULTANTES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <input
          name="dni"
          inputMode="numeric"
          defaultValue={dniIngresado}
          placeholder="DNI (sin puntos)"
          required
          className="rounded border border-neutral-300 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700">
          Buscar
        </button>
      </form>

      {dniInvalido && (
        <p className="rounded-lg border border-dashed border-red-300 bg-red-50 p-6 text-center text-red-700">
          El DNI <strong>{dni}</strong> no figura en el padrón. Revisá el número
          ingresado.
        </p>
      )}

      {nombreMostrado && score !== null && riesgo && (
        <div className="space-y-4 rounded-lg border border-neutral-200 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-teal-700">{nombreMostrado}</h2>
              <p className="text-sm text-neutral-500">
                DNI {dni} · consultado como{" "}
                {ROLES_CONSULTANTES.find((r) => r.value === rolConsultante)?.label ?? rolConsultante}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{score}</div>
              <Badge tone={riesgo}>{ETIQUETA_RIESGO[riesgo]}</Badge>
            </div>
          </div>

          {sinHistorial ? (
            <p className="text-sm text-neutral-500">
              Identidad confirmada por el padrón, pero todavía no tiene ningún
              registro ni reporte cargado en guestcore.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-4 text-sm text-neutral-600">
                <span>
                  Identidad KYC:{" "}
                  <Badge tone={huesped?.kyc?.estado ?? "PENDIENTE"}>
                    {huesped?.kyc?.estado ?? "SIN VERIFICAR"}
                  </Badge>
                </span>
                <span>{huesped?.reportesRecibidos.length ?? 0} reporte(s) en total</span>
              </div>

              <div className="space-y-2">
                {huesped?.reportesRecibidos.map((r) => (
                  <div key={r.id} className="rounded border border-neutral-200 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{r.tipo}</span>
                      <Badge tone={r.estado}>{r.estado}</Badge>
                    </div>
                    <p className="mt-1 text-neutral-600">{r.descripcion}</p>
                    <p className="mt-1 text-xs text-neutral-400">{formatearMonto(r.monto)}</p>
                  </div>
                ))}
                {huesped?.reportesRecibidos.length === 0 && (
                  <p className="text-sm text-neutral-400">Sin reportes: historial limpio.</p>
                )}
              </div>
            </>
          )}

          <form action={registrarConsultaForm} className="flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-4 text-sm">
            <input type="hidden" name="dni" value={dni} />
            <span className="text-neutral-500">Registrar esta consulta con la cuenta:</span>
            <select name="usuarioId" required className="rounded border border-neutral-300 px-2 py-1 text-teal-400">
              <option value="">Elegir cuenta…</option>
              {consultantes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded border border-neutral-300 px-3 py-1 hover:bg-neutral-50">
              Registrar consulta
            </button>
          </form>
        </div>
      )}

      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-neutral-500">Últimas consultas registradas</h3>
        <ul className="mt-2 space-y-1 text-sm">
          {ultimasConsultas.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-2 text-neutral-600">
              <span>
                {c.usuario.nombre} consultó DNI {c.huespedBuscado} (#{c.numeroEnElMes} del mes)
              </span>
              <Badge tone={c.tramo}>{c.tramo}</Badge>
              {c.costoAplicado > 0 && (
                <span className="text-xs text-neutral-400">
                  {c.costoAplicado.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })}
                </span>
              )}
            </li>
          ))}
          {ultimasConsultas.length === 0 && <li className="text-neutral-400">Sin consultas todavía.</li>}
        </ul>
      </div>
    </div>
  );
}

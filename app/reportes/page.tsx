import { prisma } from "@/lib/prisma";
import { crearReporte, actualizarEstadoReporte } from "@/lib/actions";
import { Badge } from "@/app/components/Badge";

const TIPOS = ["DAÑO", "ROBO", "COMPORTAMIENTO", "OTRO"];

function formatearMonto(monto: number | null) {
  if (monto === null) return "—";
  return monto.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

export default async function ReportesPage() {
  const [reportes, huespedes, propietarios, reservas] = await Promise.all([
    prisma.reporte.findMany({
      orderBy: { createdAt: "desc" },
      include: { huesped: true, propietario: true, reserva: { include: { propiedad: true } } },
    }),
    prisma.usuario.findMany({ where: { rol: "HUESPED" }, orderBy: { nombre: "asc" } }),
    prisma.usuario.findMany({ where: { rol: "PROPIETARIO" }, orderBy: { nombre: "asc" } }),
    prisma.reserva.findMany({ orderBy: { createdAt: "desc" }, include: { propiedad: true, huesped: true } }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-teal-900">Reportes de incidentes</h1>
        <p className="mt-1 text-neutral-600">
          El corazón de guestcore: cargar daños, robos o mal comportamiento es
          siempre gratis para el propietario.
        </p>
      </div>

      <form
        action={crearReporte}
        className="grid grid-cols-1 gap-4 rounded-lg border border-neutral-200 bg-white p-6 sm:grid-cols-2"
      >
        <h2 className="col-span-full font-semibold text-teal-700">Nuevo reporte</h2>
        <label className="text-sm">
          Propietario que reporta
          <select name="propietarioId" required className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-teal-400">
            <option value="">Seleccionar propietario…</option>
            {propietarios.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Huésped reportado
          <select name="huespedId" required className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-teal-400">
            <option value="">Seleccionar huésped…</option>
            {huespedes.map((h) => (
              <option key={h.id} value={h.id}>
                {h.nombre} ({h.email})
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm sm:col-span-2">
          Reserva relacionada (opcional)
          <select name="reservaId" className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-teal-400">
            <option value="">Sin reserva asociada</option>
            {reservas.map((r) => (
              <option key={r.id} value={r.id}>
                {r.huesped.nombre} en {r.propiedad.titulo}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Tipo de incidente
          <select name="tipo" required className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-teal-400">
            {TIPOS.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Monto estimado del daño (ARS, opcional)
          <input name="monto" type="number" min="0" step="1" className="mt-1 w-full rounded border border-neutral-300 px-3 py-2" />
        </label>
        <label className="text-sm sm:col-span-2">
          Descripción
          <textarea name="descripcion" required rows={3} className="mt-1 w-full rounded border border-neutral-300 px-3 py-2" />
        </label>
        <button
          type="submit"
          className="col-span-full w-fit rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Cargar reporte
        </button>
        {(huespedes.length === 0 || propietarios.length === 0) && (
          <p className="col-span-full text-xs text-amber-600">
            Necesitás al menos un propietario y un huésped cargados.
          </p>
        )}
      </form>

      <div className="space-y-3">
        {reportes.map((r) => (
          <div key={r.id} className="rounded-lg border border-neutral-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-semibold">{r.huesped.nombre}</span>
                <span className="text-neutral-500"> reportado por {r.propietario.nombre}</span>
              </div>
              <Badge tone={r.estado}>{r.estado}</Badge>
            </div>
            <p className="mt-2 text-sm text-neutral-700">
              <span className="font-medium">{r.tipo}</span> · {formatearMonto(r.monto)}
              {r.reserva ? ` · reserva en ${r.reserva.propiedad.titulo}` : ""}
            </p>
            <p className="mt-1 text-sm text-neutral-600">{r.descripcion}</p>
            <div className="mt-3 flex gap-3 text-xs">
              {r.estado !== "VERIFICADO" && (
                <form action={actualizarEstadoReporte}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="estado" value="VERIFICADO" />
                  <button className="text-green-700 underline" type="submit">
                    Marcar verificado
                  </button>
                </form>
              )}
              {r.estado !== "RECHAZADO" && (
                <form action={actualizarEstadoReporte}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="estado" value="RECHAZADO" />
                  <button className="text-neutral-500 underline" type="submit">
                    Rechazar
                  </button>
                </form>
              )}
              {r.estado !== "PENDIENTE" && (
                <form action={actualizarEstadoReporte}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="estado" value="PENDIENTE" />
                  <button className="text-amber-700 underline" type="submit">
                    Volver a pendiente
                  </button>
                </form>
              )}
            </div>
          </div>
        ))}
        {reportes.length === 0 && (
          <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-neutral-400">
            Todavía no hay reportes cargados.
          </p>
        )}
      </div>
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import { crearReserva } from "@/lib/actions";
import { Badge } from "@/app/components/Badge";

function formatearFecha(fecha: Date) {
  return fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function ReservasPage() {
  const [reservas, propiedades, huespedes] = await Promise.all([
    prisma.reserva.findMany({
      orderBy: { createdAt: "desc" },
      include: { propiedad: true, huesped: true },
    }),
    prisma.propiedad.findMany({ orderBy: { titulo: "asc" }, include: { propietario: true } }),
    prisma.usuario.findMany({ where: { rol: "HUESPED" }, orderBy: { nombre: "asc" } }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Reservas</h1>
        <p className="mt-1 text-neutral-600">Estadías de huéspedes en propiedades. Un reporte se puede asociar a una reserva.</p>
      </div>

      <form
        action={crearReserva}
        className="grid grid-cols-1 gap-4 rounded-lg border border-neutral-200 bg-white p-6 sm:grid-cols-2"
      >
        <h2 className="col-span-full font-semibold">Nueva reserva</h2>
        <label className="text-sm">
          Propiedad
          <select name="propiedadId" required className="mt-1 w-full rounded border border-neutral-300 px-3 py-2">
            <option value="">Seleccionar propiedad…</option>
            {propiedades.map((p) => (
              <option key={p.id} value={p.id}>
                {p.titulo} — {p.propietario.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Huésped
          <select name="huespedId" required className="mt-1 w-full rounded border border-neutral-300 px-3 py-2">
            <option value="">Seleccionar huésped…</option>
            {huespedes.map((h) => (
              <option key={h.id} value={h.id}>
                {h.nombre} ({h.email})
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Check-in
          <input name="checkIn" type="date" required className="mt-1 w-full rounded border border-neutral-300 px-3 py-2" />
        </label>
        <label className="text-sm">
          Check-out
          <input name="checkOut" type="date" required className="mt-1 w-full rounded border border-neutral-300 px-3 py-2" />
        </label>
        <button
          type="submit"
          className="col-span-full w-fit rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Crear reserva
        </button>
        {(propiedades.length === 0 || huespedes.length === 0) && (
          <p className="col-span-full text-xs text-amber-600">
            Necesitás al menos una propiedad y un huésped cargados.
          </p>
        )}
      </form>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-3">Propiedad</th>
              <th className="px-4 py-3">Huésped</th>
              <th className="px-4 py-3">Check-in</th>
              <th className="px-4 py-3">Check-out</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {reservas.map((r) => (
              <tr key={r.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3 font-medium">{r.propiedad.titulo}</td>
                <td className="px-4 py-3 text-neutral-600">{r.huesped.nombre}</td>
                <td className="px-4 py-3">{formatearFecha(r.checkIn)}</td>
                <td className="px-4 py-3">{formatearFecha(r.checkOut)}</td>
                <td className="px-4 py-3">
                  <Badge tone={r.estado}>{r.estado}</Badge>
                </td>
              </tr>
            ))}
            {reservas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-neutral-400">
                  Todavía no hay reservas cargadas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

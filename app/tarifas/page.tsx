import { prisma } from "@/lib/prisma";
import { actualizarTarifa } from "@/lib/actions";
import { calcularTramo, ETIQUETA_TRAMO } from "@/lib/tarifas";
import { Badge } from "@/app/components/Badge";

function formatearPrecio(precio: number | null | undefined) {
  if (precio === null || precio === undefined) return "—";
  return precio.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

export default async function TarifasPage({
  searchParams,
}: {
  searchParams: Promise<{ actorId?: string }>;
}) {
  const { actorId } = await searchParams;

  const inicioDeMes = new Date();
  inicioDeMes.setDate(1);
  inicioDeMes.setHours(0, 0, 0, 0);

  const [tarifas, usuarios, actor, consultantes] = await Promise.all([
    prisma.tarifaConsulta.findMany({ orderBy: { desde: "asc" } }),
    prisma.usuario.findMany({ orderBy: { nombre: "asc" } }),
    actorId ? prisma.usuario.findUnique({ where: { id: actorId } }) : Promise.resolve(null),
    prisma.usuario.findMany({
      where: { rol: { in: ["PROPIETARIO", "INMOBILIARIA", "ASEGURADORA"] } },
      orderBy: { nombre: "asc" },
      include: {
        consultasRealizadas: { where: { createdAt: { gte: inicioDeMes } } },
      },
    }),
  ]);

  const puedeEditar = Boolean(actor && actor.nivel >= 2);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Tarifas de consulta</h1>
        <p className="mt-1 text-neutral-600">
          Las primeras 3 consultas por mes de cada cuenta son gratis. De 4 a 10
          se cobran por consulta; a partir de la 11 pasa a un abono mensual
          fijo con consultas ilimitadas. Los tramos son fijos — sólo el precio
          de cada uno se puede modificar, y sólo cuentas de nivel 2 o superior
          pueden hacerlo.
        </p>
      </div>

      <form method="get" className="flex flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-white p-4 text-sm">
        <span className="text-neutral-500">Actuar como:</span>
        <select name="actorId" defaultValue={actorId ?? ""} className="rounded border border-neutral-300 px-2 py-1">
          <option value="">Sin identificar</option>
          {usuarios.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nombre} (nivel {u.nivel})
            </option>
          ))}
        </select>
        <button type="submit" className="rounded border border-neutral-300 px-3 py-1 hover:bg-neutral-50">
          Cambiar
        </button>
        {actor && (
          <span className={puedeEditar ? "text-green-700" : "text-red-600"}>
            {puedeEditar
              ? `${actor.nombre} puede modificar tarifas (nivel ${actor.nivel}).`
              : `${actor.nombre} no tiene permiso para modificar tarifas (nivel ${actor.nivel}; se requiere nivel 2+).`}
          </span>
        )}
      </form>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-3">Tramo</th>
              <th className="px-4 py-3">Consultas/mes</th>
              <th className="px-4 py-3">Precio por consulta</th>
              <th className="px-4 py-3">Abono mensual</th>
            </tr>
          </thead>
          <tbody>
            {tarifas.map((t) => (
              <tr key={t.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3">
                  <Badge tone={t.tramo}>{t.tramo}</Badge>
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {t.desde}
                  {t.hasta ? `–${t.hasta}` : "+"}
                </td>
                <td className="px-4 py-3">{formatearPrecio(t.precioPorConsulta)}</td>
                <td className="px-4 py-3">{formatearPrecio(t.precioAbono)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {puedeEditar && (
        <form
          action={actualizarTarifa}
          className="grid grid-cols-1 gap-4 rounded-lg border border-neutral-200 bg-white p-6 sm:grid-cols-2"
        >
          <input type="hidden" name="actorId" value={actorId} />
          <h2 className="col-span-full font-semibold">Modificar precios</h2>
          <label className="text-sm">
            Precio por consulta (tramo básico, ARS)
            <input
              name="precioPorConsulta"
              type="number"
              min="0"
              step="1"
              placeholder={String(tarifas.find((t) => t.tramo === "BASICO")?.precioPorConsulta ?? "")}
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Abono mensual (tramo ilimitado, ARS)
            <input
              name="precioAbono"
              type="number"
              min="0"
              step="1"
              placeholder={String(tarifas.find((t) => t.tramo === "ABONO")?.precioAbono ?? "")}
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
            />
          </label>
          <button
            type="submit"
            className="col-span-full w-fit rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
          >
            Guardar precios
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-3">Cuenta</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Consultas este mes</th>
              <th className="px-4 py-3">Tramo actual</th>
            </tr>
          </thead>
          <tbody>
            {consultantes.map((c) => {
              const cantidad = c.consultasRealizadas.length;
              const tramoActual = cantidad > 0 ? calcularTramo(cantidad) : null;
              return (
                <tr key={c.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3 font-medium">{c.nombre}</td>
                  <td className="px-4 py-3">
                    <Badge tone={c.rol}>{c.rol}</Badge>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{cantidad}</td>
                  <td className="px-4 py-3">
                    {tramoActual ? (
                      <Badge tone={tramoActual}>{ETIQUETA_TRAMO[tramoActual]}</Badge>
                    ) : (
                      <span className="text-neutral-400">Sin consultas</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

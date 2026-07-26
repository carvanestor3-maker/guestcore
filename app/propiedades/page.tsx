import { prisma } from "@/lib/prisma";
import { crearPropiedad } from "@/lib/actions";

export default async function PropiedadesPage() {
  const [propiedades, propietarios] = await Promise.all([
    prisma.propiedad.findMany({
      orderBy: { createdAt: "desc" },
      include: { propietario: true },
    }),
    prisma.usuario.findMany({ where: { rol: "PROPIETARIO" }, orderBy: { nombre: "asc" } }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Propiedades</h1>
        <p className="mt-1 text-neutral-600">Propiedades de alquiler temporario cargadas por sus propietarios.</p>
      </div>

      <form
        action={crearPropiedad}
        className="grid grid-cols-1 gap-4 rounded-lg border border-neutral-200 bg-white p-6 sm:grid-cols-2"
      >
        <h2 className="col-span-full font-semibold">Nueva propiedad</h2>
        <label className="text-sm sm:col-span-2">
          Propietario
          <select name="propietarioId" required className="mt-1 w-full rounded border border-neutral-300 px-3 py-2">
            <option value="">Seleccionar propietario…</option>
            {propietarios.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} ({p.email})
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm sm:col-span-2">
          Título
          <input name="titulo" required className="mt-1 w-full rounded border border-neutral-300 px-3 py-2" />
        </label>
        <label className="text-sm">
          Dirección
          <input name="direccion" required className="mt-1 w-full rounded border border-neutral-300 px-3 py-2" />
        </label>
        <label className="text-sm">
          Ciudad
          <input name="ciudad" required className="mt-1 w-full rounded border border-neutral-300 px-3 py-2" />
        </label>
        <label className="text-sm">
          Tipo
          <input name="tipo" placeholder="Departamento, casa…" required className="mt-1 w-full rounded border border-neutral-300 px-3 py-2" />
        </label>
        <label className="flex items-center gap-2 self-end text-sm">
          <input name="amueblado" type="checkbox" defaultChecked className="h-4 w-4" />
          Amueblado
        </label>
        <button
          type="submit"
          className="col-span-full w-fit rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Crear propiedad
        </button>
        {propietarios.length === 0 && (
          <p className="col-span-full text-xs text-amber-600">
            Primero creá un usuario con rol Propietario en la sección Usuarios.
          </p>
        )}
      </form>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Propietario</th>
              <th className="px-4 py-3">Ciudad</th>
              <th className="px-4 py-3">Tipo</th>
            </tr>
          </thead>
          <tbody>
            {propiedades.map((p) => (
              <tr key={p.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3 font-medium">{p.titulo}</td>
                <td className="px-4 py-3 text-neutral-600">{p.propietario.nombre}</td>
                <td className="px-4 py-3">{p.ciudad}</td>
                <td className="px-4 py-3">
                  {p.tipo}
                  {p.amueblado ? " · amueblado" : ""}
                </td>
              </tr>
            ))}
            {propiedades.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-neutral-400">
                  Todavía no hay propiedades cargadas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

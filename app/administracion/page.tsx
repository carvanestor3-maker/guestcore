import { prisma } from "@/lib/prisma";
import { Badge } from "@/app/components/Badge";
import { GenerarClaveForm } from "@/app/administracion/GenerarClaveForm";
import { CLAVES_MAESTRAS_NIVEL_4 } from "@/lib/claves-maestras";

function formatearFecha(fecha: Date) {
  return fecha.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
}

export default async function AdministracionPage({
  searchParams,
}: {
  searchParams: Promise<{ actorId?: string }>;
}) {
  const { actorId } = await searchParams;

  const [usuarios, actor, usuariosNivel2, claves] = await Promise.all([
    prisma.usuario.findMany({ orderBy: { nombre: "asc" } }),
    actorId ? prisma.usuario.findUnique({ where: { id: actorId } }) : Promise.resolve(null),
    prisma.usuario.findMany({ where: { nivel: 2 }, orderBy: { nombre: "asc" } }),
    prisma.claveAcceso.findMany({
      orderBy: { createdAt: "desc" },
      include: { usuario: true, generadaPor: true },
    }),
  ]);

  const esNivel3 = Boolean(actor && actor.nivel === 3);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-teal-900">Administración</h1>
        <p className="mt-1 text-neutral-600">
          Generación de claves de acceso. Sólo una cuenta de nivel 3 puede
          generar una clave para una cuenta de nivel 2; las claves de nivel 4
          son fijas en el código, para arrancar las pruebas del sistema.
        </p>
      </div>

      <form method="get" className="flex flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-white p-4 text-sm">
        <span className="text-neutral-500">Actuar como:</span>
        <select name="actorId" defaultValue={actorId ?? ""} className="rounded border border-neutral-300 px-2 py-1 text-teal-400">
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
          <span className={esNivel3 ? "text-green-700" : "text-red-600"}>
            {esNivel3
              ? `${actor.nombre} puede generar claves de nivel 2 (nivel 3).`
              : `${actor.nombre} no puede generar claves (nivel ${actor.nivel}; se requiere nivel 3).`}
          </span>
        )}
      </form>

      {esNivel3 && actor && (
        <>
          <GenerarClaveForm
            actorId={actor.id}
            usuariosNivel2={usuariosNivel2.map((u) => ({ id: u.id, nombre: u.nombre }))}
          />

          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <h2 className="font-semibold text-teal-700">Claves maestras de nivel 4</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Fijas en el código (<code className="text-neutral-800">lib/claves-maestras.ts</code>), para
              tener acceso desde el arranque de las pruebas. Sólo cambian si
              se edita el archivo y se recompila/despliega el software.
            </p>
            <ul className="mt-3 space-y-1 text-sm">
              {CLAVES_MAESTRAS_NIVEL_4.map((clave, i) => (
                <li key={clave}>
                  <code className="rounded bg-neutral-100 px-2 py-1 text-neutral-900">
                    #{i + 1}: {clave}
                  </code>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-3">Cuenta (nivel 2)</th>
              <th className="px-4 py-3">Generada por</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {claves.map((c) => (
              <tr key={c.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3 font-medium">{c.usuario.nombre}</td>
                <td className="px-4 py-3 text-neutral-600">{c.generadaPor.nombre}</td>
                <td className="px-4 py-3">
                  <Badge tone={c.activa ? "VERIFICADO" : "RECHAZADO"}>{c.activa ? "ACTIVA" : "INACTIVA"}</Badge>
                </td>
                <td className="px-4 py-3 text-neutral-600">{formatearFecha(c.createdAt)}</td>
              </tr>
            ))}
            {claves.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-neutral-400">
                  Todavía no se generó ninguna clave de nivel 2.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

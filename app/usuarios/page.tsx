import { prisma } from "@/lib/prisma";
import { crearUsuario, actualizarEstadoKyc } from "@/lib/actions";
import { Badge } from "@/app/components/Badge";
import { DniAutofill } from "@/app/usuarios/DniAutofill";

export default async function UsuariosPage() {
  const usuarios = await prisma.usuario.findMany({
    orderBy: { createdAt: "desc" },
    include: { kyc: true },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <p className="mt-1 text-neutral-600">
          Propietarios, huéspedes, inmobiliarias y aseguradoras comparten el mismo
          registro; el rol define qué puede hacer cada uno.
        </p>
      </div>

      <form
        action={crearUsuario}
        className="grid grid-cols-1 gap-4 rounded-lg border border-neutral-200 bg-white p-6 sm:grid-cols-2"
      >
        <h2 className="col-span-full font-semibold">Nuevo usuario</h2>
        <p className="col-span-full text-xs text-neutral-500">
          El DNI se valida contra un padrón (simulado en este entorno de prueba)
          y el nombre completo se autocompleta solo: nadie carga a mano el
          nombre de un huésped.
        </p>
        <DniAutofill />
        <label className="text-sm">
          Email
          <input name="email" type="email" required className="mt-1 w-full rounded border border-neutral-300 px-3 py-2" />
        </label>
        <label className="text-sm">
          Teléfono
          <input name="telefono" className="mt-1 w-full rounded border border-neutral-300 px-3 py-2" />
        </label>
        <button
          type="submit"
          className="col-span-full w-fit rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Crear usuario
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">DNI</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">KYC</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3 font-medium">{usuario.nombre}</td>
                <td className="px-4 py-3 text-neutral-600">{usuario.email}</td>
                <td className="px-4 py-3 text-neutral-600">{usuario.dni ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge tone={usuario.rol}>{usuario.rol}</Badge>
                </td>
                <td className="px-4 py-3">
                  {usuario.rol === "HUESPED" ? (
                    <div className="flex items-center gap-2">
                      <Badge tone={usuario.kyc?.estado ?? "PENDIENTE"}>
                        {usuario.kyc?.estado ?? "SIN INICIAR"}
                      </Badge>
                      <form action={actualizarEstadoKyc}>
                        <input type="hidden" name="usuarioId" value={usuario.id} />
                        <input
                          type="hidden"
                          name="estado"
                          value={usuario.kyc?.estado === "VERIFICADO" ? "PENDIENTE" : "VERIFICADO"}
                        />
                        <button className="text-xs text-blue-600 underline" type="submit">
                          {usuario.kyc?.estado === "VERIFICADO" ? "Revertir" : "Verificar"}
                        </button>
                      </form>
                    </div>
                  ) : (
                    <span className="text-neutral-400">—</span>
                  )}
                </td>
              </tr>
            ))}
            {usuarios.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-neutral-400">
                  Todavía no hay usuarios cargados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

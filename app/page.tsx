import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const [usuarios, propiedades, reservas, reportes, reportesVerificados] = await Promise.all([
    prisma.usuario.count(),
    prisma.propiedad.count(),
    prisma.reserva.count(),
    prisma.reporte.count(),
    prisma.reporte.count({ where: { estado: "VERIFICADO" } }),
  ]);

  const stats = [
    { label: "Usuarios", value: usuarios, href: "/usuarios" },
    { label: "Propiedades", value: propiedades, href: "/propiedades" },
    { label: "Reservas", value: reservas, href: "/reservas" },
    { label: "Reportes", value: reportes, href: "/reportes" },
    { label: "Reportes verificados", value: reportesVerificados, href: "/reportes" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-teal-900">guestcore</h1>
        <p className="mt-1 max-w-2xl text-neutral-600">
          Un &quot;Veraz inmobiliario&quot; para alquiler temporario: los propietarios
          reportan daños o robos de huéspedes, y cualquiera puede consultar el
          historial de un huésped antes de aceptar una reserva.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-lg border border-neutral-200 bg-white p-4 transition hover:border-neutral-400"
          >
            <div className="text-2xl font-bold text-red-300">{stat.value}</div>
            <div className="text-sm text-neutral-500">{stat.label}</div>
          </Link>
        ))}
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="font-semibold text-teal-700">Flujo de prueba sugerido</h2>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-neutral-600 marker:text-red-300">
          <li>
            Creá un <Link className="text-teal-400 underline hover:text-teal-600" href="/usuarios">propietario y un huésped</Link>.
          </li>
          <li>
            Cargá una <Link className="text-teal-400 underline hover:text-teal-600" href="/propiedades">propiedad</Link> para el propietario.
          </li>
          <li>
            Registrá una <Link className="text-teal-400 underline hover:text-teal-600" href="/reservas">reserva</Link> del huésped en esa propiedad.
          </li>
          <li>
            Si hubo un daño o robo, cargá un <Link className="text-teal-400 underline hover:text-teal-600" href="/reportes">reporte</Link>.
          </li>
          <li>
            Antes de aceptar a un huésped, <Link className="text-teal-400 underline hover:text-teal-600" href="/buscar">consultá su score</Link> por email.
          </li>
        </ol>
      </div>
    </div>
  );
}

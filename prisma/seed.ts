import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.consulta.deleteMany();
  await prisma.reporte.deleteMany();
  await prisma.reserva.deleteMany();
  await prisma.propiedad.deleteMany();
  await prisma.suscripcion.deleteMany();
  await prisma.kycVerificacion.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.tarifaConsulta.deleteMany();

  const propietario1 = await prisma.usuario.create({
    data: {
      nombre: "Marina Ferreyra",
      email: "marina@propietarios.com",
      dni: "28456123",
      telefono: "+54 9 11 5555-0101",
      rol: "PROPIETARIO",
    },
  });

  const propietario2 = await prisma.usuario.create({
    data: {
      nombre: "Julián Ibarra",
      email: "julian@propietarios.com",
      dni: "27891234",
      telefono: "+54 9 11 5555-0102",
      rol: "PROPIETARIO",
    },
  });

  const huespedBueno = await prisma.usuario.create({
    data: {
      nombre: "Camila Sosa",
      email: "camila.sosa@mail.com",
      dni: "34567890",
      telefono: "+54 9 11 5555-0201",
      rol: "HUESPED",
      kyc: { create: { estado: "VERIFICADO", proveedor: "renaper-kyc", verificadoEn: new Date() } },
    },
  });

  const huespedProblema = await prisma.usuario.create({
    data: {
      nombre: "Nicolás Duarte",
      email: "nicolas.duarte@mail.com",
      dni: "30123456",
      telefono: "+54 9 11 5555-0202",
      rol: "HUESPED",
      kyc: { create: { estado: "PENDIENTE", proveedor: "manual" } },
    },
  });

  const inmobiliaria = await prisma.usuario.create({
    data: {
      nombre: "Administradora Costa Alta",
      email: "contacto@costaalta.com",
      dni: "31234567",
      rol: "INMOBILIARIA",
      kyc: { create: { estado: "VERIFICADO", proveedor: "padron-simulado", verificadoEn: new Date() } },
      suscripcion: { create: { plan: "INMOBILIARIA", consultasIncluidas: 500 } },
    },
  });

  const propiedad1 = await prisma.propiedad.create({
    data: {
      propietarioId: propietario1.id,
      titulo: "Depto 2 ambientes frente al mar",
      direccion: "Av. Costanera 450",
      ciudad: "Mar del Plata",
      tipo: "Departamento",
      amueblado: true,
    },
  });

  const propiedad2 = await prisma.propiedad.create({
    data: {
      propietarioId: propietario2.id,
      titulo: "Casa quinta con pileta",
      direccion: "Los Aromos 1200",
      ciudad: "Villa Carlos Paz",
      tipo: "Casa",
      amueblado: true,
    },
  });

  await prisma.reserva.create({
    data: {
      propiedadId: propiedad1.id,
      huespedId: huespedBueno.id,
      checkIn: new Date("2026-01-05"),
      checkOut: new Date("2026-01-12"),
      estado: "FINALIZADA",
    },
  });

  const reservaProblema1 = await prisma.reserva.create({
    data: {
      propiedadId: propiedad1.id,
      huespedId: huespedProblema.id,
      checkIn: new Date("2025-12-20"),
      checkOut: new Date("2025-12-27"),
      estado: "FINALIZADA",
    },
  });

  const reservaProblema2 = await prisma.reserva.create({
    data: {
      propiedadId: propiedad2.id,
      huespedId: huespedProblema.id,
      checkIn: new Date("2026-02-01"),
      checkOut: new Date("2026-02-05"),
      estado: "FINALIZADA",
    },
  });

  await prisma.reporte.create({
    data: {
      reservaId: reservaProblema1.id,
      huespedId: huespedProblema.id,
      propietarioId: propietario1.id,
      tipo: "DAÑO",
      descripcion: "Rotura de televisor y mesa de living, no reportada por el huésped.",
      monto: 180000,
      estado: "VERIFICADO",
    },
  });

  await prisma.reporte.create({
    data: {
      reservaId: reservaProblema2.id,
      huespedId: huespedProblema.id,
      propietarioId: propietario2.id,
      tipo: "ROBO",
      descripcion: "Faltante de utensilios de cocina y ropa de blanco al finalizar la estadía.",
      monto: 45000,
      estado: "PENDIENTE",
    },
  });

  await prisma.tarifaConsulta.createMany({
    data: [
      { tramo: "GRATIS", desde: 1, hasta: 3, precioPorConsulta: 0, precioAbono: null },
      { tramo: "BASICO", desde: 4, hasta: 10, precioPorConsulta: 1500, precioAbono: null },
      { tramo: "ABONO", desde: 11, hasta: null, precioPorConsulta: null, precioAbono: 25000 },
    ],
  });

  const admin = await prisma.usuario.create({
    data: {
      nombre: "Soledad Vidal",
      email: "soledad.vidal@guestcore.com",
      dni: "29112233",
      rol: "ADMIN",
      nivel: 3,
    },
  });

  const gestorTarifas = await prisma.usuario.create({
    data: {
      nombre: "Tomás Pereyra",
      email: "tomas.pereyra@guestcore.com",
      dni: "26778899",
      rol: "ADMIN",
      nivel: 2,
    },
  });

  await prisma.consulta.create({
    data: {
      usuarioId: propietario2.id,
      huespedBuscado: huespedProblema.dni ?? "",
      numeroEnElMes: 1,
      tramo: "GRATIS",
      costoAplicado: 0,
    },
  });

  console.log("Seed completado:");
  console.log({ propietario1, propietario2, huespedBueno, huespedProblema, inmobiliaria, admin, gestorTarifas });
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

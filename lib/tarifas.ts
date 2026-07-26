import type { TramoConsulta } from "@/app/generated/prisma/client";

// Los tramos (cuántas consultas mensuales entran en cada uno) son fijos por
// decisión de producto: sólo el precio de cada tramo se puede editar, no los
// límites. 1-3 gratis, 4-10 básico (por consulta), 11+ abono (ilimitado).
export function calcularTramo(numeroEnElMes: number): TramoConsulta {
  if (numeroEnElMes <= 3) return "GRATIS";
  if (numeroEnElMes <= 10) return "BASICO";
  return "ABONO";
}

export const ETIQUETA_TRAMO: Record<TramoConsulta, string> = {
  GRATIS: "Gratis (1-3/mes)",
  BASICO: "Básico (4-10/mes)",
  ABONO: "Abono (11+/mes, ilimitado)",
};

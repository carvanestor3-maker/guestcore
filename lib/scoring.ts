import type { Reporte } from "@/app/generated/prisma/client";

export type NivelRiesgo = "bajo" | "medio" | "alto";

export function calcularScore(reportes: Pick<Reporte, "estado">[]): number {
  let score = 100;
  for (const reporte of reportes) {
    if (reporte.estado === "VERIFICADO") score -= 20;
    else if (reporte.estado === "PENDIENTE") score -= 5;
  }
  return Math.max(0, Math.min(100, score));
}

export function nivelDeRiesgo(score: number): NivelRiesgo {
  if (score >= 80) return "bajo";
  if (score >= 50) return "medio";
  return "alto";
}

export const ETIQUETA_RIESGO: Record<NivelRiesgo, string> = {
  bajo: "Buen huésped",
  medio: "Precaución",
  alto: "Riesgo alto",
};

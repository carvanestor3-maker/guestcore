import { normalizarDni } from "@/lib/identity";

export type PersonaPadron = { dni: string; nombreCompleto: string };

/**
 * Simulación de un padrón de identidad (tipo RENAPER) para el ambiente de
 * prueba. No existe una API pública del Estado argentino para consultas de
 * terceros DNI -> nombre: una integración real requiere contratar un
 * proveedor de KYC certificado (ver memoria del proyecto). Esta función tiene
 * la misma forma que tendría esa integración real, para poder reemplazarla
 * sin tocar el resto de la app.
 */
const PADRON_SIMULADO: PersonaPadron[] = [
  { dni: "34567890", nombreCompleto: "Camila Sosa" },
  { dni: "30123456", nombreCompleto: "Nicolás Duarte" },
  { dni: "28456123", nombreCompleto: "Marina Ferreyra" },
  { dni: "27891234", nombreCompleto: "Julián Ibarra" },
  { dni: "35678901", nombreCompleto: "Lucía Beltrán" },
  { dni: "32456789", nombreCompleto: "Federico Aguirre" },
];

export async function consultarPersonaPorDni(dniCrudo: string): Promise<PersonaPadron | null> {
  const dni = normalizarDni(dniCrudo);
  if (!dni) return null;

  // Simula la latencia de red de un proveedor externo real.
  await new Promise((resolve) => setTimeout(resolve, 250));

  return PADRON_SIMULADO.find((persona) => persona.dni === dni) ?? null;
}

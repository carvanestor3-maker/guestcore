import { randomBytes, createHash, randomInt } from "node:crypto";

export function generarClaveSegura(): string {
  return randomBytes(24).toString("base64url");
}

export function hashClave(clave: string): string {
  return createHash("sha256").update(clave).digest("hex");
}

const PALABRAS_ALIAS = [
  "sol", "luna", "rio", "monte", "cielo", "mar", "viento", "piedra", "arbol", "flor",
  "nube", "estrella", "fuego", "agua", "tierra", "bosque", "valle", "puente", "camino", "sombra",
  "luz", "roca", "hoja", "rama", "semilla", "raiz", "lago", "isla", "playa", "duna",
  "trueno", "rayo", "lluvia", "nieve", "hielo", "brisa", "aurora", "ocaso", "alba", "niebla",
  "zorro", "lobo", "aguila", "halcon", "tigre", "leon", "oso", "ciervo", "conejo", "buho",
  "gato", "perro", "caballo", "delfin", "ballena", "tortuga", "colibri", "jaguar", "puma", "lince",
];

/**
 * Alias tipo CBU ("palabra.palabra.palabra") para que una clave sea fácil de
 * leer y comunicar de forma manual. Mucha menos entropía que una clave
 * aleatoria en base64 (con esta lista de 60 palabras, ~3 al cubo = 216.000
 * combinaciones) — sirve para identificar/comunicar, no para proteger algo
 * de alto valor. No usar este formato para las claves de nivel 2 generadas
 * por `generarClaveSegura`, que sí necesitan alta entropía.
 */
export function generarAliasPalabras(cantidad = 3): string {
  const elegidas: string[] = [];
  while (elegidas.length < cantidad) {
    const palabra = PALABRAS_ALIAS[randomInt(PALABRAS_ALIAS.length)];
    if (!elegidas.includes(palabra)) elegidas.push(palabra);
  }
  return elegidas.join(".");
}

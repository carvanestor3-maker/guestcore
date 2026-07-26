/**
 * Claves maestras de nivel 4 — fijas en el código fuente para arrancar las
 * pruebas del sistema antes de tener un flujo real de generación/rotación.
 * A propósito NO viven en la base de datos ni en variables de entorno: sólo
 * cambian si se edita este archivo y se vuelve a compilar/desplegar el
 * software, tal como se pidió.
 *
 * Formato tipo alias de CBU bancario ("palabra.palabra.palabra") para que
 * sean fáciles de leer y comunicar. Esto las hace mucho más adivinables que
 * una clave aleatoria en base64 — son para arrancar pruebas, no para
 * proteger algo de alto valor.
 *
 * Importante para producción: al ser literales de código, quedan visibles
 * para cualquiera con acceso al repositorio. Antes de un uso real conviene
 * rotarlas y moverlas a un gestor de secretos fuera del control de
 * versiones.
 */
export const CLAVES_MAESTRAS_NIVEL_4: readonly string[] = [
  "lobo.perro.puente",
  "lluvia.duna.valle",
  "flor.brisa.hielo",
];

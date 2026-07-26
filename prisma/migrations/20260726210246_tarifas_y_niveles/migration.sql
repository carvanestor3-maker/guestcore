-- CreateTable
CREATE TABLE "TarifaConsulta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tramo" TEXT NOT NULL,
    "desde" INTEGER NOT NULL,
    "hasta" INTEGER,
    "precioPorConsulta" REAL,
    "precioAbono" REAL,
    "actualizadoEn" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Consulta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "huespedBuscado" TEXT NOT NULL,
    "numeroEnElMes" INTEGER NOT NULL,
    "tramo" TEXT NOT NULL,
    "costoAplicado" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Consulta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Consulta" ("id", "usuarioId", "huespedBuscado", "numeroEnElMes", "tramo", "costoAplicado", "createdAt")
SELECT "id", "usuarioId", "huespedBuscado", 1, 'GRATIS', 0, "createdAt" FROM "Consulta";
DROP TABLE "Consulta";
ALTER TABLE "new_Consulta" RENAME TO "Consulta";
CREATE TABLE "new_Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "dni" TEXT,
    "telefono" TEXT,
    "rol" TEXT NOT NULL,
    "nivel" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Usuario" ("id", "nombre", "email", "dni", "telefono", "rol", "nivel", "createdAt")
SELECT "id", "nombre", "email", "dni", "telefono", "rol", CASE WHEN "rol" = 'ADMIN' THEN 3 ELSE 1 END, "createdAt" FROM "Usuario";
DROP TABLE "Usuario";
ALTER TABLE "new_Usuario" RENAME TO "Usuario";
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");
CREATE UNIQUE INDEX "Usuario_dni_key" ON "Usuario"("dni");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "TarifaConsulta_tramo_key" ON "TarifaConsulta"("tramo");

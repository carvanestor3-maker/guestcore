-- CreateTable
CREATE TABLE "PadronManual" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dni" TEXT NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "cargadoPorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PadronManual_cargadoPorId_fkey" FOREIGN KEY ("cargadoPorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ClaveAcceso" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "claveHash" TEXT NOT NULL,
    "generadaPorId" TEXT,
    "generadaConClaveMaestra" BOOLEAN NOT NULL DEFAULT false,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClaveAcceso_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClaveAcceso_generadaPorId_fkey" FOREIGN KEY ("generadaPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ClaveAcceso" ("activa", "claveHash", "createdAt", "generadaPorId", "id", "usuarioId") SELECT "activa", "claveHash", "createdAt", "generadaPorId", "id", "usuarioId" FROM "ClaveAcceso";
DROP TABLE "ClaveAcceso";
ALTER TABLE "new_ClaveAcceso" RENAME TO "ClaveAcceso";
CREATE UNIQUE INDEX "ClaveAcceso_usuarioId_key" ON "ClaveAcceso"("usuarioId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PadronManual_dni_key" ON "PadronManual"("dni");

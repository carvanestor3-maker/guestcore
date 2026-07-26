-- CreateTable
CREATE TABLE "ClaveAcceso" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "claveHash" TEXT NOT NULL,
    "generadaPorId" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClaveAcceso_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClaveAcceso_generadaPorId_fkey" FOREIGN KEY ("generadaPorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ClaveAcceso_usuarioId_key" ON "ClaveAcceso"("usuarioId");

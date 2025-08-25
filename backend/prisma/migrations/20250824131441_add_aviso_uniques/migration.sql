/*
  Warnings:

  - A unique constraint covering the columns `[tipo,stockId]` on the table `Aviso` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tipo,herramientaId]` on the table `Aviso` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Aviso_tipo_stockId_key" ON "Aviso"("tipo", "stockId");

-- CreateIndex
CREATE UNIQUE INDEX "Aviso_tipo_herramientaId_key" ON "Aviso"("tipo", "herramientaId");

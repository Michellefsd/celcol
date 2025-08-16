/*
  Warnings:

  - A unique constraint covering the columns `[tipo,avionId]` on the table `Aviso` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Aviso_tipo_avionId_key" ON "Aviso"("tipo", "avionId");

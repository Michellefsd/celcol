/*
  Warnings:

  - A unique constraint covering the columns `[ordenId,empleadoId,rol]` on the table `EmpleadoAsignado` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "RolEmpleado" AS ENUM ('TECNICO', 'CERTIFICADOR');

-- DropForeignKey
ALTER TABLE "RegistroDeTrabajo" DROP CONSTRAINT "RegistroDeTrabajo_ordenId_fkey";

-- AlterTable
ALTER TABLE "RegistroDeTrabajo" ADD COLUMN     "rol" "RolEmpleado" NOT NULL DEFAULT 'TECNICO',
ADD COLUMN     "trabajoRealizado" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "EmpleadoAsignado_ordenId_empleadoId_rol_key" ON "EmpleadoAsignado"("ordenId", "empleadoId", "rol");

-- CreateIndex
CREATE INDEX "RegistroDeTrabajo_ordenId_fecha_idx" ON "RegistroDeTrabajo"("ordenId", "fecha");

-- CreateIndex
CREATE INDEX "RegistroDeTrabajo_empleadoId_fecha_idx" ON "RegistroDeTrabajo"("empleadoId", "fecha");

-- AddForeignKey
ALTER TABLE "RegistroDeTrabajo" ADD CONSTRAINT "RegistroDeTrabajo_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "OrdenTrabajo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

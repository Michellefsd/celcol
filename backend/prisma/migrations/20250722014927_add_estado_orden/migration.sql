-- CreateEnum
CREATE TYPE "EstadoOrden" AS ENUM ('ABIERTA', 'CERRADA', 'CANCELADA');

-- AlterTable
ALTER TABLE "OrdenTrabajo" ADD COLUMN     "estadoOrden" "EstadoOrden" NOT NULL DEFAULT 'ABIERTA';

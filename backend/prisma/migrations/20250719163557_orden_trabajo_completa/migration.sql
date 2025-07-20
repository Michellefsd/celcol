-- AlterTable
ALTER TABLE "OrdenTrabajo" ADD COLUMN     "archivoFactura" TEXT,
ADD COLUMN     "inspeccionRecibida" BOOLEAN,
ADD COLUMN     "observaciones" TEXT,
ADD COLUMN     "solicitadoPor" TEXT;

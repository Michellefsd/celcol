-- AlterTable
ALTER TABLE "OrdenTrabajo" ADD COLUMN     "datosAvionSnapshot" JSONB,
ADD COLUMN     "datosComponenteSnapshot" JSONB,
ADD COLUMN     "datosPropietarioSnapshot" JSONB;

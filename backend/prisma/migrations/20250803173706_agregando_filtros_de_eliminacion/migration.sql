-- AlterTable
ALTER TABLE "Avion" ADD COLUMN     "eliminado" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ComponenteExterno" ADD COLUMN     "eliminado" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Propietario" ADD COLUMN     "eliminado" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Stock" ADD COLUMN     "eliminado" BOOLEAN NOT NULL DEFAULT false;

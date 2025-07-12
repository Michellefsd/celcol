/*
  Warnings:

  - The `tipoLicencia` column on the `Empleado` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `archivo8130` on the `Herramienta` table. All the data in the column will be lost.
  - You are about to drop the column `archivoFactura` on the `Stock` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TipoLicencia" AS ENUM ('AERONAVE', 'MOTOR', 'AVIÓNICA');

-- AlterTable
ALTER TABLE "Empleado" ADD COLUMN     "carneSalud" TEXT,
DROP COLUMN "tipoLicencia",
ADD COLUMN     "tipoLicencia" "TipoLicencia"[];

-- AlterTable
ALTER TABLE "Herramienta" DROP COLUMN "archivo8130";

-- AlterTable
ALTER TABLE "Stock" DROP COLUMN "archivoFactura",
ADD COLUMN     "archivo" TEXT;

/*
  Warnings:

  - You are about to drop the column `eliminado` on the `Avion` table. All the data in the column will be lost.
  - You are about to drop the column `eliminado` on the `ComponenteExterno` table. All the data in the column will be lost.
  - You are about to drop the column `eliminado` on the `Propietario` table. All the data in the column will be lost.
  - You are about to drop the column `eliminado` on the `Stock` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Avion" DROP COLUMN "eliminado",
ADD COLUMN     "archivado" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ComponenteExterno" DROP COLUMN "eliminado",
ADD COLUMN     "archivado" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Propietario" DROP COLUMN "eliminado",
ADD COLUMN     "archivado" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Stock" DROP COLUMN "eliminado",
ADD COLUMN     "archivado" BOOLEAN NOT NULL DEFAULT false;

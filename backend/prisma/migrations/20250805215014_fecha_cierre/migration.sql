/*
  Warnings:

  - You are about to drop the column `fechaCierre` on the `Stock` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OrdenTrabajo" ADD COLUMN     "fechaCierre" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Stock" DROP COLUMN "fechaCierre";

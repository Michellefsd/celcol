-- AlterTable
ALTER TABLE "Aviso" ADD COLUMN     "avionId" INTEGER;

-- AddForeignKey
ALTER TABLE "Aviso" ADD CONSTRAINT "Aviso_avionId_fkey" FOREIGN KEY ("avionId") REFERENCES "Avion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

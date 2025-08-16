-- CreateTable
CREATE TABLE "FacturaStock" (
    "id" SERIAL NOT NULL,
    "stockId" INTEGER NOT NULL,
    "numero" VARCHAR(64),
    "proveedor" VARCHAR(128),
    "fecha" TIMESTAMP(3),
    "monto" DECIMAL(12,2),
    "moneda" VARCHAR(8),
    "archivo" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacturaStock_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FacturaStock" ADD CONSTRAINT "FacturaStock_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

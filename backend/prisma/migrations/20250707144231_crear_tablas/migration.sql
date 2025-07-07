-- CreateEnum
CREATE TYPE "EstadoFactura" AS ENUM ('NO_ENVIADA', 'ENVIADA', 'COBRADA');

-- CreateEnum
CREATE TYPE "Estado" AS ENUM ('ACTIVO', 'DESINSTALADO', 'MANTENIMIENTO');

-- CreateEnum
CREATE TYPE "TipoPropietario" AS ENUM ('PERSONA', 'INSTITUCION');

-- CreateTable
CREATE TABLE "Avion" (
    "id" SERIAL NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "numeroSerie" TEXT,
    "matricula" TEXT NOT NULL,
    "TSN" DOUBLE PRECISION,
    "vencimientoMatricula" TIMESTAMP(3),
    "vencimientoSeguro" TIMESTAMP(3),
    "certificadoMatricula" TEXT,

    CONSTRAINT "Avion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComponenteAvion" (
    "id" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "marca" TEXT,
    "modelo" TEXT,
    "numeroSerie" TEXT,
    "estado" "Estado" NOT NULL DEFAULT 'ACTIVO',
    "TSN" DOUBLE PRECISION,
    "TSO" DOUBLE PRECISION,
    "TBOFecha" TIMESTAMP(3),
    "TBOHoras" INTEGER,
    "avionId" INTEGER NOT NULL,

    CONSTRAINT "ComponenteAvion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComponenteExterno" (
    "id" SERIAL NOT NULL,
    "tipo" TEXT,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "numeroSerie" TEXT NOT NULL,
    "numeroParte" TEXT,
    "TSN" DOUBLE PRECISION,
    "TSO" DOUBLE PRECISION,
    "TBOFecha" TIMESTAMP(3),
    "TBOHoras" INTEGER,
    "archivo8130" TEXT,
    "propietarioId" INTEGER NOT NULL,

    CONSTRAINT "ComponenteExterno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Propietario" (
    "id" SERIAL NOT NULL,
    "tipoPropietario" "TipoPropietario" NOT NULL DEFAULT 'PERSONA',
    "nombre" TEXT,
    "apellido" TEXT,
    "nombreEmpresa" TEXT,
    "rut" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "direccion" TEXT,

    CONSTRAINT "Propietario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvionPropietario" (
    "id" SERIAL NOT NULL,
    "avionId" INTEGER NOT NULL,
    "propietarioId" INTEGER NOT NULL,

    CONSTRAINT "AvionPropietario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Empleado" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT NOT NULL,
    "esCertificador" BOOLEAN NOT NULL DEFAULT false,
    "esTecnico" BOOLEAN NOT NULL DEFAULT false,
    "direccion" TEXT,
    "tipoLicencia" TEXT,
    "numeroLicencia" TEXT,
    "vencimientoLicencia" TIMESTAMP(3),
    "fechaAlta" TIMESTAMP(3),
    "horasTrabajadas" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "Empleado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Herramienta" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT,
    "marca" TEXT,
    "modelo" TEXT,
    "numeroSerie" TEXT,
    "fechaIngreso" TIMESTAMP(3),
    "fechaVencimiento" TIMESTAMP(3),
    "certificadoCalibracion" TEXT,
    "archivo8130" TEXT,

    CONSTRAINT "Herramienta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stock" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipoProducto" TEXT,
    "codigoBarras" TEXT,
    "notasInternas" TEXT,
    "marca" TEXT,
    "modelo" TEXT,
    "numeroSerie" TEXT,
    "puedeSerVendido" BOOLEAN NOT NULL DEFAULT false,
    "puedeSerComprado" BOOLEAN NOT NULL DEFAULT false,
    "precioVenta" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "coste" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unidadMedida" TEXT,
    "cantidad" INTEGER NOT NULL,
    "stockMinimo" INTEGER NOT NULL,
    "fechaIngreso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "imagen" TEXT,
    "archivoFactura" TEXT,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdenTrabajo" (
    "id" SERIAL NOT NULL,
    "fechaApertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avionId" INTEGER,
    "componenteId" INTEGER,
    "solicitud" TEXT NOT NULL,
    "OTsolicitud" TEXT,
    "solicitudFirma" TEXT,
    "danosPrevios" TEXT,
    "accionTomada" TEXT,
    "numeroFactura" TEXT,
    "estadoFactura" "EstadoFactura" NOT NULL DEFAULT 'NO_ENVIADA',

    CONSTRAINT "OrdenTrabajo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmpleadoAsignado" (
    "id" SERIAL NOT NULL,
    "ordenId" INTEGER NOT NULL,
    "empleadoId" INTEGER NOT NULL,

    CONSTRAINT "EmpleadoAsignado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdenStock" (
    "id" SERIAL NOT NULL,
    "ordenId" INTEGER NOT NULL,
    "stockId" INTEGER NOT NULL,
    "cantidadUtilizada" INTEGER NOT NULL,

    CONSTRAINT "OrdenStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdenHerramienta" (
    "id" SERIAL NOT NULL,
    "ordenId" INTEGER NOT NULL,
    "herramientaId" INTEGER NOT NULL,

    CONSTRAINT "OrdenHerramienta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroDeTrabajo" (
    "id" SERIAL NOT NULL,
    "ordenId" INTEGER NOT NULL,
    "empleadoId" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "horas" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "RegistroDeTrabajo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Avion_matricula_key" ON "Avion"("matricula");

-- CreateIndex
CREATE UNIQUE INDEX "OrdenTrabajo_numeroFactura_key" ON "OrdenTrabajo"("numeroFactura");

-- AddForeignKey
ALTER TABLE "ComponenteAvion" ADD CONSTRAINT "ComponenteAvion_avionId_fkey" FOREIGN KEY ("avionId") REFERENCES "Avion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponenteExterno" ADD CONSTRAINT "ComponenteExterno_propietarioId_fkey" FOREIGN KEY ("propietarioId") REFERENCES "Propietario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvionPropietario" ADD CONSTRAINT "AvionPropietario_avionId_fkey" FOREIGN KEY ("avionId") REFERENCES "Avion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvionPropietario" ADD CONSTRAINT "AvionPropietario_propietarioId_fkey" FOREIGN KEY ("propietarioId") REFERENCES "Propietario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenTrabajo" ADD CONSTRAINT "OrdenTrabajo_avionId_fkey" FOREIGN KEY ("avionId") REFERENCES "Avion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenTrabajo" ADD CONSTRAINT "OrdenTrabajo_componenteId_fkey" FOREIGN KEY ("componenteId") REFERENCES "ComponenteExterno"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmpleadoAsignado" ADD CONSTRAINT "EmpleadoAsignado_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "OrdenTrabajo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmpleadoAsignado" ADD CONSTRAINT "EmpleadoAsignado_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "Empleado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenStock" ADD CONSTRAINT "OrdenStock_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "OrdenTrabajo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenStock" ADD CONSTRAINT "OrdenStock_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenHerramienta" ADD CONSTRAINT "OrdenHerramienta_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "OrdenTrabajo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenHerramienta" ADD CONSTRAINT "OrdenHerramienta_herramientaId_fkey" FOREIGN KEY ("herramientaId") REFERENCES "Herramienta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroDeTrabajo" ADD CONSTRAINT "RegistroDeTrabajo_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "OrdenTrabajo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroDeTrabajo" ADD CONSTRAINT "RegistroDeTrabajo_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "Empleado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

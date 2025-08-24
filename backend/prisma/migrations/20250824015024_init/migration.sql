-- CreateEnum
CREATE TYPE "EstadoFactura" AS ENUM ('NO_ENVIADA', 'ENVIADA', 'COBRADA');

-- CreateEnum
CREATE TYPE "Estado" AS ENUM ('ACTIVO', 'DESINSTALADO', 'MANTENIMIENTO');

-- CreateEnum
CREATE TYPE "TipoPropietario" AS ENUM ('PERSONA', 'INSTITUCION');

-- CreateEnum
CREATE TYPE "TipoLicencia" AS ENUM ('AERONAVE', 'MOTOR', 'AVIONICA');

-- CreateEnum
CREATE TYPE "EstadoOrden" AS ENUM ('ABIERTA', 'CERRADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "RolEmpleado" AS ENUM ('TECNICO', 'CERTIFICADOR');

-- CreateEnum
CREATE TYPE "RolEmpleadoAsignado" AS ENUM ('TECNICO', 'CERTIFICADOR');

-- CreateEnum
CREATE TYPE "EstadoUsuario" AS ENUM ('INVITADO', 'ACTIVO', 'BLOQUEADO');

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
    "certificadoMatriculaId" INTEGER,
    "archivado" BOOLEAN NOT NULL DEFAULT false,

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
    "archivo8130Id" INTEGER,
    "propietarioId" INTEGER NOT NULL,
    "archivado" BOOLEAN NOT NULL DEFAULT false,

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
    "archivado" BOOLEAN NOT NULL DEFAULT false,

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
    "tipoLicencia" "TipoLicencia"[],
    "numeroLicencia" TEXT,
    "vencimientoLicencia" TIMESTAMP(3),
    "fechaAlta" TIMESTAMP(3),
    "carneSaludId" INTEGER,
    "horasTrabajadas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "archivado" BOOLEAN NOT NULL DEFAULT false,

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
    "certificadoCalibracionId" INTEGER,
    "archivado" BOOLEAN NOT NULL DEFAULT false,

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
    "imagenId" INTEGER,
    "archivoId" INTEGER,
    "archivado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacturaStock" (
    "id" SERIAL NOT NULL,
    "stockId" INTEGER NOT NULL,
    "numero" VARCHAR(64),
    "proveedor" VARCHAR(128),
    "fecha" TIMESTAMP(3),
    "monto" DECIMAL(12,2),
    "moneda" VARCHAR(8),
    "archivo" TEXT,
    "archivoId" INTEGER,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacturaStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdenTrabajo" (
    "id" SERIAL NOT NULL,
    "fechaApertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaCierre" TIMESTAMP(3),
    "fechaCancelacion" TIMESTAMP(3),
    "estadoOrden" "EstadoOrden" NOT NULL DEFAULT 'ABIERTA',
    "archivada" BOOLEAN NOT NULL DEFAULT false,
    "avionId" INTEGER,
    "componenteId" INTEGER,
    "solicitud" TEXT,
    "OTsolicitud" TEXT,
    "solicitadoPor" TEXT,
    "solicitudFirmaId" INTEGER,
    "inspeccionRecibida" BOOLEAN,
    "danosPrevios" TEXT,
    "accionTomada" TEXT,
    "observaciones" TEXT,
    "numeroFactura" TEXT,
    "estadoFactura" "EstadoFactura" NOT NULL DEFAULT 'NO_ENVIADA',
    "archivoFacturaId" INTEGER,
    "datosAvionSnapshot" JSONB,
    "datosComponenteSnapshot" JSONB,
    "datosPropietarioSnapshot" JSONB,

    CONSTRAINT "OrdenTrabajo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmpleadoAsignado" (
    "id" SERIAL NOT NULL,
    "ordenId" INTEGER NOT NULL,
    "empleadoId" INTEGER NOT NULL,
    "rol" "RolEmpleadoAsignado",

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
    "trabajoRealizado" TEXT,
    "rol" "RolEmpleado" NOT NULL DEFAULT 'TECNICO',

    CONSTRAINT "RegistroDeTrabajo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Aviso" (
    "id" SERIAL NOT NULL,
    "mensaje" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "herramientaId" INTEGER,
    "stockId" INTEGER,
    "avionId" INTEGER,

    CONSTRAINT "Aviso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "keycloakSub" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "empleadoId" INTEGER,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Archivo" (
    "id" SERIAL NOT NULL,
    "originalName" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "sizeOriginal" INTEGER NOT NULL,
    "sizeAlmacen" INTEGER NOT NULL,
    "ancho" INTEGER,
    "alto" INTEGER,
    "hashSha256" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "urlPublica" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ordenId" INTEGER,

    CONSTRAINT "Archivo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Avion_matricula_key" ON "Avion"("matricula");

-- CreateIndex
CREATE UNIQUE INDEX "FacturaStock_archivoId_key" ON "FacturaStock"("archivoId");

-- CreateIndex
CREATE UNIQUE INDEX "OrdenTrabajo_numeroFactura_key" ON "OrdenTrabajo"("numeroFactura");

-- CreateIndex
CREATE UNIQUE INDEX "EmpleadoAsignado_ordenId_empleadoId_rol_key" ON "EmpleadoAsignado"("ordenId", "empleadoId", "rol");

-- CreateIndex
CREATE INDEX "RegistroDeTrabajo_ordenId_fecha_idx" ON "RegistroDeTrabajo"("ordenId", "fecha");

-- CreateIndex
CREATE INDEX "RegistroDeTrabajo_empleadoId_fecha_idx" ON "RegistroDeTrabajo"("empleadoId", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "Aviso_tipo_avionId_key" ON "Aviso"("tipo", "avionId");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_keycloakSub_key" ON "Usuario"("keycloakSub");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_empleadoId_key" ON "Usuario"("empleadoId");

-- AddForeignKey
ALTER TABLE "Avion" ADD CONSTRAINT "Avion_certificadoMatriculaId_fkey" FOREIGN KEY ("certificadoMatriculaId") REFERENCES "Archivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponenteAvion" ADD CONSTRAINT "ComponenteAvion_avionId_fkey" FOREIGN KEY ("avionId") REFERENCES "Avion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponenteExterno" ADD CONSTRAINT "ComponenteExterno_archivo8130Id_fkey" FOREIGN KEY ("archivo8130Id") REFERENCES "Archivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponenteExterno" ADD CONSTRAINT "ComponenteExterno_propietarioId_fkey" FOREIGN KEY ("propietarioId") REFERENCES "Propietario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvionPropietario" ADD CONSTRAINT "AvionPropietario_avionId_fkey" FOREIGN KEY ("avionId") REFERENCES "Avion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvionPropietario" ADD CONSTRAINT "AvionPropietario_propietarioId_fkey" FOREIGN KEY ("propietarioId") REFERENCES "Propietario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Empleado" ADD CONSTRAINT "Empleado_carneSaludId_fkey" FOREIGN KEY ("carneSaludId") REFERENCES "Archivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Herramienta" ADD CONSTRAINT "Herramienta_certificadoCalibracionId_fkey" FOREIGN KEY ("certificadoCalibracionId") REFERENCES "Archivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_archivoId_fkey" FOREIGN KEY ("archivoId") REFERENCES "Archivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_imagenId_fkey" FOREIGN KEY ("imagenId") REFERENCES "Archivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaStock" ADD CONSTRAINT "FacturaStock_archivoId_fkey" FOREIGN KEY ("archivoId") REFERENCES "Archivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaStock" ADD CONSTRAINT "FacturaStock_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenTrabajo" ADD CONSTRAINT "OrdenTrabajo_archivoFacturaId_fkey" FOREIGN KEY ("archivoFacturaId") REFERENCES "Archivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenTrabajo" ADD CONSTRAINT "OrdenTrabajo_avionId_fkey" FOREIGN KEY ("avionId") REFERENCES "Avion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenTrabajo" ADD CONSTRAINT "OrdenTrabajo_componenteId_fkey" FOREIGN KEY ("componenteId") REFERENCES "ComponenteExterno"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenTrabajo" ADD CONSTRAINT "OrdenTrabajo_solicitudFirmaId_fkey" FOREIGN KEY ("solicitudFirmaId") REFERENCES "Archivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmpleadoAsignado" ADD CONSTRAINT "EmpleadoAsignado_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "Empleado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmpleadoAsignado" ADD CONSTRAINT "EmpleadoAsignado_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "OrdenTrabajo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenStock" ADD CONSTRAINT "OrdenStock_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "OrdenTrabajo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenStock" ADD CONSTRAINT "OrdenStock_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenHerramienta" ADD CONSTRAINT "OrdenHerramienta_herramientaId_fkey" FOREIGN KEY ("herramientaId") REFERENCES "Herramienta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenHerramienta" ADD CONSTRAINT "OrdenHerramienta_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "OrdenTrabajo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroDeTrabajo" ADD CONSTRAINT "RegistroDeTrabajo_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "Empleado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroDeTrabajo" ADD CONSTRAINT "RegistroDeTrabajo_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "OrdenTrabajo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aviso" ADD CONSTRAINT "Aviso_avionId_fkey" FOREIGN KEY ("avionId") REFERENCES "Avion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aviso" ADD CONSTRAINT "Aviso_herramientaId_fkey" FOREIGN KEY ("herramientaId") REFERENCES "Herramienta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aviso" ADD CONSTRAINT "Aviso_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "Empleado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

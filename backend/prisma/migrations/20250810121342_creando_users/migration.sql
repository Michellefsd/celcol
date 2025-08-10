-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'TECNICO', 'CERTIFICADOR', 'LECTOR');

-- CreateEnum
CREATE TYPE "EstadoUsuario" AS ENUM ('INVITADO', 'ACTIVO', 'BLOQUEADO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "estado" "EstadoUsuario" NOT NULL DEFAULT 'INVITADO',
    "hash" TEXT,
    "rol" "Rol" NOT NULL,
    "empleadoId" INTEGER,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "refreshJti" TEXT,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAudit" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER,
    "email" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "exito" BOOLEAN NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "Empleado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginAudit" ADD CONSTRAINT "LoginAudit_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

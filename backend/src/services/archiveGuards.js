// src/services/archiveGuards.js  (ESM, 3 estados: ABIERTA/CERRADA/CANCELADA)
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ÚNICO estado abierto
export const OPEN_STATE = 'ABIERTA';

// Helper para evitar repetir (usa estadoOrden)
const whereOrdenAbierta = { is: { estadoOrden: OPEN_STATE } };

/**
 * EMPLEADO: bloquea si está en una OT ABIERTA (asignado o con registro de trabajo)
 */
export async function empleadoEnOtAbierta(empleadoId) {
  const asignacion = await prisma.empleadoAsignado.findFirst({
    where: { empleadoId, orden: whereOrdenAbierta },
    select: { id: true },
  });
  if (asignacion) return true;

  const registro = await prisma.registroDeTrabajo.findFirst({
    where: { empleadoId, orden: whereOrdenAbierta },
    select: { id: true },
  });
  return !!registro;
}

/**
 * HERRAMIENTA: bloquea si aparece en una OT ABIERTA
 */
export async function herramientaEnOtAbierta(herramientaId) {
  const uso = await prisma.ordenHerramienta.findFirst({
    where: { herramientaId, orden: whereOrdenAbierta },
    select: { id: true },
  });
  return !!uso;
}

/**
 * STOCK: bloquea si aparece en una OT ABIERTA
 * (si tu política permite archivar Stock igual, no llames este guard en el controlador)
 */
export async function stockEnOtAbierta(stockId) {
  const uso = await prisma.ordenStock.findFirst({
    where: { stockId, orden: whereOrdenAbierta },
    select: { id: true },
  });
  return !!uso;
}

/**
 * AVIÓN: bloquea si hay alguna OT ABIERTA sobre ese avión
 */
export async function avionEnOtAbierta(avionId) {
  const ot = await prisma.ordenTrabajo.findFirst({
    where: { avionId, estadoOrden: OPEN_STATE }, // campo correcto
    select: { id: true },
  });
  return !!ot;
}

/**
 * PROPIETARIO: bloquea si existe una OT ABIERTA cuyo avión esté asociado a ese propietario
 */
export async function propietarioEnOtAbierta(propietarioId) {
  const ot = await prisma.ordenTrabajo.findFirst({
    where: {
      estadoOrden: OPEN_STATE, // campo correcto
      avion: {
        is: {
          propietarios: { some: { propietarioId } },
        },
      },
    },
    select: { id: true },
  });
  return !!ot;
}

/**
 * COMPONENTE EXTERNO: bloquea si hay una OT ABIERTA sobre ese componente
 */
export async function componenteExternoEnOtAbierta(componenteExternoId) {
  const ot = await prisma.ordenTrabajo.findFirst({
    where: { componenteId: componenteExternoId, estadoOrden: OPEN_STATE }, // campos correctos
    select: { id: true },
  });
  return !!ot;
}

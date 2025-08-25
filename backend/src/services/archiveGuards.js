// src/services/archiveGuards.js  (ESM)
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Ajustá a tus estados "abiertos"
export const OPEN_STATES = ['abierta', 'fase1', 'fase2', 'fase3', 'fase4'];

export async function empleadoEnOtAbierta(id) {
  return !!(await prisma.registroTrabajo.findFirst({
    where: { empleadoId: id, orden: { estado: { in: OPEN_STATES } } },
    select: { id: true },
  }));
}

export async function herramientaEnOtAbierta(id) {
  // ⚠️ Ajustá el nombre de tu tabla/relación de uso de herramientas en OT si difiere
  // ej: ordenTrabajoHerramienta / otHerramienta / herramientaEnOT
  return !!(await prisma.ordenTrabajoHerramienta.findFirst({
    where: { herramientaId: id, orden: { estado: { in: OPEN_STATES } } },
    select: { id: true },
  }));
}

export async function stockEnOtAbierta(id) {
  // ⚠️ Ajustá si tu tabla/relación difiere: ordenTrabajoItem / otItem / consumoStock
  return !!(await prisma.ordenTrabajoItem.findFirst({
    where: { stockId: id, orden: { estado: { in: OPEN_STATES } } },
    select: { id: true },
  }));
}

export async function avionEnOtAbierta(id) {
  return !!(await prisma.ordenTrabajo.findFirst({
    where: { avionId: id, estado: { in: OPEN_STATES } },
    select: { id: true },
  }));
}

export async function propietarioEnOtAbierta(id) {
  return !!(await prisma.ordenTrabajo.findFirst({
    where: {
      estado: { in: OPEN_STATES },
      avion: { propietarios: { some: { propietarioId: id } } },
    },
    select: { id: true },
  }));
}

export async function componenteExternoEnOtAbierta(id) {
  // ⚠️ Ajustá el nombre de la relación componentesExternos en OT si difiere
  return !!(await prisma.ordenTrabajo.findFirst({
    where: {
      estado: { in: OPEN_STATES },
      componentesExternos: { some: { componenteExternoId: id } },
    },
    select: { id: true },
  }));
}

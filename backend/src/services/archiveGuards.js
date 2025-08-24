// src/services/archiveGuards.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Ajustá a tus estados "abiertos"
const OPEN_STATES = ['abierta', 'fase1', 'fase2', 'fase3', 'fase4'];

async function empleadoEnOtAbierta(id) {
  return !!(await prisma.registroTrabajo.findFirst({
    where: { empleadoId: id, orden: { estado: { in: OPEN_STATES } } },
    select: { id: true },
  }));
}

async function herramientaEnOtAbierta(id) {
  // Ajustá el nombre de tu tabla de uso de herramientas en OT:
  // ej: ordenTrabajoHerramienta / otHerramienta / herramientaEnOT
  return !!(await prisma.ordenTrabajoHerramienta.findFirst({
    where: { herramientaId: id, orden: { estado: { in: OPEN_STATES } } },
    select: { id: true },
  }));
}

async function stockEnOtAbierta(id) {
  // Ajustá: ordenTrabajoItem / otItem / consumoStock
  return !!(await prisma.ordenTrabajoItem.findFirst({
    where: { stockId: id, orden: { estado: { in: OPEN_STATES } } },
    select: { id: true },
  }));
}

async function avionEnOtAbierta(id) {
  return !!(await prisma.ordenTrabajo.findFirst({
    where: { avionId: id, estado: { in: OPEN_STATES } },
    select: { id: true },
  }));
}

async function propietarioEnOtAbierta(id) {
  return !!(await prisma.ordenTrabajo.findFirst({
    where: {
      estado: { in: OPEN_STATES },
      avion: { propietarios: { some: { propietarioId: id } } },
    },
    select: { id: true },
  }));
}

async function componenteExternoEnOtAbierta(id) {
  // Ajustá: nombre de la relación componentesExternos en OT
  return !!(await prisma.ordenTrabajo.findFirst({
    where: {
      estado: { in: OPEN_STATES },
      componentesExternos: { some: { componenteExternoId: id } },
    },
    select: { id: true },
  }));
}

module.exports = {
  OPEN_STATES,
  empleadoEnOtAbierta,
  herramientaEnOtAbierta,
  stockEnOtAbierta,
  avionEnOtAbierta,
  propietarioEnOtAbierta,
  componenteExternoEnOtAbierta,
};

// src/utils/avisos.js

/**
 * Crea un aviso si la herramienta está próxima a vencerse
 */
const crearAvisoPorVencimientoHerramienta = async (herramienta, prisma) => {
  console.log(`🔍 Revisando herramienta ${herramienta.nombre}`);

  if (!herramienta.fechaVencimiento) return;

  const truncarHora = (fecha) => new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());

  const hoy = truncarHora(new Date());
  const vencimiento = truncarHora(new Date(herramienta.fechaVencimiento));
  const diasRestantes = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));

  if (diasRestantes <= 30) {
const existe = await prisma.aviso.findFirst({
  where: {
    herramientaId: herramienta.id,
    tipo: 'herramienta',
  },
});

const mensaje = `La herramienta "${herramienta.nombre}" está a ${diasRestantes} día(s) de vencerse.`;

if (!existe) {
  await prisma.aviso.create({
    data: {
      tipo: 'herramienta',
      mensaje,
      herramientaId: herramienta.id,
    },
  });
  console.log(`📣 Aviso creado: ${mensaje}`);
} else {
  await prisma.aviso.update({
    where: { id: existe.id },
    data: {
      mensaje,
      creadoEn: new Date(),
    },
  });
  console.log(`♻️ Aviso actualizado: ${mensaje}`);
}

  }
};

/**
 * Revisa todas las herramientas y genera avisos si están próximas a vencer
 */
const revisarTodasLasHerramientas = async (prisma) => {
  console.log('🔎 Buscando herramientas próximas a vencimiento...');
  const herramientas = await prisma.herramienta.findMany();

  for (const herramienta of herramientas) {
    await crearAvisoPorVencimientoHerramienta(herramienta, prisma);
  }

  console.log('✅ Revisión de herramientas completada.');
};

/**
 * Crea o actualiza un aviso si el avión no tiene propietarios
 */
const crearAvisoPorAvionSinPropietario = async (avion, prisma) => {
  if (!avion || !avion.id) return;

  const tienePropietarios = avion.propietarios && avion.propietarios.length > 0;
  if (tienePropietarios) return;

  const mensaje = `El avión ${avion.matricula ?? `(ID ${avion.id})`} no tiene propietarios asignados.`;

  const avisoExistente = await prisma.aviso.findFirst({
    where: {
      avionId: avion.id,
      tipo: 'avion_sin_propietario',
    },
  });

  if (!avisoExistente) {
    await prisma.aviso.create({
      data: {
        tipo: 'avion_sin_propietario',
        mensaje,
        avionId: avion.id,
      },
    });
    console.log(`📣 Aviso creado: ${mensaje}`);
  } else {
    await prisma.aviso.update({
      where: { id: avisoExistente.id },
      data: {
        mensaje,
        creadoEn: new Date(),
      },
    });
    console.log(`♻️ Aviso actualizado: ${mensaje}`);
  }
};

/**
 * Revisa todos los aviones y genera avisos si no tienen propietarios
 */
const revisarAvionesSinPropietario = async (prisma) => {
  console.log('✈️ Revisando aviones sin propietarios...');
  const aviones = await prisma.avion.findMany({
    include: { propietarios: true },
  });

  for (const avion of aviones) {
    await crearAvisoPorAvionSinPropietario(avion, prisma);
  }

  console.log('✅ Revisión de aviones completada.');
};


module.exports = {
  revisarTodasLasHerramientas,
  revisarAvionesSinPropietario,
  crearAvisoPorAvionSinPropietario,
};

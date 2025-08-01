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
    const mensaje = `La herramienta "${herramienta.nombre}" está a ${diasRestantes} día(s) de vencerse.`;

    const existe = await prisma.aviso.findFirst({
      where: {
        herramientaId: herramienta.id,
        mensaje,
      },
    });

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
      console.log(`⚠️ Ya existía aviso: ${mensaje}`);
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

module.exports = {
  revisarTodasLasHerramientas,
};


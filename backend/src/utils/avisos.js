// src/utils/avisos.js (ESM)

/// Crea un aviso si la herramienta está próxima a vencerse (<= 30 días)
export async function crearAvisoPorVencimientoHerramienta(herramienta, prisma) {
  console.log(`🔍 Revisando herramienta ${herramienta.nombre}`);
  if (!herramienta.fechaVencimiento) return;

  const truncarHora = (fecha) =>
    new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());

  const hoy = truncarHora(new Date());
  const vencimiento = truncarHora(new Date(herramienta.fechaVencimiento));
  const diasRestantes = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));

  if (diasRestantes <= 30) {
    const mensaje = `La herramienta "${herramienta.nombre}" está a ${diasRestantes} día(s) de vencerse.`;

    // Si agregás @@unique([tipo, herramientaId]) podés usar upsert directo.
    const existe = await prisma.aviso.findFirst({
      where: { herramientaId: herramienta.id, tipo: 'herramienta' },
    });

    if (!existe) {
      await prisma.aviso.create({
        data: { tipo: 'herramienta', mensaje, herramientaId: herramienta.id },
      });
      console.log(`📣 Aviso creado: ${mensaje}`);
    } else {
      await prisma.aviso.update({
        where: { id: existe.id },
        data: { mensaje, creadoEn: new Date() },
      });
      console.log(`♻️ Aviso actualizado: ${mensaje}`);
    }
  }
}

/// Revisa todas las herramientas y genera avisos si están próximas a vencer
export async function revisarTodasLasHerramientas(prisma) {
  console.log('🔎 Buscando herramientas próximas a vencimiento...');
  const herramientas = await prisma.herramienta.findMany();

  for (const herramienta of herramientas) {
    await crearAvisoPorVencimientoHerramienta(herramienta, prisma);
  }

  console.log('✅ Revisión de herramientas completada.');
}

/// Crea/actualiza/elimina el aviso si el avión no tiene propietarios
/// - Si TIENE propietarios: elimina aviso existente.
/// - Si NO tiene: upsert del aviso.
export async function crearAvisoPorAvionSinPropietario(avion, prisma) {
  if (!avion || !avion.id) return;

  const tienePropietarios =
    Array.isArray(avion.propietarios) && avion.propietarios.length > 0;

  if (tienePropietarios) {
    await prisma.aviso.deleteMany({
      where: { tipo: 'avion_sin_propietario', avionId: avion.id },
    });
    console.log(
      `🧹 Aviso removido: Avión ${avion.matricula ?? `(ID ${avion.id})`} ahora tiene propietario.`
    );
    return;
  }

  const mensaje = `El avión ${
    avion.matricula ?? `(ID ${avion.id})`
  } no tiene propietarios asignados.`;

  // Requiere índice único en Prisma:
  // model Aviso { @@unique([tipo, avionId], name: "tipo_avionId") }
  await prisma.aviso.upsert({
    where: { tipo_avionId: { tipo: 'avion_sin_propietario', avionId: avion.id } },
    create: { tipo: 'avion_sin_propietario', mensaje, avionId: avion.id },
    update: { mensaje, creadoEn: new Date() },
  });

  console.log(`📣/♻️ Aviso creado/actualizado: ${mensaje}`);
}

/// Revisa todos los aviones y genera/limpia avisos según tengan o no propietarios
export async function revisarAvionesSinPropietario(prisma) {
  console.log('✈️ Revisando aviones sin propietarios...');
  const aviones = await prisma.avion.findMany({ include: { propietarios: true } });

  for (const avion of aviones) {
    await crearAvisoPorAvionSinPropietario(avion, prisma);
  }

  console.log('✅ Revisión de aviones completada.');
}

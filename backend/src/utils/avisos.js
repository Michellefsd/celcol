// src/utils/avisos.js (ESM)

// Crea un aviso si la herramienta está próxima a vencerse (<= 30 días)
export async function crearAvisoPorVencimientoHerramienta(herramienta, prisma) {
  console.log(`🔍 Revisando herramienta ${herramienta.nombre}`);
  if (!herramienta.fechaVencimiento) return;

  const truncarHora = (fecha) =>
    new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());

  const hoy = truncarHora(new Date());
  const vencimiento = truncarHora(new Date(herramienta.fechaVencimiento));
  const diasRestantes = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));

  // etiqueta legible (muestra Nº de serie si existe, pero no obliga)
  const etiqueta =
    herramienta.nombre
      ? `${herramienta.nombre}${herramienta.numeroSerie ? ` (N/S ${herramienta.numeroSerie})` : ''}`
      : (herramienta.numeroSerie ? `N/S ${herramienta.numeroSerie}` : `#${herramienta.id}`);

  if (diasRestantes <= 30) {
    const mensaje =
      diasRestantes <= 0
        ? `Herramienta ${etiqueta} vencida`
        : `La herramienta ${etiqueta} está a ${diasRestantes} día(s) de vencerse.`;

    // Si tenés @@unique([tipo, herramientaId]) en Aviso, este flujo queda perfecto
    const existe = await prisma.aviso.findFirst({
      where: { herramientaId: herramienta.id, tipo: 'herramienta' },
      select: { id: true },
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

// Revisa todas las herramientas y genera avisos si están próximas a vencer
export async function revisarTodasLasHerramientas(prisma) {
  console.log('🔎 Buscando herramientas próximas a vencimiento...');
  const herramientas = await prisma.herramienta.findMany();
  for (const herramienta of herramientas) {
    await crearAvisoPorVencimientoHerramienta(herramienta, prisma);
  }
  console.log('✅ Revisión de herramientas completada.');
}

// Crea/actualiza/elimina el aviso si el avión no tiene propietarios
export async function crearAvisoPorAvionSinPropietario(avion, prisma) {
  if (!avion || !avion.id) return;

  const tienePropietarios =
    Array.isArray(avion.propietarios) && avion.propietarios.length > 0;

  if (tienePropietarios) {
    await prisma.aviso.deleteMany({
      where: { tipo: 'avion_sin_propietario', avionId: avion.id },
    });
    console.log(`🧹 Aviso removido: Aeronave ${avion.matricula ?? `(ID ${avion.id})`} ahora tiene propietario.`);
    return;
  }

  const mensaje = `La Aeronave ${avion.matricula ?? `(ID ${avion.id})`} no tiene propietarios asignados.`;

  await prisma.aviso.upsert({
    where: { tipo_avionId: { tipo: 'avion_sin_propietario', avionId: avion.id } },
    create: { tipo: 'avion_sin_propietario', mensaje, avionId: avion.id },
    update: { mensaje, creadoEn: new Date() },
  });

  console.log(`📣/♻️ Aviso creado/actualizado: ${mensaje}`);
}

// Revisa todos los aviones y genera/limpia avisos según tengan o no propietarios
export async function revisarAvionesSinPropietario(prisma) {
  console.log('✈️ Revisando aeronaves sin propietarios...');
  const aviones = await prisma.avion.findMany({ include: { propietarios: true } });
  for (const avion of aviones) {
    await crearAvisoPorAvionSinPropietario(avion, prisma);
  }
  console.log('✅ Revisión de aeronaves completada.');
}

// Revisa si la licencia del personal esta por vencer o vencida (sin relación en Aviso)
export async function revisarLicenciasPersonal(prisma) {
  const hoy = new Date();

  const empleados = await prisma.empleado.findMany({
    where: { archivado: false, vencimientoLicencia: { not: null } },
    select: { id: true, nombre: true, apellido: true, numeroLicencia: true, vencimientoLicencia: true },
  });

  for (const e of empleados) {
    const vence = new Date(e.vencimientoLicencia);
    const dias = Math.floor(
      (new Date(vence.setHours(0,0,0,0)) - new Date(hoy.setHours(0,0,0,0))) / (1000*60*60*24)
    );

    const etiquetaLic = e.numeroLicencia ? ` ${e.numeroLicencia}` : '';
    const persona = `${e.nombre} ${e.apellido}`.trim();
    const fechaUY = new Date(e.vencimientoLicencia).toLocaleDateString('es-UY');

    if (dias >= 0 && dias <= 30) {
      const mensaje = `La licencia${etiquetaLic} de ${persona} vence el ${fechaUY}.`;

      const existe = await prisma.aviso.findFirst({
        where: { tipo: 'LICENCIA_POR_VENCER', leido: false /* sin empleadoId */ },
        select: { id: true },
      });

      if (!existe) {
        await prisma.aviso.create({ data: { tipo: 'LICENCIA_POR_VENCER', mensaje, leido: false } });
      } else {
        await prisma.aviso.update({ where: { id: existe.id }, data: { mensaje, creadoEn: new Date() } });
      }
    } else if (dias < 0) {
      const mensaje = `La licencia${etiquetaLic} de ${persona} venció el ${fechaUY}.`;

      // cerrar “por vencer”
      await prisma.aviso.updateMany({
        where: { tipo: 'LICENCIA_POR_VENCER', leido: false /* sin empleadoId */ },
        data: { leido: true },
      });

      const existe = await prisma.aviso.findFirst({
        where: { tipo: 'LICENCIA_VENCIDA', leido: false /* sin empleadoId */ },
        select: { id: true },
      });

      if (!existe) {
        await prisma.aviso.create({ data: { tipo: 'LICENCIA_VENCIDA', mensaje, leido: false } });
      } else {
        await prisma.aviso.update({ where: { id: existe.id }, data: { mensaje, creadoEn: new Date() } });
      }
    }
  }
}

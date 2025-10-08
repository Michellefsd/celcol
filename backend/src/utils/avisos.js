// src/utils/avisos.js (ESM)


// HERRAMIENTA
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



// AVION
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



/// PERSONAL LICENCIA
// ————————————————————————————————————————————————————————————————
// Reglas:
// 1) Un aviso por empleado y estado (POR_VENCER | VENCIDA) usando clave única (tipo, empleadoId)
// 2) Limpia el otro estado si cambia (para no duplicar avisos del mismo empleado)
// 3) Borra avisos si la licencia es null o está > 30 días
// 4) No depende de `leido` para evitar duplicados
//
// Esquema recomendado en Prisma (modelo Aviso):
// @@unique([tipo, empleadoId])   // además de los que ya tengas para herramienta/avión

// Helper: truncar a medianoche (evita off-by-one por horas)
const truncarFecha = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/**
 * Crea/actualiza/limpia avisos para la licencia de un empleado.
 * Requiere índice único: @@unique([tipo, empleadoId]) en Aviso
 */
export async function crearAvisoPorLicenciaEmpleado(e, prisma) {
  // Si no hay licencia, borrar cualquier aviso previo del empleado
  if (!e?.vencimientoLicencia) {
    await prisma.aviso.deleteMany({
      where: { empleadoId: e.id, tipo: { in: ['LICENCIA_POR_VENCER', 'LICENCIA_VENCIDA'] } },
    });
    return;
  }

  const hoy = truncarFecha(new Date());
  const vence = truncarFecha(new Date(e.vencimientoLicencia));
  const dias = Math.ceil((vence - hoy) / (1000 * 60 * 60 * 24));

  const etiquetaLic = e.numeroLicencia ? ` ${e.numeroLicencia}` : '';
  const persona = `${e.nombre ?? ''} ${e.apellido ?? ''}`.trim();
  const fechaUY = new Date(e.vencimientoLicencia).toLocaleDateString('es-UY');

  // Fuera de ventana (>30 días): borrar avisos del empleado
  if (dias > 30) {
    await prisma.aviso.deleteMany({
      where: { empleadoId: e.id, tipo: { in: ['LICENCIA_POR_VENCER', 'LICENCIA_VENCIDA'] } },
    });
    return;
  }

  const tipo = dias < 0 ? 'LICENCIA_VENCIDA' : 'LICENCIA_POR_VENCER';
  const mensaje =
    dias < 0
      ? `La licencia${etiquetaLic} de ${persona} venció el ${fechaUY}.`
      : `La licencia${etiquetaLic} de ${persona} vence el ${fechaUY}.`;

  // Limpiar el “otro” estado si existiera
  const otroTipo = tipo === 'LICENCIA_POR_VENCER' ? 'LICENCIA_VENCIDA' : 'LICENCIA_POR_VENCER';
  await prisma.aviso.deleteMany({
    where: { empleadoId: e.id, tipo: otroTipo },
  });

  // Upsert por (tipo, empleadoId)
  await prisma.aviso.upsert({
    where: { tipo_empleadoId: { tipo, empleadoId: e.id } }, // requiere @@unique([tipo, empleadoId])
    create: { tipo, mensaje, empleadoId: e.id, leido: false },
    update: { mensaje, creadoEn: new Date(), leido: false },
  });
}

/**
 * Revisa todas las licencias del personal y crea/actualiza/limpia avisos sin duplicar.
 */
export async function revisarLicenciasPersonal(prisma) {
  const empleados = await prisma.empleado.findMany({
    where: { archivado: false }, // no filtramos por vencimiento null para también limpiar avisos
    select: {
      id: true,
      nombre: true,
      apellido: true,
      numeroLicencia: true,
      vencimientoLicencia: true,
    },
  });

  for (const e of empleados) {
    await crearAvisoPorLicenciaEmpleado(e, prisma);
  }
}

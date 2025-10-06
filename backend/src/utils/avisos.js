/**
 * Helpers de fecha / formato
 */
const toMidnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const diffDays = (from, to) =>
  Math.floor((toMidnight(to).getTime() - toMidnight(from).getTime()) / (1000 * 60 * 60 * 24));

const fmtUY = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const yyyy = dt.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

/**
 * Crea o actualiza el aviso correspondiente a una herramienta
 * según su vencimiento (por vencer / vencida).
 */
async function crearOActualizarAvisoHerramienta(h, prisma) {
  const fechaVence = h.vencimientoCalibracion ?? h.proximaCalibracion ?? null;
  if (!fechaVence) return;

  const hoy = new Date();
  const dias = diffDays(hoy, new Date(fechaVence));

  if (dias < 0) {
    // 🔴 VENCIDA
    const titulo = `Herramienta vencida`;
    const descripcion = `La herramienta ${h.nombre ?? h.numeroSerie ?? `#${h.id}`} venció el ${fmtUY(fechaVence)}.`;

    // Marcar como leído cualquier "por vencer"
    await prisma.aviso.updateMany({
      where: { tipo: 'HERRAMIENTA_POR_VENCER', leido: false, herramientaId: h.id },
      data: { leido: true },
    });

    // Crear/actualizar "vencida"
    const yaExiste = await prisma.aviso.findFirst({
      where: { tipo: 'HERRAMIENTA_VENCIDA', leido: false, herramientaId: h.id },
      select: { id: true },
    });

    if (!yaExiste) {
      await prisma.aviso.create({
        data: {
          tipo: 'HERRAMIENTA_VENCIDA',
          titulo,
          descripcion,
          leido: false,
          prioridad: 'ALTA',
          herramienta: { connect: { id: h.id } },
          metadata: { vencimiento: fechaVence },
        },
      });
    } else {
      await prisma.aviso.update({
        where: { id: yaExiste.id },
        data: {
          titulo,
          descripcion,
          prioridad: 'ALTA',
          metadata: { vencimiento: fechaVence },
        },
      });
    }
    return;
  }

  if (dias <= 30) {
    // 🟡 POR VENCER (0–30 días)
    const titulo = `Herramienta por vencer (${dias} día${dias === 1 ? '' : 's'})`;
    const descripcion = `La herramienta ${h.nombre ?? h.numeroSerie ?? `#${h.id}`} vence el ${fmtUY(fechaVence)}.`;
    const prioridad = dias <= 7 ? 'ALTA' : 'MEDIA';

    const yaExiste = await prisma.aviso.findFirst({
      where: { tipo: 'HERRAMIENTA_POR_VENCER', leido: false, herramientaId: h.id },
      select: { id: true },
    });

    if (!yaExiste) {
      await prisma.aviso.create({
        data: {
          tipo: 'HERRAMIENTA_POR_VENCER',
          titulo,
          descripcion,
          leido: false,
          prioridad,
          herramienta: { connect: { id: h.id } },
          metadata: { diasRestantes: dias, vencimiento: fechaVence },
        },
      });
    } else {
      await prisma.aviso.update({
        where: { id: yaExiste.id },
        data: {
          titulo,
          descripcion,
          prioridad,
          metadata: { diasRestantes: dias, vencimiento: fechaVence },
        },
      });
    }
    return;
  }

  // ✅ Falta más de 30 días: cerrar avisos abiertos (opcional, mantiene limpio)
  await prisma.aviso.updateMany({
    where: {
      herramientaId: h.id,
      leido: false,
      tipo: { in: ['HERRAMIENTA_POR_VENCER', 'HERRAMIENTA_VENCIDA'] },
    },
    data: { leido: true },
  });
}

/**
 * Revisa todas las herramientas y genera avisos si están próximas a vencer
 */
export async function revisarTodasLasHerramientas(prisma) {
  console.log('🔎 Buscando herramientas próximas a vencimiento...');

  const herramientas = await prisma.herramienta.findMany({
    // Si tu modelo tiene archivado lógico, destapá esto:
    // where: { archivado: false },
    select: {
      id: true,
      nombre: true,
      numeroSerie: true,
      vencimientoCalibracion: true,
      proximaCalibracion: true,
      // archivado: true,
    },
  });

  for (const h of herramientas) {
    try {
      await crearOActualizarAvisoHerramienta(h, prisma);
    } catch (e) {
      console.error(`⚠️ Error procesando herramienta #${h.id}:`, e);
    }
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
      `🧹 Aviso removido: Aeronave ${avion.matricula ?? `(ID ${avion.id})`} ahora tiene propietario.`
    );
    return;
  }

  const mensaje = `La Aeronave ${
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
  console.log('✈️ Revisando aeronaves sin propietarios...');
  const aviones = await prisma.avion.findMany({ include: { propietarios: true } });

  for (const avion of aviones) {
    await crearAvisoPorAvionSinPropietario(avion, prisma);
  }

  console.log('✅ Revisión de aeronaves completada.');
}

// src/utils/avisos.js
export async function revisarLicenciasPersonal(prisma) {
  const hoy = new Date();

  const empleados = await prisma.empleado.findMany({
    where: { archivado: false, vencimientoLicencia: { not: null } },
    select: {
      id: true, nombre: true, apellido: true,
      numeroLicencia: true, vencimientoLicencia: true,
    },
  });

  for (const e of empleados) {
    const vence = new Date(e.vencimientoLicencia);
    const dias = Math.floor(
      (vence.setHours(0,0,0,0) - hoy.setHours(0,0,0,0)) / (1000*60*60*24)
    );

    if (dias >= 0 && dias <= 30) {
      const titulo = `Licencia por vencer (${dias} día${dias===1?'':'s'})`;
      const descripcion =
        `La licencia ${e.numeroLicencia ?? ''} de ${e.nombre} ${e.apellido} ` +
        `vence el ${new Date(e.vencimientoLicencia).toLocaleDateString('es-UY')}.`;

      const yaExiste = await prisma.aviso.findFirst({
        where: { tipo: 'LICENCIA_POR_VENCER', leido: false, empleadoId: e.id },
        select: { id: true },
      });

      if (!yaExiste) {
        await prisma.aviso.create({
          data: {
            tipo: 'LICENCIA_POR_VENCER',
            titulo,
            descripcion,
            leido: false,
            prioridad: dias <= 7 ? 'ALTA' : 'MEDIA',
            empleado: { connect: { id: e.id } },
            metadata: { diasRestantes: dias, vencimiento: e.vencimientoLicencia, numeroLicencia: e.numeroLicencia ?? null },
          },
        });
      } else {
        await prisma.aviso.update({
          where: { id: yaExiste.id },
          data: {
            titulo, descripcion,
            metadata: { diasRestantes: dias, vencimiento: e.vencimientoLicencia, numeroLicencia: e.numeroLicencia ?? null },
          },
        });
      }
    } else if (dias < 0) {
      // 🔴 LICENCIA VENCIDA
      const titulo = `Licencia vencida`;
      const descripcion =
        `La licencia ${e.numeroLicencia ?? ''} de ${e.nombre} ${e.apellido} ` +
        `venció el ${new Date(e.vencimientoLicencia).toLocaleDateString('es-UY')}.`;

      // Cerrar/ignorar avisos "por vencer" abiertos y crear/actualizar "vencida"
      await prisma.aviso.updateMany({
        where: { tipo: 'LICENCIA_POR_VENCER', leido: false, empleadoId: e.id },
        data: { leido: true },
      });

      const yaExiste = await prisma.aviso.findFirst({
        where: { tipo: 'LICENCIA_VENCIDA', leido: false, empleadoId: e.id },
        select: { id: true },
      });

      if (!yaExiste) {
        await prisma.aviso.create({
          data: {
            tipo: 'LICENCIA_VENCIDA',
            titulo,
            descripcion,
            leido: false,
            prioridad: 'ALTA',
            empleado: { connect: { id: e.id } },
            metadata: { vencimiento: e.vencimientoLicencia, numeroLicencia: e.numeroLicencia ?? null },
          },
        });
      } else {
        await prisma.aviso.update({
          where: { id: yaExiste.id },
          data: {
            titulo, descripcion,
            metadata: { vencimiento: e.vencimientoLicencia, numeroLicencia: e.numeroLicencia ?? null },
          },
        });
      }
    }
  }
}

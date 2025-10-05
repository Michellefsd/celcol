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

  // ✅ Mensaje según estado:
  //  - vencida (hoy o pasado): "Herramienta vencida"
  //  - a <=30 días: "La herramienta "X" está a N día(s) de vencerse."
  if (diasRestantes <= 30) {
    const mensaje =
      diasRestantes <= 0
        ? 'Herramienta vencida'
        : `La herramienta "${herramienta.nombre}" está a ${diasRestantes} día(s) de vencerse.`;

    // Si agregás @@unique([tipo, herramientaId]) en Aviso, podés upsertear directo.
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


 // revisarTodasLasHerramientas)
for (const h of herramientas) {
  const fechaVence =
    h.vencimientoCalibracion ?? h.proximaCalibracion ?? null;
  if (!fechaVence) continue;

  const hoy = new Date();
  const vence = new Date(fechaVence);
  const dias = Math.floor(
    (vence.setHours(0,0,0,0) - hoy.setHours(0,0,0,0)) / (1000*60*60*24)
  );

  if (dias >= 0 && dias <= 30) {
    const titulo = `Herramienta por vencer (${dias} día${dias===1?'':'s'})`;
    const descripcion =
      `La herramienta ${h.nombre ?? h.codigo ?? `#${h.id}`} ` +
      `vence el ${vence.toLocaleDateString('es-UY')}.`;

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
          prioridad: dias <= 7 ? 'ALTA' : 'MEDIA',
          herramienta: { connect: { id: h.id } },
          metadata: { diasRestantes: dias, vencimiento: fechaVence },
        },
      });
    } else {
      await prisma.aviso.update({
        where: { id: yaExiste.id },
        data: { titulo, descripcion, metadata: { diasRestantes: dias, vencimiento: fechaVence } },
      });
    }
  } else if (dias < 0) {
    // 🔴 HERRAMIENTA VENCIDA
    const titulo = `Herramienta vencida`;
    const descripcion =
      `La herramienta ${h.nombre ?? h.codigo ?? `#${h.id}`} ` +
      `venció el ${vence.toLocaleDateString('es-UY')}.`;

    await prisma.aviso.updateMany({
      where: { tipo: 'HERRAMIENTA_POR_VENCER', leido: false, herramientaId: h.id },
      data: { leido: true },
    });

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
        data: { titulo, descripcion, metadata: { vencimiento: fechaVence } },
      });
    }
  }
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

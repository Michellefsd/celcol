const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { subirArchivoGenerico } = require('../utils/archivoupload');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');


// 1. Listar todas las órdenes
exports.getAllOrdenes = async (req, res) => {
  try {
    const ordenes = await prisma.ordenTrabajo.findMany({
      include: {
        avion: true,
        componente: true,
        empleadosAsignados: { include: { empleado: true } },
        herramientas: { include: { herramienta: true } },
        stockAsignado: { include: { stock: true } },
        registrosTrabajo: true,
      },
      orderBy: { fechaApertura: 'desc' },
    });
    res.json(ordenes);
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    res.status(500).json({ error: 'Error al obtener órdenes' });
  }
};

exports.getOrdenById = async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const orden = await prisma.ordenTrabajo.findUnique({
      where: { id },
      include: {
        avion: {
          include: {
            ComponenteAvion: true,
          },
        },
        componente: {
          include: {
            propietario: true,
          },
        },
        empleadosAsignados: {
          include: {
            empleado: true,
          },
        },
        herramientas: {
          include: {
            herramienta: true,
          },
        },
        stockAsignado: {
          include: {
            stock: true,
          },
        },
        registrosTrabajo: {
          include: {
            empleado: true, // ✅ necesario
          },
        },
      },
    });

    if (!orden) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    res.json({
      ...orden,
      solicitudFirma: orden.solicitudFirma ? `${baseUrl}/${orden.solicitudFirma}` : null,
      archivoFactura: orden.archivoFactura ? `${baseUrl}/${orden.archivoFactura}` : null,
    });
  } catch (error) {
    console.error('❌ Error al obtener orden:', error);
    res.status(500).json({ error: 'Error al obtener orden' });
  }
};

// 3. Crear nueva orden de trabajo
exports.createOrden = async (req, res) => {
  const {
    avionId,
    componenteId,
    solicitud,
    OTsolicitud,
    solicitadoPor,
    solicitudFirma,
    inspeccionRecibida,
    danosPrevios,
    accionTomada,
    observaciones,
    numeroFactura,
    archivoFactura,
    estadoFactura,
    empleados,
    herramientas,
    stock,
    registrosTrabajo,
  } = req.body;

  try {
    const nuevaOrden = await prisma.ordenTrabajo.create({
      data: {
        avionId,
        componenteId,
        solicitud,
        OTsolicitud,
        solicitadoPor,
        solicitudFirma,
        inspeccionRecibida,
        danosPrevios,
        accionTomada,
        observaciones,
        numeroFactura,
        archivoFactura,
        estadoFactura,

        empleadosAsignados: {
          create: empleados?.map((e) => ({
            empleado: { connect: { id: e.id } },
          })),
        },
        herramientas: {
          create: herramientas?.map((h) => ({
            herramienta: { connect: { id: h.id } },
          })),
        },
        stockAsignado: {
          create: stock?.map((s) => ({
            stock: { connect: { id: s.id } },
            cantidadUtilizada: s.cantidad,
          })),
        },
        registrosTrabajo: {
          create: registrosTrabajo?.map((r) => ({
            empleado: { connect: { id: r.empleadoId } },
            fecha: new Date(r.fecha),
            horas: r.horas,
          })),
        },
      },
    });

    res.status(201).json(nuevaOrden);
  } catch (error) {
    console.error('Error al crear orden:', error);
    res.status(500).json({ error: 'Error al crear orden' });
  }
};

// fase 2: Actualizar solicitud de firma y solicitado por
exports.updateFase2 = async (req, res) => {
  const id = parseInt(req.params.id);
  const { solicitud, solicitadoPor, OTsolicitud } = req.body;
  const archivo = req.files?.solicitudFirma?.[0]?.path;

  try {
    const updated = await prisma.ordenTrabajo.update({
      where: { id },
      data: {
        solicitud,
        solicitadoPor,
        OTsolicitud,
        ...(archivo && { solicitudFirma: archivo }),
      },
    });
    res.json(updated);
  } catch (error) {
    console.error('❌ Error al actualizar fase 2:', error);
    res.status(500).json({ error: 'Error al actualizar fase 2' });
  }
};

// Fase 2: Subir archivo de solicitud de firma
exports.subirArchivoOrden = (req, res) =>
  subirArchivoGenerico({
    req,
    res,
    modeloPrisma: prisma.ordenTrabajo, // 👈 este es tu modelo en Prisma
    campoArchivo: 'solicitudFirma',   // 👈 este es el campo que contiene el archivo
    nombreRecurso: 'Orden de trabajo' // 👈 solo para los mensajes de respuesta
  });

// Fase 3: Actualizar inspección y asignación de recursos cuando el avión está con Celcol
exports.updateFase3 = async (req, res) => {
  console.log('stock recibido:', req.body.stock);

  const id = parseInt(req.params.id);
  const {
    inspeccionRecibida,
    danosPrevios,
    accionTomada,
    observaciones,
    herramientas,
    stock = [],
    certificadores = [],
    tecnicos = [],
  } = req.body;

  try {
    const certificadoresUnicos = [...new Set(certificadores)];
    const tecnicosUnicos = [...new Set(tecnicos)];
    const alertas = [];

    // Validación: evitar asignación doble como técnico y certificador
const idsDuplicados = certificadoresUnicos.filter(id => tecnicosUnicos.includes(id));
if (idsDuplicados.length > 0) {
  return res.status(400).json({
    error: `El empleado con ID ${idsDuplicados.join(', ')} está asignado como técnico y certificador.`,
  });
}


    await prisma.$transaction(async (tx) => {
      // 1. Obtener stock previo
      const stockPrevio = await tx.ordenStock.findMany({
        where: { ordenId: id },
      });

      const stockMapPrevio = new Map();
      for (const item of stockPrevio) {
        stockMapPrevio.set(item.stockId, item.cantidadUtilizada);
      }

      // 2. Limpiar herramientas, stock, personal
      await tx.ordenTrabajo.update({
        where: { id },
        data: {
          inspeccionRecibida,
          danosPrevios,
          accionTomada,
          observaciones,
          herramientas: { deleteMany: {} },
          stockAsignado: { deleteMany: {} },
          empleadosAsignados: { deleteMany: {} },
        },
      });

      // 3. Crear herramientas
      for (const hId of herramientas ?? []) {
        await tx.ordenHerramienta.create({
          data: {
            ordenId: id,
            herramientaId: hId,
          },
        });
      }

      // 4. Crear stock nuevo y ajustar cantidades
      const stockIdsActuales = stock.map((s) => s.stockId);
      for (const s of stock) {
        if (!s.stockId || !s.cantidad) continue;

        const anterior = stockMapPrevio.get(s.stockId) ?? 0;
        const diferencia = s.cantidad - anterior;

        if (diferencia > 0) {
          // Se están usando más unidades → descontar del stock
          await tx.stock.update({
            where: { id: s.stockId },
            data: {
              cantidad: { decrement: diferencia },
            },
          });
        } else if (diferencia < 0) {
          // Se usaron menos unidades que antes → devolver al stock
          await tx.stock.update({
            where: { id: s.stockId },
            data: {
              cantidad: { increment: Math.abs(diferencia) },
            },
          });
        }

        // Verificar si está por debajo del mínimo
        const stockActual = await tx.stock.findUnique({
          where: { id: s.stockId },
          select: { cantidad: true, stockMinimo: true, nombre: true },
        });

        if (stockActual && stockActual.cantidad <= (stockActual.stockMinimo ?? 0)) {
          alertas.push(`⚠️ El stock de "${stockActual.nombre}" está por debajo del mínimo (${stockActual.cantidad} unidades).`);

          const existeAviso = await tx.aviso.findFirst({
            where: {
              mensaje: { contains: `"${stockActual.nombre}"` },
              leido: false,
            },
          });

if (!existeAviso) {
  await tx.aviso.create({
    data: {
      mensaje: `El producto "${stockActual.nombre}" alcanzó el stock mínimo (${stockActual.cantidad} unidades)`,
      leido: false,
      tipo: 'stock',
      stockId: s.stockId,
    },
  });
}

        }

        // Registrar nuevo stock asignado
        await tx.ordenStock.create({
          data: {
            ordenId: id,
            stockId: s.stockId,
            cantidadUtilizada: s.cantidad,
          },
        });
      }

      // 5. Devolver ítems que ya no están
      for (const anterior of stockPrevio) {
        const sigueExistiendo = stockIdsActuales.includes(anterior.stockId);
        if (!sigueExistiendo) {
          await tx.stock.update({
            where: { id: anterior.stockId },
            data: {
              cantidad: { increment: anterior.cantidadUtilizada },
            },
          });
        }
      }

      // 6. Crear técnicos y certificadores
      for (const idCert of certificadoresUnicos) {
       await tx.empleadoAsignado.create({
  data: {
    ordenId: id,
    empleadoId: idCert,
    rol: 'CERTIFICADOR',
  },
});
      }
      

      for (const idTec of tecnicosUnicos) {
        await tx.empleadoAsignado.create({
          data: {
            ordenId: id,
            empleadoId: idTec,
            rol: 'TECNICO',
          },
        });
      }
    });

    res.json({
      mensaje: 'Fase 3 actualizada correctamente',
      alertas,
    });

  } catch (error) {
    console.error('❌ Error al actualizar fase 3:', error);
    res.status(500).json({ error: 'Error al actualizar fase 3' });
  }
};

// Archivar orden (solo si está cerrada o cancelada)
exports.archivarOrden = async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const orden = await prisma.ordenTrabajo.findUnique({ where: { id } });

    if (!orden) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    if (!['CERRADA', 'CANCELADA'].includes(orden.estadoOrden)) {
      return res
        .status(400)
        .json({ error: 'Solo se pueden archivar órdenes cerradas o canceladas' });
    }

    const ordenArchivada = await prisma.ordenTrabajo.update({
      where: { id },
      data: { archivada: true },
    });

    res.json({ mensaje: 'Orden archivada con éxito', orden: ordenArchivada });
  } catch (error) {
    console.error('❌ Error al archivar orden:', error);
    res.status(500).json({ error: 'Error al archivar orden' });
  }
};


// 5. Eliminar orden
exports.deleteOrden = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.ordenTrabajo.delete({ where: { id } });
    res.json({ mensaje: 'Orden eliminada con éxito' });
  } catch (error) {
    console.error('Error al eliminar orden:', error);
    res.status(500).json({ error: 'Error al eliminar orden' });
  }
};


// Fase 4: Agregar uno o varios registros de trabajo
exports.agregarRegistroTrabajo = async (req, res) => {
  const ordenId = parseInt(req.params.id);
  const registros = Array.isArray(req.body) ? req.body : [req.body];

  try {
    // 1. Validar que todos los empleados estén asignados a la OT
    const asignados = await prisma.empleadoAsignado.findMany({
      where: { ordenId },
      select: { empleadoId: true }
    });

    const empleadosValidos = new Set(asignados.map(a => a.empleadoId));

    for (const r of registros) {
      if (!empleadosValidos.has(r.empleadoId)) {
        return res.status(400).json({ error: `Empleado ${r.empleadoId} no está asignado a la orden.` });
      }
    }

    // 2. Eliminar registros previos de los mismos empleados en esta orden
    const empleadosAActualizar = [...new Set(registros.map(r => r.empleadoId))];

    await prisma.registroDeTrabajo.deleteMany({
      where: {
        ordenId,
        empleadoId: { in: empleadosAActualizar },
      },
    });

    // 3. Crear nuevos registros
    const nuevosRegistros = await Promise.all(
      registros.map((r) =>
        prisma.registroDeTrabajo.create({
          data: {
            ordenId,
            empleadoId: r.empleadoId,
            fecha: new Date(r.fecha),
            horas: parseFloat(r.horas),
          },
        })
      )
    );

    res.status(201).json(nuevosRegistros);
  } catch (error) {
    console.error('❌ Error al agregar registros de trabajo:', error);
    res.status(500).json({ error: 'Error al guardar registros de trabajo' });
  }
};

// Fase 4: Subir archivo de factura
exports.subirArchivoFactura = (req, res) =>
  subirArchivoGenerico({
    req,
    res,
    modeloPrisma: prisma.ordenTrabajo,
    campoArchivo: 'archivoFactura',
    nombreRecurso: 'Orden de trabajo (factura)',
  });


// Cancelar orden de trabajo
exports.cancelarOrden = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const orden = await prisma.ordenTrabajo.findUnique({
      where: { id },
      include: {
        avion: { include: { ComponenteAvion: true, propietarios: true } },
        componente: { include: { propietario: true } },
      },
    });
    if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });

    // Si ya hay snapshots, no los recalculo: solo estado + fechaCancelacion
    if (orden.datosAvionSnapshot || orden.datosComponenteSnapshot) {
      const actualizada = await prisma.ordenTrabajo.update({
        where: { id },
        data: { estadoOrden: 'CANCELADA', fechaCancelacion: new Date() }, // 👈 fecha
      });
      return res.json({ mensaje: 'Orden cancelada', orden: actualizada });
    }

    // Caso normal: genero snapshots
    let datosAvionSnapshot = null, datosComponenteSnapshot = null, datosPropietarioSnapshot = null;

    if (orden.avion) {
      const a = orden.avion;
      datosAvionSnapshot = {
        id: a.id, matricula: a.matricula, marca: a.marca, modelo: a.modelo,
        numeroSerie: a.numeroSerie, TSN: a.TSN, vencimientoMatricula: a.vencimientoMatricula,
        vencimientoSeguro: a.vencimientoSeguro, certificadoMatricula: a.certificadoMatricula,
        componentes: a.ComponenteAvion.map(c => ({
          tipo: c.tipo, marca: c.marca, modelo: c.modelo, numeroSerie: c.numeroSerie,
          TSN: c.TSN, TSO: c.TSO, TBOHoras: c.TBOHoras, TBOFecha: c.TBOFecha,
        })),
        propietarios: a.propietarios.map(p => ({
          tipo: p.tipo, nombre: p.nombre, apellido: p.apellido, razonSocial: p.razonSocial,
          rut: p.rut, cedula: p.cedula, email: p.email, telefono: p.telefono,
        })),
      };
      if (a.propietarios.length === 1) {
        const p = a.propietarios[0];
        datosPropietarioSnapshot = {
          tipo: p.tipo, nombre: p.nombre, apellido: p.apellido, razonSocial: p.razonSocial,
          rut: p.rut, cedula: p.cedula, email: p.email, telefono: p.telefono,
        };
      }
    }

    if (orden.componente) {
      const c = orden.componente;
      datosComponenteSnapshot = {
        tipo: c.tipo, marca: c.marca, modelo: c.modelo, numeroSerie: c.numeroSerie,
        TSN: c.TSN, TSO: c.TSO, TBOHoras: c.TBOHoras, TBOFecha: c.TBOFecha, archivo8130: c.archivo8130,
      };
      if (c.propietario) {
        const p = c.propietario;
        datosPropietarioSnapshot = {
          tipo: p.tipo, nombre: p.nombre, apellido: p.apellido, razonSocial: p.razonSocial,
          rut: p.rut, cedula: p.cedula, email: p.email, telefono: p.telefono,
        };
      }
    }

    const ordenCancelada = await prisma.ordenTrabajo.update({
      where: { id },
      data: {
        estadoOrden: 'CANCELADA',
        fechaCancelacion: new Date(), // 👈 fecha
        datosAvionSnapshot,
        datosComponenteSnapshot,
        datosPropietarioSnapshot,
      },
    });

    res.json({ mensaje: 'Orden cancelada', orden: ordenCancelada });
  } catch (error) {
    console.error('Error al cancelar orden:', error);
    res.status(500).json({ error: 'Error al cancelar orden' });
  }
};



// eliminar registro de trabajos
exports.eliminarRegistroTrabajo = async (req, res) => {
  const id = parseInt(req.params.registroId);
  try {
    await prisma.registroDeTrabajo.delete({ where: { id } });
    res.json({ mensaje: 'Registro de trabajo eliminado con éxito' });
  } catch (error) {
    console.error('❌ Error al eliminar registro de trabajo:', error);
    res.status(500).json({ error: 'Error al eliminar registro de trabajo' });
  }
};

// Cerrar orden de trabajos
exports.cerrarOrden = async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const orden = await prisma.ordenTrabajo.findUnique({
      where: { id },
      include: {
        avion: {
          include: {
            ComponenteAvion: true,
            propietarios: true, // 👈 ¡nuevo!
          },
        },
        componente: {
          include: {
            propietario: true,
          },
        },
      },
    });

    if (!orden) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

// Si ya tiene snapshot, solo actualizamos estado + fecha de cierre
if (orden.datosAvionSnapshot || orden.datosComponenteSnapshot) {
  const actualizada = await prisma.ordenTrabajo.update({
    where: { id },
    data: {
      estadoOrden: 'CERRADA',
      fechaCierre: new Date(), // 👈 dentro de data
    },
  });
  return res.json(actualizada);
}

    let datosAvionSnapshot = null;
    let datosComponenteSnapshot = null;
    let datosPropietarioSnapshot = null;

if (orden.avion) {
  const avion = orden.avion;
  datosAvionSnapshot = {
    id: avion.id,
    matricula: avion.matricula,
    marca: avion.marca,
    modelo: avion.modelo,
    numeroSerie: avion.numeroSerie,
    TSN: avion.TSN,
    vencimientoMatricula: avion.vencimientoMatricula,
    vencimientoSeguro: avion.vencimientoSeguro,
    certificadoMatricula: avion.certificadoMatricula,
    componentes: avion.ComponenteAvion.map(comp => ({
      tipo: comp.tipo,
      marca: comp.marca,
      modelo: comp.modelo,
      numeroSerie: comp.numeroSerie,
      TSN: comp.TSN,
      TSO: comp.TSO,
      TBOHoras: comp.TBOHoras,
      TBOFecha: comp.TBOFecha,
    })),
    propietarios: avion.propietarios.map(p => ({
      tipo: p.tipo,
      nombre: p.nombre,
      apellido: p.apellido,
      razonSocial: p.razonSocial,
      rut: p.rut,
      cedula: p.cedula,
      email: p.email,
      telefono: p.telefono,
    })),
  };

  if (avion.propietarios.length === 1) {
    const p = avion.propietarios[0];
    datosPropietarioSnapshot = {
      tipo: p.tipo,
      nombre: p.nombre,
      apellido: p.apellido,
      razonSocial: p.razonSocial,
      rut: p.rut,
      cedula: p.cedula,
      email: p.email,
      telefono: p.telefono,
    };
  }
}


    if (orden.componente) {
      const comp = orden.componente;
      datosComponenteSnapshot = {
        tipo: comp.tipo,
        marca: comp.marca,
        modelo: comp.modelo,
        numeroSerie: comp.numeroSerie,
        TSN: comp.TSN,
        TSO: comp.TSO,
        TBOHoras: comp.TBOHoras,
        TBOFecha: comp.TBOFecha,
        archivo8130: comp.archivo8130,
      };

      if (comp.propietario) {
        const p = comp.propietario;
        datosPropietarioSnapshot = {
          tipo: p.tipo,
          nombre: p.nombre,
          apellido: p.apellido,
          razonSocial: p.razonSocial,
          rut: p.rut,
          cedula: p.cedula,
          email: p.email,
          telefono: p.telefono,
        };
      }
    }

    const ordenCerrada = await prisma.ordenTrabajo.update({
      where: { id },
      data: {
        estadoOrden: 'CERRADA',
        fechaCierre: new Date(),
        datosAvionSnapshot,
        datosComponenteSnapshot,
        datosPropietarioSnapshot,
      },
    });

    res.json(ordenCerrada);
  } catch (error) {
    console.error('❌ Error al cerrar orden:', error);
    res.status(500).json({ error: 'Error al cerrar orden' });
  }
};

exports.descargarOrdenPDF = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const orden = await prisma.ordenTrabajo.findUnique({
      where: { id },
      include: {
        stockAsignado: { include: { stock: true } },
        herramientas:  { include: { herramienta: true } },
        empleadosAsignados: { include: { empleado: true } },
        registrosTrabajo: true,
      }
    });
    if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });

    const fmt = d => d ? new Date(d).toLocaleDateString('es-UY') : '—';
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const av   = orden.datosAvionSnapshot || null;
    const comp = orden.datosComponenteSnapshot || null;
    const prop = orden.datosPropietarioSnapshot || null;

    const esCerrada = orden.estadoOrden === 'CERRADA';
    const etiquetaFecha = esCerrada ? 'Fecha de cierre' : 'Fecha de cancelación';
    const fechaCambio = esCerrada ? orden.fechaCierre : (orden.fechaCancelacion || null); // si no tenés el campo, mostrará '—'

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const filename = `orden-${id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    doc.pipe(res);

    // Logo + encabezado
    try {
      const logoPath = path.join(process.cwd(), 'public', 'celcol-logo.jpeg');
      if (fs.existsSync(logoPath)) doc.image(logoPath, 40, 30, { width: 80 });
    } catch {}
    doc.fontSize(18).text('Celcol | Orden de Trabajo', 130, 40);
    doc.moveDown(2);

    // Portada
    doc.fontSize(16).text(`OT N.º ${orden.id}`, { underline: true });
    doc.fontSize(12).moveDown(0.5);
    doc.text(`Estado: ${orden.estadoOrden}`);
    doc.text(`Fecha de apertura: ${fmt(orden.fechaApertura)}`);
    doc.text(`${etiquetaFecha}: ${fmt(fechaCambio)}`);
    doc.moveDown();

    // Datos de solicitud
    doc.fontSize(14).text('Datos de solicitud');
    line(doc);
    doc.fontSize(12);
    doc.text(`Descripción: ${orden.solicitud ?? '—'}`);
    doc.text(`Solicitado por: ${orden.solicitadoPor ?? '—'}`);
    doc.text(`N.º OT previa: ${orden.OTsolicitud ?? '—'}`);
    if (orden.solicitudFirma) doc.text(`Archivo de solicitud: ${baseUrl}/${orden.solicitudFirma}`);
    doc.moveDown();

    // Avión (snapshot)
    doc.fontSize(14).text('Avión (snapshot)');
    line(doc);
    doc.fontSize(12);
    if (av) {
      doc.text(`Matrícula: ${av.matricula ?? '—'}`);
      doc.text(`Marca/Modelo: ${av.marca ?? '—'} ${av.modelo ?? ''}`);
      doc.text(`Serie: ${av.numeroSerie ?? '—'}`);
      doc.text(`TSN: ${av.TSN ?? '—'}`);
      if (av.certificadoMatricula) doc.text(`Certificado: ${baseUrl}/${av.certificadoMatricula}`);
    } else {
      doc.fillColor('#666').text('Sin datos').fillColor('#000');
    }
    doc.moveDown();

    // Componente externo (snapshot)
    doc.fontSize(14).text('Componente externo (snapshot)');
    line(doc);
    doc.fontSize(12);
    if (comp) {
      doc.text(`Tipo: ${comp.tipo ?? '—'}`);
      doc.text(`Marca/Modelo: ${comp.marca ?? '—'} ${comp.modelo ?? ''}`);
      doc.text(`Serie/Parte: ${comp.numeroSerie ?? '—'} / ${comp.numeroParte ?? '—'}`);
      if (comp.archivo8130) doc.text(`Archivo 8130: ${baseUrl}/${comp.archivo8130}`);
    } else {
      doc.fillColor('#666').text('Sin datos').fillColor('#000');
    }
    doc.moveDown();

    // Propietario (snapshot)
    doc.fontSize(14).text('Propietario (snapshot)');
    line(doc);
    doc.fontSize(12);
    if (prop) {
      const nombre = prop.razonSocial ?? [prop.nombre, prop.apellido].filter(Boolean).join(' ');
      doc.text(`Nombre/Razón Social: ${nombre || '—'}`);
      doc.text(`RUT/Cédula: ${prop.rut ?? prop.cedula ?? '—'}`);
      if (prop.email) doc.text(`Email: ${prop.email}`);
      if (prop.telefono) doc.text(`Teléfono: ${prop.telefono}`);
    } else {
      doc.fillColor('#666').text('Sin datos').fillColor('#000');
    }
    doc.moveDown();

    // Herramientas
    if (orden.herramientas?.length) {
      doc.fontSize(14).text('Herramientas asignadas');
      line(doc);
      doc.fontSize(12);
      orden.herramientas.forEach(h => {
        doc.text(`- ${h.herramienta?.nombre ?? '—'} ${h.herramienta?.marca ?? ''} ${h.herramienta?.modelo ?? ''}`);
      });
      doc.moveDown();
    }

    // Stock
    if (orden.stockAsignado?.length) {
      doc.fontSize(14).text('Stock utilizado');
      line(doc);
      doc.fontSize(12);
      orden.stockAsignado.forEach(s => {
        doc.text(`- ${s.stock?.nombre ?? '—'}  · Cantidad: ${s.cantidad ?? '—'}`);
      });
      doc.moveDown();
    }

    // Personal
    if (orden.empleadosAsignados?.length) {
      doc.fontSize(14).text('Personal asignado');
      line(doc);
      doc.fontSize(12);
      orden.empleadosAsignados.forEach(e => {
        const nombre = [e.empleado?.nombre, e.empleado?.apellido].filter(Boolean).join(' ');
        doc.text(`- ${nombre || '—'}  · Rol: ${e.rol}`);
      });
      doc.moveDown();
    }

    // Horas trabajadas
    if (orden.registrosTrabajo?.length) {
      doc.fontSize(14).text('Horas trabajadas');
      line(doc);
      doc.fontSize(12);
      orden.registrosTrabajo.forEach(r => {
        doc.text(`- ${fmt(r.fecha)}  · ${r.horas} h`);
      });
      doc.moveDown();
    }

    // Observaciones y factura
    doc.fontSize(14).text('Observaciones y factura');
    line(doc);
    doc.fontSize(12);
    doc.text(`Inspección recibida: ${orden.inspeccionRecibida ? 'Sí' : 'No'}`);
    doc.text(`Daños previos: ${orden.danosPrevios ?? '—'}`);
    doc.text(`Acción tomada: ${orden.accionTomada ?? '—'}`);
    doc.text(`Observaciones: ${orden.observaciones ?? '—'}`);
    doc.moveDown(0.6);
    doc.text(`Factura Nº: ${orden.numeroFactura ?? '—'}`);
    doc.text(`Estado factura: ${orden.estadoFactura ?? '—'}`);
    if (orden.archivoFactura) doc.text(`Archivo factura: ${baseUrl}/${orden.archivoFactura}`);

    doc.end();
  } catch (error) {
    console.error('Error al generar PDF de OT:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error al generar el PDF' });
    }
  }
};

function line(doc) {
  doc
    .moveTo(doc.x, doc.y + 2)
    .lineTo(550, doc.y + 2)
    .strokeColor('#e5e7eb')
    .stroke()
    .fillColor('#000')
    .moveDown(0.6);
}
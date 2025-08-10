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

// Fase 4: Cancelar orden de trabajo
exports.cancelarOrden = async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const orden = await prisma.ordenTrabajo.findUnique({
      where: { id },
      include: {
        avion: {
          include: {
            ComponenteAvion: true,
            propietarios: true, // <-- ¡esto es nuevo!
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

    // Si ya tiene snapshot, solo cambiamos el estado
    if (orden.datosAvionSnapshot || orden.datosComponenteSnapshot) {
      const actualizada = await prisma.ordenTrabajo.update({
        where: { id },
        data: { estadoOrden: 'CANCELADA' },
      });
      return res.json({ mensaje: 'Orden cancelada', orden: actualizada });
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

    const ordenCancelada = await prisma.ordenTrabajo.update({
      where: { id },
      data: {
        estadoOrden: 'CANCELADA',
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

    // Si ya tiene snapshot, solo actualizamos estado
    if (orden.datosAvionSnapshot || orden.datosComponenteSnapshot) {
      const actualizada = await prisma.ordenTrabajo.update({
        where: { id },
        data: { estadoOrden: 'CERRADA' },
        fechaCierre: new Date()
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
        avion: true,
        componente: true,
        stockAsignado: { include: { stock: true } },
        herramientas: { include: { herramienta: true } },
        empleadosAsignados: { include: { empleado: true } },
      }
    });

    if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });

    const doc = new PDFDocument();
    const filename = `orden-${id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    doc.pipe(res);

    // Logo y encabezado
    const logoPath = path.join(process.cwd(), 'public', 'celcol-logo.jpeg');
    if (fs.existsSync(logoPath)) doc.image(logoPath, 50, 30, { width: 80 });
    doc.fontSize(20).text('Celcol', 140, 40);
    doc.moveDown(2);

    // Datos principales
    doc.fontSize(16).text(`Orden de Trabajo N.º ${orden.id}`, { underline: true });
    doc.fontSize(12).text(`Estado: ${orden.estadoOrden}`);
    doc.text(`Fecha de apertura: ${orden.fechaApertura?.toISOString().slice(0, 10) || 'No registrada'}`);
    doc.moveDown();

    // Avión o componente
    if (orden.avion) {
      doc.fontSize(14).text(`Avión: ${orden.avion.matricula || 'N/A'} - ${orden.avion.marca} ${orden.avion.modelo}`);
    } else if (orden.componente) {
      doc.fontSize(14).text(`Componente: ${orden.componente.tipo} - ${orden.componente.marca} ${orden.componente.modelo}`);
    }
    doc.moveDown();

    // Stock
    if (orden.stockAsignado.length) {
      doc.fontSize(13).text('Stock utilizado:');
      orden.stockAsignado.forEach(s => {
        doc.text(`- ${s.stock.nombre} (${s.cantidad} u)`);
      });
      doc.moveDown();
    }

    // Herramientas
    if (orden.herramientas.length) {
      doc.fontSize(13).text('Herramientas asignadas:');
      orden.herramientas.forEach(h => {
        doc.text(`- ${h.herramienta.nombre} (${h.herramienta.marca} ${h.herramienta.modelo})`);
      });
      doc.moveDown();
    }

    // Personal
    if (orden.empleadosAsignados.length) {
   doc
  .fontSize(20)
  .text('Celcol', 140, 40, { continued: true });

doc
  .fontSize(12)
  .text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, {
    align: 'right'
  });

doc.moveDown(2);

    }
    

    doc.end();
  } catch (error) {
    console.error('Error al generar PDF de OT:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error al generar el PDF' });
    }
  }
};
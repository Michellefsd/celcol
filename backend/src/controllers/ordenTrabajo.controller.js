const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { subirArchivoGenerico } = require('../utils/archivoupload');


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

// 2. Obtener una orden por ID
exports.getOrdenById = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const orden = await prisma.ordenTrabajo.findUnique({
      where: { id },
      include: {
        avion: true,
        componente: true,
        empleadosAsignados: { include: { empleado: true } },
        herramientas: { include: { herramienta: true } },
        stockAsignado: { include: { stock: true } },
        registrosTrabajo: true,
      },
    });
    if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });


   const baseUrl = `${req.protocol}://${req.get('host')}`;

    res.json({
      ...orden,
      solicitudFirma: orden.solicitudFirma ? `${baseUrl}/${orden.solicitudFirma}` : null,
     archivoFactura: orden.archivoFactura ? `${baseUrl}/${orden.archivoFactura}` : null,
    });

  } catch (error) {
    console.error('Error al obtener orden:', error);
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
  const { solicitud, solicitadoPor } = req.body;
  const archivo = req.files?.solicitudFirma?.[0]?.path;

  try {
    const updated = await prisma.ordenTrabajo.update({
      where: { id },
      data: {
        solicitud,
        solicitadoPor,
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



// Fase 3: Actualizar inspección y asignación de recursos cuando el avion esta con celcol

/*exports.updateFase3 = async (req, res) => {
  const id = parseInt(req.params.id);
  const {
    inspeccionRecibida,
    danosPrevios,
    accionTomada,
    observaciones,
    herramientas,
    stock,
    certificadorId,
    tecnicoId,
  } = req.body;

  try {
    const updated = await prisma.ordenTrabajo.update({
      where: { id },
      data: {
        inspeccionRecibida,
        danosPrevios,
        accionTomada,
        observaciones,

        herramientas: {
          deleteMany: {},
          create: herramientas?.map((hId) => ({
            herramienta: { connect: { id: hId } },
          })),
        },

        stockAsignado: {
          deleteMany: {},
          create: stock?.map((s) => ({
            stock: { connect: { id: s.stockId } },
            cantidadUtilizada: s.cantidad,
          })),
        },

        empleadosAsignados: {
          deleteMany: {},
         create: [
  ...(req.body.certificadores ?? []).map((id) => ({
    empleado: { connect: { id } },
  })),
  ...(req.body.tecnicos ?? []).map((id) => ({
    empleado: { connect: { id } },
  })),
]

        },
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar fase 3:', error);
    res.status(500).json({ error: 'Error al actualizar fase 3' });
  }
};

*/


exports.updateFase3 = async (req, res) => {
  const id = parseInt(req.params.id);
  const {
    inspeccionRecibida,
    danosPrevios,
    accionTomada,
    observaciones,
    herramientas,
    stock,
    certificadores = [],
    tecnicos = [],
  } = req.body;

  try {
    // Primero, actualizamos los datos generales
    const updatedOrden = await prisma.ordenTrabajo.update({
      where: { id },
      data: {
        inspeccionRecibida,
        danosPrevios,
        accionTomada,
        observaciones,

        herramientas: {
          deleteMany: {},
          create: herramientas?.map((hId) => ({
            herramienta: { connect: { id: hId } },
          })),
        },

        stockAsignado: {
          deleteMany: {},
          create: stock?.map((s) => ({
            stock: { connect: { id: s.stockId } },
            cantidadUtilizada: s.cantidad,
          })),
        },

        empleadosAsignados: {
          deleteMany: {},
          create: [
            ...certificadores.map((id) => ({
              empleado: { connect: { id } },
            })),
            ...tecnicos.map((id) => ({
              empleado: { connect: { id } },
            })),
          ],
        },
      },
    });

    // Luego, actualizamos el stock real
    const alertas = [];

    for (const s of stock ?? []) {
      const stockActual = await prisma.stock.findUnique({
        where: { id: s.stockId },
        select: { cantidad: true, stockMinimo: true, nombre: true },
      });

      if (!stockActual) continue;

      const nuevaCantidad = stockActual.cantidad - s.cantidad;

      await prisma.stock.update({
        where: { id: s.stockId },
        data: { cantidad: nuevaCantidad },
      });

     if (nuevaCantidad <= (stockActual.stockMinimo ?? 0)) {
  alertas.push(`⚠️ El stock de "${stockActual.nombre}" está por debajo del mínimo (${nuevaCantidad} unidades).`);

  await prisma.aviso.create({
    data: {
      mensaje: `El producto "${stockActual.nombre}" alcanzó el stock mínimo (${nuevaCantidad} unidades)`,
      leido: false,
    },
  });
}

    }

    res.json({
      mensaje: 'Fase 3 actualizada correctamente',
      alertas,
    });
  } catch (error) {
    console.error('❌ Error al actualizar fase 3:', error);
    res.status(500).json({ error: 'Error al actualizar fase 3' });
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
    const nuevosRegistros = await Promise.all(
      registros.map((r) =>
        prisma.registroDeTrabajo.create({
          data: {
            orden: { connect: { id: ordenId } },
            empleado: { connect: { id: r.empleadoId } },
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
    const ordenCerrada = await prisma.ordenTrabajo.update({
      where: { id },
      data: {
        estadoOrden: 'CERRADA', // solo si tenés este campo en el modelo
      },
    });
    res.json(ordenCerrada);
  } catch (error) {
    console.error('❌ Error al cerrar orden:', error);
    res.status(500).json({ error: 'Error al cerrar orden' });
  }
};

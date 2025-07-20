const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


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
    res.json(orden);
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

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.obtenerRegistrosTrabajoPorEmpleado = async (req, res) => {
  const empleadoId = parseInt(req.params.id);
  const { desde, hasta } = req.query;

  try {
    const filtros = {
      empleadoId,
    };

    if (desde || hasta) {
      filtros.fecha = {};
      if (desde) filtros.fecha.gte = new Date(desde);
      if (hasta) filtros.fecha.lte = new Date(hasta);
    }

    const registros = await prisma.registroDeTrabajo.findMany({
      where: filtros,
      include: {
        orden: {
          select: {
            id: true,
            fechaApertura: true,
            solicitud: true,
          },
        },
      },
      orderBy: { fecha: 'asc' },
    });

    const totalHoras = registros.reduce((sum, r) => sum + r.horas, 0);

    res.json({ registros, totalHoras });
  } catch (error) {
    console.error('Error en obtenerRegistrosTrabajoPorEmpleado:', error);
    res.status(500).json({ error: 'No se pudo obtener registros de trabajo' });
  }
};

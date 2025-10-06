import prisma from '../lib/prisma.js';

// LISTAR
export async function listarComponentes(req, res) {
  try {
    const componentes = await prisma.componenteAvion.findMany({
      include: { avion: true }
    });
    res.json(componentes);
  } catch (error) {
    console.error('Error al listar componentes de aeronave', error);
    res.status(500).json({ error: 'Error al obtener los componentes' });
  }
};

// CREAR
export async function crearComponente(req, res) {
  try {
    const {
      tipo,
      marca,
      modelo,
      numeroSerie,
      estado,
      avionId,
      TSN,
      TSO,
      TBOFecha,
      TBOHoras
    } = req.body;

    // Validación de campos obligatorios
    if (!tipo || !marca || !modelo || !numeroSerie || !estado || !avionId) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const nuevo = await prisma.componenteAvion.create({
      data: {
        tipo,
        marca,
        modelo,
        numeroSerie,
        estado,
        avionId: parseInt(avionId),
        TSN: TSN ? parseFloat(TSN) : null,
        TSO: TSO ? parseFloat(TSO) : null,
        TBOFecha: TBOFecha ? new Date(TBOFecha) : null,
        TBOHoras: TBOHoras ? parseFloat(TBOHoras) : null
      }
    });

    res.status(201).json(nuevo);
  } catch (error) {
    console.error('Error al crear componente:', error);
    res.status(500).json({ error: 'Error al crear el componente' });
  }
};

// OBTENER
export async function obtenerComponente(req, res) {
  const id = parseInt(req.params.id);
  try {
    const componente = await prisma.componenteAvion.findUnique({
      where: { id },
      include: { avion: true }
    });
    if (!componente) return res.status(404).json({ error: 'Componente no encontrado' });
    res.json(componente);
  } catch (error) {
    console.error('Error al obtener componente:', error);
    res.status(500).json({ error: 'Error al obtener el componente' });
  }
};

// ACTUALIZAR
export async function actualizarComponente(req, res) {
  const id = parseInt(req.params.id);
  const { TSO } = req.body;

  try {
    // Lógica opcional: sumar TSO a TSN
    /*
    const componenteExistente = await prisma.componenteAvion.findUnique({ where: { id } });
    if (componenteExistente && TSO) {
      req.body.TSN = (componenteExistente.TSN || 0) + parseFloat(TSO);
    }
    */

    const actualizado = await prisma.componenteAvion.update({
      where: { id },
      data: req.body
    });
    res.json(actualizado);
  } catch (error) {
    console.error('Error al actualizar componente:', error);
    res.status(500).json({ error: 'Error al actualizar el componente' });
  }
};

// ELIMINAR
export async function eliminarComponente(req, res) {
  const id = parseInt(req.params.id);
  try {
    await prisma.componenteAvion.delete({ where: { id } });
    res.json({ mensaje: 'Componente eliminado' });
  } catch (error) {
    console.error('Error al eliminar componente:', error);
    res.status(500).json({ error: 'Error al eliminar el componente' });
  }
};

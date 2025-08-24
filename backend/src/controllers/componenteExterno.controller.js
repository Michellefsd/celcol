import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import { subirArchivoGenerico } from '../utils/archivoupload.js';

const prisma = new PrismaClient();

// LISTAR
export const listarComponentesExternos = async (_req, res) => {
  try {
    const componentes = await prisma.componenteExterno.findMany({
      where: { archivado: false },
      include: { propietario: true },
    });
    res.json(componentes);
  } catch (error) {
    console.error('Error al listar componentes externos:', error);
    res.status(500).json({ error: 'Error al obtener los componentes externos' });
  }
};

// CREAR
export const crearComponenteExterno = async (req, res) => {
  try {
    const {
      tipo,
      marca,
      modelo,
      numeroSerie,
      numeroParte,
      TSN,
      TSO,
      TBOFecha,
      TBOHoras,
      propietarioId,
    } = req.body;

    const archivo = req.file;

    if (!marca || !modelo || !numeroSerie || !propietarioId) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const componente = await prisma.componenteExterno.create({
      data: {
        tipo: tipo || null,
        marca,
        modelo,
        numeroSerie,
        numeroParte: numeroParte || null,
        TSN: TSN ? parseFloat(TSN) : null,
        TSO: TSO ? parseFloat(TSO) : null,
        TBOFecha: TBOFecha ? new Date(TBOFecha) : null,
        TBOHoras: TBOHoras ? parseInt(TBOHoras) : null,
        archivo8130: archivo ? archivo.path : null,
        propietarioId: parseInt(propietarioId),
      },
    });

    res.status(201).json(componente);
  } catch (error) {
    console.error('Error al crear componente externo:', error);
    res.status(500).json({ error: 'Error al crear el componente externo' });
  }
};

// OBTENER POR ID — ?includeArchived=1 y URL absoluta 8130
export const obtenerComponenteExterno = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const includeArchived =
      req.query.includeArchived === '1' || req.query.includeArchived === 'true';

    const componente = await prisma.componenteExterno.findUnique({
      where: { id },
      include: { propietario: true },
    });

    if (!componente) {
      return res.status(404).json({ error: 'Componente externo no encontrado' });
    }

    if (!includeArchived && componente.archivado) {
      return res.status(404).json({ error: 'Componente externo no encontrado' });
    }

    const toAbs = (p) => {
      if (!p || typeof p !== 'string') return p;
      if (/^https?:\/\//i.test(p)) return p;
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const normalized = p.replace(/\\/g, '/').replace(/^\/+/, '');
      return `${baseUrl}/${normalized}`;
    };

    const componenteOut = {
      ...componente,
      archivo8130: toAbs(componente.archivo8130),
      certificado8130: toAbs(componente.certificado8130),
    };

    return res.json(componenteOut);
  } catch (error) {
    console.error('Error al obtener componente externo:', error);
    return res.status(500).json({ error: 'Error al obtener el componente externo' });
  }
};

// ACTUALIZAR
export const actualizarComponenteExterno = async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const componenteActual = await prisma.componenteExterno.findUnique({ where: { id } });

    // ✅ Primero existencia, luego estado
    if (!componenteActual) {
      return res.status(404).json({ error: 'Componente externo no encontrado' });
    }
    if (componenteActual.archivado) {
      return res.status(400).json({ error: 'No se puede modificar un componente archivado' });
    }

    const {
      tipo,
      marca,
      modelo,
      numeroSerie,
      numeroParte,
      TSN,
      TSO,
      TBOFecha,
      TBOHoras,
      propietarioId,
    } = req.body;

    const archivo = req.file;

    const data = {
      tipo,
      marca,
      modelo,
      numeroSerie,
      numeroParte: numeroParte || null,
      TSN: TSN ? parseFloat(TSN) : null,
      TSO: TSO ? parseFloat(TSO) : null,
      TBOFecha: TBOFecha ? new Date(TBOFecha) : null,
      TBOHoras: TBOHoras ? parseInt(TBOHoras) : null,
      propietarioId: propietarioId ? parseInt(propietarioId) : undefined,
    };

    if (archivo) {
      // usamos el que ya buscamos arriba
      if (componenteActual.archivo8130 && fs.existsSync(componenteActual.archivo8130)) {
        fs.unlinkSync(componenteActual.archivo8130);
      }
      data.archivo8130 = archivo.path;
    }

    const actualizado = await prisma.componenteExterno.update({
      where: { id },
      data,
    });

    res.json(actualizado);
  } catch (error) {
    console.error('Error al actualizar componente externo:', error);
    res.status(500).json({ error: 'Error al actualizar el componente externo' });
  }
};

// SUBIR ARCHIVO 8130 usando función genérica
export const subirArchivo8130 = (req, res) =>
  subirArchivoGenerico({
    req,
    res,
    modeloPrisma: prisma.componenteExterno,
    campoArchivo: 'archivo8130',
    nombreRecurso: 'Componente externo',
    // ⚠️ tu ruta usa :componenteId → indicamos el nombre del param
    campoParam: 'componenteId',
  });

// PATCH /componentes/archivar/:id
export const archivarComponenteExterno = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    const componente = await prisma.componenteExterno.findUnique({
      where: { id },
      select: { id: true, archivado: true },
    });
    if (!componente) {
      return res.status(404).json({ error: 'Componente externo no encontrado' });
    }
    if (componente.archivado) {
      return res.status(409).json({ error: 'El componente externo ya está archivado.' });
    }

    const otAbierta = await prisma.ordenTrabajo.findFirst({
      where: { componenteId: id, estadoOrden: 'ABIERTA' },
      select: { id: true },
    });
    if (otAbierta) {
      return res.status(409).json({
        error: `No se puede archivar: el componente está en uso en la OT ID ${otAbierta.id} (ABIERTA).`,
      });
    }

    const actualizado = await prisma.componenteExterno.update({
      where: { id },
      data: { archivado: true },
      select: { id: true },
    });

    return res.json({
      mensaje: 'Componente externo archivado correctamente.',
      id: actualizado.id,
    });
  } catch (error) {
    console.error('Error al archivar componente externo:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    });
    return res.status(500).json({ error: 'Error al archivar el componente externo' });
  }
};

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import { subirArchivoGenerico } from '../utils/archivoupload.js';
import { herramientaEnOtAbierta } from '../services/archiveGuards.js';
import { crearAvisoPorVencimientoHerramienta } from '../utils/avisos.js';


const prisma = new PrismaClient();

// LISTAR TODAS
export const listarHerramientas = async (req, res) => {
  try {
    const herramientas = await prisma.herramienta.findMany({
      where: { archivado: false },
    });

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const herramientasConUrl = herramientas.map((herramienta) => ({
      ...herramienta,
      certificadoCalibracion: herramienta.certificadoCalibracion
        ? `${baseUrl}/${herramienta.certificadoCalibracion.replace(/\\/g, '/')}`
        : null,
    }));

    res.json(herramientasConUrl);
  } catch (error) {
    console.error('Error al listar herramientas:', error);
    res.status(500).json({ error: 'Error al obtener las herramientas' });
  }
};

// OBTENER POR ID — admite ?includeArchived=1 y normaliza URL de certificado
export const obtenerHerramienta = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const includeArchived =
      req.query.includeArchived === '1' || req.query.includeArchived === 'true';

    const where = includeArchived ? { id } : { id, archivado: false };
    const herramienta = await prisma.herramienta.findFirst({ where });

    if (!herramienta) {
      return res.status(404).json({ error: 'Herramienta no encontrada' });
    }

    const toAbs = (p) => {
      if (!p || typeof p !== 'string') return p;
      if (/^https?:\/\//i.test(p)) return p;
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const normalized = p.replace(/\\/g, '/').replace(/^\/+/, '');
      return `${baseUrl}/${normalized}`;
    };

    res.json({
      ...herramienta,
      certificadoCalibracion: toAbs(herramienta.certificadoCalibracion),
    });
  } catch (error) {
    console.error('Error al obtener herramienta:', error);
    res.status(500).json({ error: 'Error al obtener la herramienta' });
  }
};

// CREAR HERRAMIENTA
export const crearHerramienta = async (req, res) => {
  try {
    const {
      nombre,
      tipo,
      marca,
      modelo,
      numeroSerie,
      fechaIngreso,
      fechaVencimiento,
    } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'El campo "nombre" es obligatorio' });
    }

    const data = {
      nombre,
      tipo: tipo || null,
      marca: marca || null,
      modelo: modelo || null,
      numeroSerie: numeroSerie || null,
      // NO enviar certificadoCalibracion ni certificadoCalibracionId aquí
    };

    if (fechaIngreso) {
      const fi = new Date(fechaIngreso);
      if (!isNaN(fi)) data.fechaIngreso = fi;
    }
    if (fechaVencimiento) {
      const fv = new Date(fechaVencimiento);
      if (!isNaN(fv)) data.fechaVencimiento = fv;
    }

    const nuevaHerramienta = await prisma.herramienta.create({ data });
    return res.status(201).json(nuevaHerramienta);
  } catch (error) {
    console.error('Error al crear herramienta:', error);
    return res.status(500).json({ error: 'Error al crear la herramienta' });
  }
};


// ACTUALIZAR HERRAMIENTA (sin manejo de archivos)
export const actualizarHerramienta = async (req, res) => {
  const id = Number(req.params.id);
  try {
    const {
      nombre,
      tipo,
      marca,
      modelo,
      numeroSerie,
      fechaIngreso,
      fechaVencimiento,
    } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'El campo "nombre" es obligatorio' });
    }

    // Solo campos válidos del modelo
    const data = {
      nombre,
      tipo: tipo || null,
      marca: marca || null,
      modelo: modelo || null,
      numeroSerie: numeroSerie || null,
    };

    // Fechas: incluir solo si vienen (evita undefined)
    if (fechaIngreso !== undefined) {
      data.fechaIngreso = fechaIngreso ? new Date(fechaIngreso) : null;
    }
    if (fechaVencimiento !== undefined) {
      data.fechaVencimiento = fechaVencimiento ? new Date(fechaVencimiento) : null;
    }

    const herramienta = await prisma.herramienta.update({
      where: { id },
      data,
    });

    res.json(herramienta);
  } catch (error) {
    console.error('Error al actualizar herramienta:', error);
    res.status(500).json({ error: 'Error al actualizar la herramienta' });
  }
};


// ARCHIVAR HERRAMIENTA (bloquea si está en OT abierta)
export const archivarHerramienta = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const existe = await prisma.herramienta.findUnique({ where: { id } });
    if (!existe) return res.status(404).json({ error: 'Herramienta no encontrada' });
    if (await herramientaEnOtAbierta(id)) {
      return res.status(409).json({ error: 'No se puede archivar: la herramienta está usada en OT abiertas' });
    }

    const out = await prisma.herramienta.update({
      where: { id },
      data: { archivado: true, archivedAt: new Date(), archivedBy: req.user?.sub || null },
    });
    res.json(out);
  } catch (error) {
    console.error('Error al archivar herramienta:', error);
    res.status(500).json({ error: 'Error al archivar la herramienta' });
  }
};

export const subirCertificadoCalibracion = (req, res) =>
  subirArchivoGenerico({
    req,
    res,
    modeloPrisma: prisma.herramienta,
    campoArchivo: 'certificadoCalibracion', // relación y field de multer
    nombreRecurso: 'Herramienta',
    borrarAnterior: true,
    prefix: 'herramienta',
  });

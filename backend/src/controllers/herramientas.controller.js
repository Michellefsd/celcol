import prisma from '../lib/prisma.js';
import { subirArchivoGenerico } from '../utils/archivoupload.js';



// LISTAR TODAS
export const listarHerramientas = async (req, res) => {
  try {
    const { q, orderBy = 'nombre', orderDir = 'asc' } = req.query;

    const herramientas = await prisma.herramienta.findMany({
      where: {
        archivado: false,
        ...(q
          ? {
              OR: [
                { numeroParte: { contains: String(q), mode: 'insensitive' } },
                { nombre: { contains: String(q), mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { [orderBy]: orderDir === 'desc' ? 'desc' : 'asc' },
    });

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const herramientasConUrl = herramientas.map((h) => ({
      ...h, // <- incluye numeroParte
      certificadoCalibracion: h.certificadoCalibracion
        ? `${baseUrl}/${h.certificadoCalibracion.replace(/\\/g, '/')}`
        : null,
    }));

    return res.json(herramientasConUrl);
  } catch (error) {
    console.error('Error al listar herramientas:', error);
    return res.status(500).json({ error: 'Error al obtener las herramientas' });
  }
};


// OBTENER POR ID — admite ?includeArchived=1 y devuelve relación Archivo (storageKey)
export const obtenerHerramienta = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const includeArchived =
      req.query.includeArchived === '1' || req.query.includeArchived === 'true';

    const where = includeArchived ? { id } : { id, archivado: false };

    const herramienta = await prisma.herramienta.findFirst({
      where,
      include: {
        certificadoCalibracion: {
          select: {
            id: true,
            storageKey: true,
            mime: true,
            originalName: true,
            sizeAlmacen: true,
          },
        },
      },
    });

    if (!herramienta) {
      return res.status(404).json({ error: 'Herramienta no encontrada' });
    }

    // numeroParte viene incluido por defecto en herramienta
    return res.json(herramienta);
  } catch (error) {
    console.error('Error al obtener herramienta:', error);
    return res.status(500).json({ error: 'Error al obtener la herramienta' });
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
      numeroParte, // <- NUEVO
    } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'El campo "nombre" es obligatorio' });
    }

    // Normalización de numeroParte: string → trim; vacío → null
    let numeroParteNorm = null;
    if (typeof numeroParte === 'string') {
      const trimmed = numeroParte.trim();
      if (trimmed.length > 0) numeroParteNorm = trimmed;
    }

    const data = {
      nombre,
      tipo: tipo || null,
      marca: marca || null,
      modelo: modelo || null,
      numeroSerie: numeroSerie || null,
      numeroParte: numeroParteNorm || null, // <- NUEVO (opcional)
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
    // Manejo específico de UNIQUE (P2002) en numeroParte
    if (error?.code === 'P2002') {
      // Posibles targets: ["Herramienta_numeroParte_key"] o ["numeroParte"]
      const target = Array.isArray(error?.meta?.target) ? error.meta.target.join(',') : String(error?.meta?.target || '');
      if (target.includes('numeroParte')) {
        return res.status(409).json({ error: 'El "numeroParte" ya existe en otra herramienta' });
      }
    }
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
      numeroParte, // <- NUEVO
    } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'El campo "nombre" es obligatorio' });
    }

    // Normalización numeroParte: trim; '' o espacios -> null
    let numeroParteNorm = null;
    if (typeof numeroParte === 'string') {
      const trimmed = numeroParte.trim();
      if (trimmed.length > 0) numeroParteNorm = trimmed;
    } else if (numeroParte === null) {
      numeroParteNorm = null;
    }
    // Si numeroParte viene undefined, no tocamos el campo

    // Solo campos válidos del modelo
    const data = {
      nombre,
      tipo: tipo || null,
      marca: marca || null,
      modelo: modelo || null,
      numeroSerie: numeroSerie || null,
    };

    // Incluir numeroParte solo si vino en el body
    if (numeroParte !== undefined) {
      data.numeroParte = numeroParteNorm; // puede ser string o null
    }

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

    return res.json(herramienta);
  } catch (error) {
    // No encontrado
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Herramienta no encontrada' });
    }
    // Único violado
    if (error?.code === 'P2002') {
      const target = Array.isArray(error?.meta?.target) ? error.meta.target.join(',') : String(error?.meta?.target || '');
      if (target.includes('numeroParte')) {
        return res.status(409).json({ error: 'El "numeroParte" ya existe en otra herramienta' });
      }
    }
    console.error('Error al actualizar herramienta:', error);
    return res.status(500).json({ error: 'Error al actualizar la herramienta' });
  }
};



// ARCHIVAR HERRAMIENTA (bloquea si está en OT abierta)
export const archivarHerramienta = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const existe = await prisma.herramienta.findUnique({ where: { id }, select: { id: true } });
    if (!existe) return res.status(404).json({ error: 'Herramienta no encontrada' });

    // Buscar una OT ABIERTA concreta para el mensaje
    const ot = await prisma.ordenHerramienta.findFirst({
      where: { herramientaId: id, orden: { is: { estadoOrden: 'ABIERTA' } } },
      select: { ordenId: true },
    });
    if (ot) {
      return res.status(409).json({
        error: `No se puede archivar: la herramienta está usada en una OT ABIERTA (OT ${ot.ordenId}).`,
      });
    }

    const out = await prisma.herramienta.update({
      where: { id },
      data: { archivado: true },
    });
    return res.json({ mensaje: 'Herramienta archivada correctamente', herramienta: out });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Herramienta no encontrada' });
    console.error('Error al archivar herramienta:', error);
    return res.status(500).json({ error: 'Error al archivar la herramienta' });
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

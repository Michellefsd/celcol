// ESM controller — backend/src/controllers/avion.controller.js
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import { archivoStorage } from '../services/archivo.service.js';
import { subirArchivoGenerico } from '../utils/archivoupload.js';
import { crearAvisoPorAvionSinPropietario } from '../utils/avisos.js';

const prisma = new PrismaClient();


// CREATE
export const crearAvion = async (req, res) => {
  try {
    const { marca, modelo, numeroSerie, matricula, TSN, vencimientoMatricula, vencimientoSeguro } = req.body;

    if (!marca || !modelo || !matricula) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const matriculaNorm = String(matricula).trim().toUpperCase();

    const data = {
      marca: String(marca),
      modelo: String(modelo),
      numeroSerie: numeroSerie ?? null,
      matricula: matriculaNorm,
      TSN: TSN != null && TSN !== '' ? Number(TSN) : null,
      vencimientoMatricula: vencimientoMatricula ? new Date(vencimientoMatricula) : null,
      vencimientoSeguro: vencimientoSeguro ? new Date(vencimientoSeguro) : null,
      // 👇 NO tocar certificadoMatriculaId acá (se adjunta en otra ruta)
    };

    const avion = await prisma.avion.create({
      data,
      include: {
        propietarios: { include: { propietario: true } },
        certificadoMatricula: true, // vendrá null al crear
      },
    });

    return res.status(201).json(avion);
  } catch (error) {
    console.error('Error al crear avión:', error);
    return res.status(500).json({ error: 'Error al crear el avión' });
  }
};

// READ ALL
export const listarAviones = async (req, res) => {
  try {
const aviones = await prisma.avion.findMany({
  where: { archivado: false },
  include: {
    propietarios: {
      include: { propietario: true }
    }
  }
});

    res.json(aviones);
  } catch (error) {
    console.error('Error al listar aviones:', error);
    res.status(500).json({ error: 'Error al obtener aviones' });
  }
};

// READ ONE — GET BY ID con includeArchived y normalización de URLs de archivo
export const obtenerAvion = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    // acepta ?includeArchived=1 o =true
    const includeArchived =
      req.query.includeArchived === '1' || req.query.includeArchived === 'true';

    // si NO piden archivados, filtramos por archivado:false
    const where = includeArchived ? { id } : { id, archivado: false };

    const avion = await prisma.avion.findFirst({
      where,
      include: {
        propietarios: { include: { propietario: true } },
        ComponenteAvion: true, // si en tu schema es 'componenteAvion', ajustá el nombre
      },
    });

    if (!avion) {
      return res.status(404).json({ error: 'Avión no encontrado' });
    }

    // Helper para URLs absolutas de archivos
    const toAbs = (p) => {
      if (!p || typeof p !== 'string') return p;
      if (/^https?:\/\//i.test(p)) return p;
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const normalized = p.replace(/\\/g, '/').replace(/^\/+/, '');
      return `${baseUrl}/${normalized}`;
    };

    // Normalizá acá los campos de archivo que uses en Avión
    // (agregá/quitalos según tu schema real)
    const avionTransformado = {
      ...avion,
      componentes: avion.ComponenteAvion,
      // ejemplo de campos de archivo (ajustá a tus nombres reales):
      certificadoMatricula: toAbs(avion.certificadoMatricula),
      certificadoMatriculaArchivo: toAbs(avion.certificadoMatriculaArchivo),
    };
    delete avionTransformado.ComponenteAvion;

    res.json(avionTransformado);
  } catch (error) {
    console.error('Error al obtener avión:', error);
    res.status(500).json({ error: 'Error al obtener el avión' });
  }
};

export const actualizarAvion = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const avionActual = await prisma.avion.findUnique({ where: { id } });

    // 1) Verificar existencia y estado (primero existencia)
    if (!avionActual) {
      return res.status(404).json({ error: 'Avión no encontrado' });
    }
    if (avionActual.archivado) {
      return res.status(400).json({ error: 'No se puede modificar un avión archivado' });
    }

    const {
      marca,
      modelo,
      numeroSerie,
      matricula,
      TSN,
      vencimientoMatricula,
      vencimientoSeguro,
      propietariosIds
    } = req.body;

    // 2) Archivos (vía multer en este paso; adaptador vendrá luego)
    const archivos = req.files || {};
    const nuevoCertificado = archivos.certificadoMatricula?.[0]?.path;

    // 3) Datos a actualizar
    const dataToUpdate = {
      marca,
      modelo,
      numeroSerie: numeroSerie || null,
      matricula,
      TSN: TSN ? parseFloat(TSN) : null,
      vencimientoMatricula: vencimientoMatricula ? new Date(vencimientoMatricula) : null,
      vencimientoSeguro: vencimientoSeguro ? new Date(vencimientoSeguro) : null,
    };

    // 4) Reemplazo de archivo local (temporal, hasta adaptador)
    if (nuevoCertificado) {
      if (avionActual.certificadoMatricula && fs.existsSync(avionActual.certificadoMatricula)) {
        fs.unlinkSync(avionActual.certificadoMatricula);
      }
      dataToUpdate.certificadoMatricula = nuevoCertificado;
    }

    await prisma.avion.update({
      where: { id },
      data: dataToUpdate
    });

    // 5) Relacionar propietarios si vienen ids
    if (Array.isArray(propietariosIds)) {
      const propietarios = await prisma.propietario.findMany({
        where: { id: { in: propietariosIds } }
      });

      if (propietarios.length !== propietariosIds.length) {
        return res.status(400).json({ error: 'Algunos propietarios no existen' });
      }

      await prisma.avionPropietario.deleteMany({ where: { avionId: id } });

      const relaciones = propietariosIds.map(propietarioId => ({
        avionId: id,
        propietarioId
      }));

      await prisma.avionPropietario.createMany({ data: relaciones });
    }

    // 6) Aviso por avión sin propietario
    const avionConPropietarios = await prisma.avion.findUnique({
      where: { id },
      include: { propietarios: true },
    });
    await crearAvisoPorAvionSinPropietario(avionConPropietarios, prisma);

    return res.json({ mensaje: 'Avión actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar avión:', error);
    return res.status(500).json({ error: 'Error al actualizar el avión' });
  }
};

// ARCHIVAR AVIÓN (validación de OTs abiertas)
export const archivarAvion = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const avion = await prisma.avion.findUnique({ where: { id } });

    if (!avion) {
      return res.status(404).json({ error: 'Avión no encontrado' });
    }

    if (avion.archivado) {
      return res.status(400).json({ error: 'El avión ya está archivado.' });
    }

    // Verificar si está en una OT abierta
    const ordenAbierta = await prisma.ordenTrabajo.findFirst({
      where: {
        avionId: id,
        estadoOrden: 'ABIERTA',
      },
    });

    if (ordenAbierta) {
      return res.status(400).json({
        error: `No se puede archivar: el avión está en uso en la orden de trabajo ID ${ordenAbierta.id}.`,
      });
    }

    await prisma.avion.update({
      where: { id },
      data: { archivado: true },
    });

    res.json({ mensaje: 'Avión archivado correctamente.' });
  } catch (error) {
    console.error('Error al archivar avión:', error);
    res.status(500).json({ error: 'Error al archivar el avión' });
  }
};

// ASIGNAR PROPIETARIOS
export const asignarPropietarios = async (req, res) => {
  const avionId = parseInt(req.params.id);
  const { propietariosIds } = req.body;

  if (!Array.isArray(propietariosIds) || propietariosIds.length === 0) {
    return res.status(400).json({ error: 'Debe asignar al menos un propietario' });
  }

  try {
    const avion = await prisma.avion.findUnique({ where: { id: avionId } });
    if (!avion) return res.status(404).json({ error: 'Avión no encontrado' });

    const propietarios = await prisma.propietario.findMany({
      where: { id: { in: propietariosIds } }
    });

    if (propietarios.length !== propietariosIds.length) {
      return res.status(400).json({ error: 'Algunos propietarios no existen' });
    }

    await prisma.avionPropietario.deleteMany({ where: { avionId } });

    const relaciones = propietariosIds.map(propietarioId => ({
      avionId,
      propietarioId
    }));

    await prisma.avionPropietario.createMany({ data: relaciones });

const avionConPropietarios = await prisma.avion.findUnique({
  where: { id: avionId },
  include: { propietarios: true },
});

await crearAvisoPorAvionSinPropietario(avionConPropietarios, prisma);


    res.json({ mensaje: 'Propietarios asignados correctamente' });
  } catch (error) {
    console.error('Error al asignar propietarios:', error);
    res.status(500).json({ error: 'Error al asignar propietarios' });
  }
};

export const subirCertificadoMatricula = (req, res) =>
  subirArchivoGenerico({
    req,
    res,
    modeloPrisma: prisma.avion,
    campoArchivo: 'certificadoMatricula', // nombre de la RELACIÓN y del field de multer
    nombreRecurso: 'Avion',
    campoParam: 'id',          // /aviones/:id/certificadoMatricula
    borrarAnterior: true,      // reemplaza si ya había uno
    prefix: 'avion',           // prefijo para la key en el storage
  });
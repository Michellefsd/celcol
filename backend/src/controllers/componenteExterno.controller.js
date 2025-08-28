// src/controllers/componenteExterno.controller.js

import fs from 'node:fs/promises';
import prisma from '../prisma.js';
import crypto from 'node:crypto';
import { archivoStorage } from '../services/archivo.service.js';
import { subirArchivoGenerico } from '../utils/archivoupload.js';


// LISTAR (relación anidada: filtra por propietario.id)
export const listarComponentesExternos = async (req, res) => {
  try {
    const { propietarioId, includeArchived } = req.query;

    const where = {
      ...(includeArchived === 'true' || includeArchived === '1' ? {} : { archivado: false }),
      ...(propietarioId ? { propietario: { id: Number(propietarioId) } } : {}),
    };

    const componentes = await prisma.componenteExterno.findMany({
      where,
      orderBy: { id: 'desc' },
      include: {
        propietario: true,
        archivo8130: {
          select: {
            id: true,
            storageKey: true,
            originalName: true,
            mime: true,
            sizeAlmacen: true,
          },
        },
      },
    });

    res.json(componentes);
  } catch (error) {
    console.error('Error al listar componentes externos:', error);
    res.status(500).json({ error: 'Error al obtener los componentes externos' });
  }
};



const sanitize = (name) =>
  (name || 'archivo')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9.\-_]/g, '');

const getBuffer = async (file) =>
  file?.buffer ?? (file?.path ? await fs.readFile(file.path) : null);

// CREAR (sube 8130 directo si viene en el form)
export const crearComponenteExterno = async (req, res) => {
  try {
    const {
      tipo, marca, modelo, numeroSerie, numeroParte,
      TSN, TSO, TBOFecha, TBOHoras, propietarioId,
    } = req.body;

    if (!marca || !modelo || !numeroSerie || !propietarioId) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // admite .single() o .fields()
    const file = req.file || req?.files?.archivo8130?.[0];
    let archivo8130Id;

    if (file) {
      const buffer = await getBuffer(file);
      if (!buffer) {
        return res.status(400).json({ error: 'No se pudo leer el archivo 8130' });
      }

      const safeName = sanitize(file.originalname || '8130.pdf');

      // Sube a R2 (sin ID aquí; si querés incluir ID, usá endpoint dedicado post-crear)
      const put = await archivoStorage.put({
        buffer,
        contentType: file.mimetype,
        originalName: safeName,
        keyHint: `componente-externo/8130`,
      });

      const hashSha256 = crypto.createHash('sha256').update(buffer).digest('hex');

      const creado = await prisma.archivo.create({
        data: {
          storageKey: put.key,
          urlPublica: put?.url ?? null,
          originalName: safeName,
          mime: file.mimetype ?? null,
          sizeOriginal: buffer.length ?? null,
          sizeAlmacen: put?.size ?? buffer.length ?? null,
          hashSha256, // ← requerido por tu schema
        },
        select: { id: true },
      });

      archivo8130Id = creado.id;
    }

    const componente = await prisma.componenteExterno.create({
      data: {
        tipo: tipo || null,
        marca,
        modelo,
        numeroSerie,
        numeroParte: numeroParte || null,
        TSN: TSN !== undefined && TSN !== null && TSN !== '' ? parseFloat(TSN) : null,
        TSO: TSO !== undefined && TSO !== null && TSO !== '' ? parseFloat(TSO) : null,
        TBOFecha: TBOFecha ? new Date(TBOFecha) : null,
        TBOHoras: TBOHoras !== undefined && TBOHoras !== null && TBOHoras !== '' ? parseInt(TBOHoras, 10) : null,
        propietarioId: parseInt(propietarioId, 10),
        ...(archivo8130Id ? { archivo8130Id } : {}),
      },
      include: {
        propietario: true,
        archivo8130: {
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

    return res.status(201).json(componente);
  } catch (error) {
    console.error('Error al crear componente externo:', error);
    return res.status(500).json({ error: 'Error al crear el componente externo' });
  }
};


// OBTENER POR ID — incluye relación Archivo (para pedir URL firmada en el front)
export const obtenerComponenteExterno = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });

    const includeArchived =
      req.query.includeArchived === '1' || req.query.includeArchived === 'true';

    const componente = await prisma.componenteExterno.findUnique({
      where: { id },
      include: {
        propietario: true,
        archivo8130: {
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

    if (!componente) return res.status(404).json({ error: 'Componente externo no encontrado' });
    if (!includeArchived && componente.archivado) {
      return res.status(404).json({ error: 'Componente externo no encontrado' });
    }

    // devolvemos tal cual (relación Archivo incluida); el front pedirá /archivos/url-firmada?key=...
    return res.json(componente);
  } catch (error) {
    console.error('Error al obtener componente externo:', error);
    return res.status(500).json({ error: 'Error al obtener el componente externo' });
  }
};


// ACTUALIZAR (permite reemplazar 8130 aquí también)
export const actualizarComponenteExterno = async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const componenteActual = await prisma.componenteExterno.findUnique({
      where: { id },
      include: { archivo8130: true },
    });

    if (!componenteActual) {
      return res.status(404).json({ error: 'Componente externo no encontrado' });
    }
    if (componenteActual.archivado) {
      return res.status(400).json({ error: 'No se puede modificar un componente archivado' });
    }

    const {
      tipo, marca, modelo, numeroSerie, numeroParte,
      TSN, TSO, TBOFecha, TBOHoras, propietarioId,
    } = req.body;

    // Helpers para no pisar campos cuando vienen undefined
    const toFloatPatch = (v) =>
      v === undefined ? undefined : (v === '' ? null : parseFloat(v));
    const toIntPatch = (v) =>
      v === undefined ? undefined : (v === '' ? null : parseInt(v, 10));
    const toDatePatch = (v) =>
      v === undefined ? undefined : (v ? new Date(v) : null);

    const data = {
      tipo: tipo ?? undefined,
      marca: marca ?? undefined,
      modelo: modelo ?? undefined,
      numeroSerie: numeroSerie ?? undefined,
      numeroParte: numeroParte === undefined ? undefined : (numeroParte || null),
      TSN: toFloatPatch(TSN),
      TSO: toFloatPatch(TSO),
      TBOFecha: toDatePatch(TBOFecha),
      TBOHoras: toIntPatch(TBOHoras),
      propietarioId: propietarioId === undefined ? undefined : Number(propietarioId),
    };

    // ¿permitimos reemplazar el 8130 en este endpoint?
    const file = req.file || req?.files?.archivo8130?.[0];
    if (file) {
      const buffer = file.buffer || (file.path ? await fs.readFile(file.path) : null);
      if (!buffer) return res.status(400).json({ error: 'No se pudo leer el archivo 8130' });

      const safeName = (file.originalname || '8130.pdf')
        .trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.\-_]/g, '');

      // Key con ID y subcarpeta de campo
      const put = await archivoStorage.put({
        buffer,
        contentType: file.mimetype,
        originalName: safeName,
        keyHint: `componente-externo/${id}/archivo8130`,
      });

      const hashSha256 = crypto.createHash('sha256').update(buffer).digest('hex');

      const nuevoArch = await prisma.archivo.create({
        data: {
          storageKey: put.key,
          urlPublica: put?.url ?? null,
          originalName: safeName,
          mime: file.mimetype ?? null,
          sizeOriginal: buffer.length ?? null,
          sizeAlmacen: put?.size ?? buffer.length ?? null,
          hashSha256,
        },
        select: { id: true },
      });

      // limpiar anterior si existía
      if (componenteActual.archivo8130?.storageKey) {
        await archivoStorage.remove(componenteActual.archivo8130.storageKey).catch(() => {});
      }
      if (componenteActual.archivo8130Id) {
        await prisma.archivo.delete({ where: { id: componenteActual.archivo8130Id } }).catch(() => {});
      }

      data.archivo8130Id = nuevoArch.id;
    }

    const actualizado = await prisma.componenteExterno.update({
      where: { id },
      data,
      include: {
        archivo8130: {
          select: { id: true, storageKey: true, originalName: true, mime: true, sizeAlmacen: true },
        },
        propietario: true,
      },
    });

    return res.json(actualizado);
  } catch (error) {
    console.error('Error al actualizar componente externo:', error);
    return res.status(500).json({ error: 'Error al actualizar el componente externo' });
  }
};


// SUBIR ARCHIVO 8130 (también disponible como endpoint dedicado)
export const subirArchivo8130 = (req, res) =>
  subirArchivoGenerico({
    req,
    res,
    modeloPrisma: prisma.componenteExterno,
    campoArchivo: 'archivo8130',   
    nombreRecurso: 'Componente externo',
    campoParam: 'id',             
    borrarAnterior: true,
    prefix: 'componente-externo',
  });
 
  

// PATCH /componentes/archivar/:id
export const archivarComponenteExterno = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const componente = await prisma.componenteExterno.findUnique({
      where: { id },
      select: { id: true, archivado: true },
    });
    if (!componente) return res.status(404).json({ error: 'Componente externo no encontrado' });
    if (componente.archivado) return res.status(409).json({ error: 'El componente externo ya está archivado.' });

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

    return res.json({ mensaje: 'Componente externo archivado correctamente.', id: actualizado.id });
  } catch (error) {
    console.error('Error al archivar componente externo:', error);
    return res.status(500).json({ error: 'Error al archivar el componente externo' });
  }
};

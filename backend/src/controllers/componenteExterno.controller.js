// src/controllers/componenteExterno.controller.js
import fs from 'node:fs/promises';
import { prisma } from '../prisma.js';
import { archivoStorage } from '../services/archivo.service.js'; // put({buffer, contentType, originalName, keyHint}), remove(key)

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

    // 1) si viene archivo 8130 en el form, subimos y creamos Archivo
    const file = req.file || req?.files?.archivo8130?.[0]; // soporta single/fields
    let archivo8130Id = undefined;

    if (file) {
      const buffer = file.buffer || await fs.readFile(file.path);
      const safeName = (file.originalname || '8130.pdf').replace(/\s+/g, '-');
      const put = await archivoStorage.put({
        buffer,
        contentType: file.mimetype,
        originalName: safeName,
        keyHint: `componente-externo/8130/${Date.now()}-${safeName}`,
      });

      const creado = await prisma.archivo.create({
        data: { key: put.key, url: put.url, mimeType: file.mimetype, size: buffer.length },
        select: { id: true },
      });
      archivo8130Id = creado.id;
    }

    // 2) crear el componente con la FK si existe
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
        TBOHoras: TBOHoras ? parseInt(TBOHoras, 10) : null,
        propietarioId: parseInt(propietarioId, 10),
        ...(archivo8130Id ? { archivo8130Id } : {}),
      },
      include: { archivo8130: true, propietario: true },
    });

    return res.status(201).json(componente);
  } catch (error) {
    console.error('Error al crear componente externo:', error);
    return res.status(500).json({ error: 'Error al crear el componente externo' });
  }
};

// OBTENER POR ID — devuelve URL desde la relación
export const obtenerComponenteExterno = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });

    const includeArchived = req.query.includeArchived === '1' || req.query.includeArchived === 'true';

    const componente = await prisma.componenteExterno.findUnique({
      where: { id },
      include: {
        propietario: true,
        archivo8130: true,       // para tomar .url
        certificado8130: true,   // si tienes esta relación en el schema
      },
    });

    if (!componente) return res.status(404).json({ error: 'Componente externo no encontrado' });
    if (!includeArchived && componente.archivado) {
      return res.status(404).json({ error: 'Componente externo no encontrado' });
    }

    // exponer como strings para no romper front
    const out = {
      ...componente,
      archivo8130: componente.archivo8130?.url ?? null,
      certificado8130: componente.certificado8130?.url ?? null,
    };

    return res.json(out);
  } catch (error) {
    console.error('Error al obtener componente externo:', error);
    return res.status(500).json({ error: 'Error al obtener el componente externo' });
  }
};

// ACTUALIZAR (sin tocar archivo salvo que quieras permitir reemplazo aquí también)
export const actualizarComponenteExterno = async (req, res) => {
  const id = Number(req.params.id);

  try {
    const componenteActual = await prisma.componenteExterno.findUnique({
      where: { id },
      include: { archivo8130: true },
    });

    if (!componenteActual) return res.status(404).json({ error: 'Componente externo no encontrado' });
    if (componenteActual.archivado) {
      return res.status(400).json({ error: 'No se puede modificar un componente archivado' });
    }

    const {
      tipo, marca, modelo, numeroSerie, numeroParte,
      TSN, TSO, TBOFecha, TBOHoras, propietarioId,
    } = req.body;

    const data = {
      tipo: tipo ?? undefined,
      marca: marca ?? undefined,
      modelo: modelo ?? undefined,
      numeroSerie: numeroSerie ?? undefined,
      numeroParte: numeroParte ?? null,
      TSN: TSN ? parseFloat(TSN) : null,
      TSO: TSO ? parseFloat(TSO) : null,
      TBOFecha: TBOFecha ? new Date(TBOFecha) : null,
      TBOHoras: TBOHoras ? parseInt(TBOHoras, 10) : null,
      propietarioId: propietarioId ? Number(propietarioId) : undefined,
    };

    // ¿permitimos reemplazar el 8130 en este endpoint?
    const file = req.file || req?.files?.archivo8130?.[0];
    if (file) {
      const buffer = file.buffer || await fs.readFile(file.path);
      const safeName = (file.originalname || '8130.pdf').replace(/\s+/g, '-');

      const put = await archivoStorage.put({
        buffer,
        contentType: file.mimetype,
        originalName: safeName,
        keyHint: `componente-externo/8130/${Date.now()}-${safeName}`,
      });

      const nuevoArch = await prisma.archivo.create({
        data: { key: put.key, url: put.url, mimeType: file.mimetype, size: buffer.length },
        select: { id: true },
      });

      // limpiar anterior si existía
      if (componenteActual.archivo8130?.key) {
        await archivoStorage.remove(componenteActual.archivo8130.key).catch(() => {});
        await prisma.archivo.delete({ where: { id: componenteActual.archivo8130Id } }).catch(() => {});
      }

      data.archivo8130Id = nuevoArch.id;
    }

    const actualizado = await prisma.componenteExterno.update({
      where: { id },
      data,
      include: { archivo8130: true },
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
    campoArchivo: 'archivo8130',    // relación y name de multer
    nombreRecurso: 'Componente externo',
    campoParam: 'id',               // si tu ruta es /componentes-externos/:id/8130
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

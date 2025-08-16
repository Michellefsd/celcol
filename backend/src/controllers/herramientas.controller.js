const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');
const { subirArchivoGenerico } = require('../utils/archivoupload');


// LISTAR TODAS
exports.listarHerramientas = async (req, res) => {
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

// OBTENER POR ID
exports.obtenerHerramienta = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const herramienta = await prisma.herramienta.findUnique({ where: { id } });

    if (!herramienta) {
      return res.status(404).json({ error: 'Herramienta no encontrada' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const certificadoCalibracion = herramienta.certificadoCalibracion
      ? `${baseUrl}/${herramienta.certificadoCalibracion.replace(/\\/g, '/')}`
      : null;

    res.json({ ...herramienta, certificadoCalibracion });
  } catch (error) {
    console.error('Error al obtener herramienta:', error);
    res.status(500).json({ error: 'Error al obtener la herramienta' });
  }
};


// CREAR HERRAMIENTA
exports.crearHerramienta = async (req, res) => {
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

    const archivos = req.files || {};

    const nuevaHerramienta = await prisma.herramienta.create({
      data: {
        nombre,
        tipo: tipo || null,
        marca: marca || null,
        modelo: modelo || null,
        numeroSerie: numeroSerie || null,
        fechaIngreso: fechaIngreso ? new Date(fechaIngreso) : null,
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
        certificadoCalibracion: archivos.certificadoCalibracion?.[0]?.path || null,
      },
    });

    res.status(201).json(nuevaHerramienta);
  } catch (error) {
    console.error('Error al crear herramienta:', error);
    res.status(500).json({ error: 'Error al crear la herramienta' });
  }
};

// ACTUALIZAR HERRAMIENTA
exports.actualizarHerramienta = async (req, res) => {
  const { id } = req.params;

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

    const archivos = req.files || {};

    const herramientaActual = await prisma.herramienta.findUnique({
      where: { id: parseInt(id) }
    });

    if (!herramientaActual) {
      return res.status(404).json({ error: 'Herramienta no encontrada' });
    }

    const nuevoCertificado = archivos.certificadoCalibracion?.[0]?.path;

    if (nuevoCertificado && herramientaActual.certificadoCalibracion && fs.existsSync(herramientaActual.certificadoCalibracion)) {
      fs.unlinkSync(herramientaActual.certificadoCalibracion);
    }

    const herramienta = await prisma.herramienta.update({
      where: { id: parseInt(id) },
      data: {
        nombre,
        tipo: tipo || null,
        marca: marca || null,
        modelo: modelo || null,
        numeroSerie: numeroSerie || null,
        fechaIngreso: fechaIngreso ? new Date(fechaIngreso) : null,
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
        certificadoCalibracion: nuevoCertificado || herramientaActual.certificadoCalibracion,
      },
    });

    res.json(herramienta);
  } catch (error) {
    console.error('Error al actualizar herramienta:', error);
    res.status(500).json({ error: 'Error al actualizar la herramienta' });
  }
};

// ELIMINAR (soft-delete → archivado)
{/*exports.eliminarHerramienta = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.herramienta.update({
      where: { id: parseInt(id) },
      data: { archivado: true },
    });
    res.json({ mensaje: 'Herramienta archivada correctamente' });
  } catch (error) {
    console.error('Error al archivar herramienta:', error);
    res.status(500).json({ error: 'Error al archivar la herramienta' });
  }
};
*/}

// ARCHIVAR HERRAMIENTA (sin validación, permitido aunque esté en uso)
exports.archivarHerramienta = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.herramienta.update({
      where: { id: parseInt(id) },
      data: { archivado: true },
    });
    res.json({ mensaje: 'Herramienta archivada correctamente' });
  } catch (error) {
    console.error('Error al archivar herramienta:', error);
    res.status(500).json({ error: 'Error al archivar la herramienta' });
  }
};


// SUBIR CERTIFICADO DE CALIBRACIÓN (endpoint separado usando lógica genérica)
exports.subirCertificadoCalibracion = (req, res) =>
  subirArchivoGenerico({
    req,
    res,
    modeloPrisma: prisma.herramienta,
    campoArchivo: 'certificadoCalibracion',
    nombreRecurso: 'Herramienta',
  });

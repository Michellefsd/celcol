const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const { subirArchivoGenerico } = require('../utils/archivoupload'); // al inicio del archivo


// CREATE
exports.crearPersonal = async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      email,
      telefono,
      esCertificador,
      esTecnico,
      direccion,
      tipoLicencia,
      numeroLicencia,
      vencimientoLicencia,
      fechaAlta,
      horasTrabajadas
    } = req.body;

    const archivos = req.files || {};

    const nuevo = await prisma.empleado.create({
      data: {
        nombre,
        apellido,
        email,
        telefono,
        esCertificador: esCertificador || false,
        esTecnico: esTecnico || false,
        direccion,
        tipoLicencia,
        numeroLicencia,
        vencimientoLicencia: vencimientoLicencia ? new Date(vencimientoLicencia) : null,
        fechaAlta: fechaAlta ? new Date(fechaAlta) : null,
        carneSalud: archivos.carneSalud?.[0]?.path || null,
        horasTrabajadas: horasTrabajadas ? parseFloat(horasTrabajadas) : 0
      }
    });

    res.status(201).json(nuevo);
  } catch (error) {
    console.error('Error al crear personal:', error);
    res.status(500).json({ error: 'Error al crear el personal' });
  }
};

// READ ALL
exports.listarPersonal = async (req, res) => {
  try {
    const personal = await prisma.empleado.findMany();
    res.json(personal);
  } catch (error) {
    console.error('Error al listar personal:', error);
    res.status(500).json({ error: 'Error al obtener personal' });
  }
};

// READ ONE
// GET BY ID con URL completa de carneSalud
exports.obtenerPersonal= async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const empleado = await prisma.empleado.findUnique({ where: { id } });
    if (!empleado) return res.status(404).json({ error: 'Empleado no encontrado' });

    // Construir URL absoluta del carneSalud
    if (empleado.carneSalud) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      empleado.carneSalud = `${baseUrl}/${empleado.carneSalud.replace(/\\/g, '/')}`;
    }

    res.json(empleado);
  } catch (error) {
    console.error('Error al obtener empleado:', error);
    res.status(500).json({ error: 'Error al obtener el empleado' });
  }
};

// UPDATE
exports.actualizarPersonal = async (req, res) => {
  const id = parseInt(req.params.id);
  const archivos = req.files || {};

  try {
    const persona = await prisma.empleado.findUnique({ where: { id } });
    if (!persona) return res.status(404).json({ error: 'Personal no encontrado' });

    const carneNuevo = archivos.carneSalud?.[0]?.path;

    if (carneNuevo && persona.carneSalud && fs.existsSync(persona.carneSalud)) {
      fs.unlinkSync(persona.carneSalud); // borra el anterior
    }

    const data = {
      ...req.body,
      vencimientoLicencia: req.body.vencimientoLicencia ? new Date(req.body.vencimientoLicencia) : null,
      fechaAlta: req.body.fechaAlta ? new Date(req.body.fechaAlta) : null,
      horasTrabajadas: req.body.horasTrabajadas ? parseFloat(req.body.horasTrabajadas) : 0,
    };

    if (carneNuevo) {
      data.carneSalud = carneNuevo;
    }

    const actualizado = await prisma.empleado.update({
      where: { id },
      data
    });

    res.json(actualizado);
  } catch (error) {
    console.error('Error al actualizar personal:', error);
    res.status(500).json({ error: 'Error al actualizar el personal' });
  }
};

// DELETE
exports.eliminarPersonal = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const persona = await prisma.empleado.findUnique({ where: { id } });

    // Eliminar archivo si existe
    if (persona?.carneSalud && fs.existsSync(persona.carneSalud)) {
      fs.unlinkSync(persona.carneSalud);
    }

    await prisma.empleado.delete({ where: { id } });
    res.json({ mensaje: 'Personal eliminado' });
  } catch (error) {
    console.error('Error al eliminar personal:', error);
    res.status(500).json({ error: 'Error al eliminar el personal' });
  }
};



exports.subirCarneSalud = (req, res) =>
  subirArchivoGenerico({
    req,
    res,
    modeloPrisma: prisma.empleado,
    campoArchivo: 'carneSalud',
    nombreRecurso: 'Personal',
  });






// ✅ Exportar correctamente
module.exports = exports;

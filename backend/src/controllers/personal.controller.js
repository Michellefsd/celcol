const { subirArchivoGenerico } = require('../utils/archivoupload'); // al inicio del archivo
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
    const personal = await prisma.empleado.findMany({
      where: { archivado: false }
    });
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

  const persona = await prisma.empleado.findUnique({ where: { id } });
if (!persona || persona.archivado) {
  return res.status(400).json({ error: 'No se puede modificar personal archivado o inexistente' });
}


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
{/*exports.eliminarPersonal = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.empleado.update({
      where: { id },
      data: { archivado: true },
    });

    res.json({ mensaje: 'Empleado archivado correctamente' });
  } catch (error) {
    console.error('Error al archivar personal:', error);
    res.status(500).json({ error: 'Error al archivar el personal' });
  }
};
*/}

// ARCHIVAR PERSONAL (sin validación)
exports.archivarPersonal = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.empleado.update({
      where: { id },
      data: { archivado: true },
    });

    res.json({ mensaje: 'Empleado archivado correctamente' });
  } catch (error) {
    console.error('Error al archivar personal:', error);
    res.status(500).json({ error: 'Error al archivar el personal' });
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


  // GET /personal/:id/registros-trabajo?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
exports.descargarHorasEmpleado = async (req, res) => {
  const id = parseInt(req.params.id);
  const { desde, hasta } = req.query;

  try {
    const empleado = await prisma.empleado.findUnique({ where: { id } });
    if (!empleado) return res.status(404).json({ error: 'Empleado no encontrado' });

    const registros = await prisma.registroDeTrabajo.findMany({
      where: {
        empleadoId: id,
        fecha: {
          gte: new Date(desde),
          lte: new Date(hasta),
        },
      },
      include: {
        orden: { select: { id: true } },
      },
      orderBy: { fecha: 'asc' },
    });

    const roles = await prisma.empleadoAsignado.findMany({
      where: {
        empleadoId: id,
        ordenId: { in: registros.map(r => r.orden.id) },
      },
      select: {
        ordenId: true,
        rol: true,
      },
    });

    const mapaRoles = new Map(roles.map(r => [r.ordenId, r.rol]));

    const registrosConRol = registros.map(r => ({
      fecha: r.fecha,
      horas: r.horas,
      ordenId: r.orden.id,
      rol: mapaRoles.get(r.orden.id) ?? 'NO_ESPECIFICADO',
    }));

    const PDFDocument = require('pdfkit');
    const path = require('path');
    const fs = require('fs');
    const doc = new PDFDocument();

    const filename = `horas-empleado-${id}.pdf`;

    // === HEADERS ===
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    doc.pipe(res);

    // === LOGO ===
    const logoPath = path.join(process.cwd(), 'public', 'celcol-logo.jpeg');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 30, { width: 80 });
    }

    doc.fontSize(20).text('Celcol', 140, 40);
    doc.moveDown(2);

    // === INFORMACIÓN EMPLEADO ===
    doc.fontSize(16).text('Resumen de Horas', { underline: true });
    doc.moveDown();
    doc.fontSize(14).text(`${empleado.nombre} ${empleado.apellido}`);
    doc.fontSize(12).text(`Teléfono: ${empleado.telefono ?? 'No registrado'}`);
    doc.text(`Email: ${empleado.email ?? 'No registrado'}`);
    doc.text(`Licencia: ${empleado.tipoLicencia || 'N/A'} - ${empleado.numeroLicencia || 'N/A'}`);
    doc.text(
      `Vencimiento: ${
        empleado.vencimientoLicencia
          ? new Date(empleado.vencimientoLicencia).toISOString().slice(0, 10)
          : 'No disponible'
      }`
    );
    doc.moveDown();

    // === REGISTROS ===
    doc.text(`Registros entre ${desde} y ${hasta}:`);
    doc.moveDown();
    let total = 0;

    if (registrosConRol.length === 0) {
      doc.text('⚠️ No se encontraron registros en ese período.');
    } else {
      registrosConRol.forEach(r => {
        total += r.horas;
        doc.text(`${r.fecha.toISOString().slice(0, 10)} - ${r.horas} hs - OT ${r.ordenId} (${r.rol})`);
      });

      doc.moveDown();
      doc.fontSize(13).text(`Total: ${total} horas trabajadas`);
    }

    doc.end(); // ✅ Importante: última línea activa
  } catch (error) {
    console.error('Error al generar PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error al generar el PDF' });
    }
  }
};

exports.obtenerRegistrosDeTrabajo = async (req, res) => {
  const id = parseInt(req.params.id);
  const { desde, hasta } = req.query;

  try {
    const registros = await prisma.registroDeTrabajo.findMany({
      where: {
        empleadoId: id,
        fecha: {
          gte: desde ? new Date(desde) : undefined,
          lte: hasta ? new Date(hasta) : undefined,
        },
      },
      include: {
        orden: {
          select: {
            id: true,
            estadoOrden: true,
          },
        },
      },
      orderBy: { fecha: 'asc' },
    });

    res.json(registros);
  } catch (error) {
    console.error('Error al obtener registros de trabajo:', error);
    res.status(500).json({ error: 'Error al obtener los registros de trabajo' });
  }
};


// ✅ Exportar correctamente
module.exports = exports;

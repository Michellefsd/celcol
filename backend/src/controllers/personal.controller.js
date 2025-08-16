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

  const actual = await prisma.empleado.findUnique({ where: { id } });
  if (!actual || actual.archivado) {
    return res.status(400).json({ error: 'No se puede modificar personal archivado o inexistente' });
  }

  try {
    const carneNuevo = archivos.carneSalud?.[0]?.path;

    if (carneNuevo && actual.carneSalud && fs.existsSync(actual.carneSalud)) {
      fs.unlinkSync(actual.carneSalud);
    }

    const data = {
      ...req.body,
      vencimientoLicencia: req.body.vencimientoLicencia ? new Date(req.body.vencimientoLicencia) : null,
      fechaAlta: req.body.fechaAlta ? new Date(req.body.fechaAlta) : null,
      horasTrabajadas: req.body.horasTrabajadas ? parseFloat(req.body.horasTrabajadas) : 0,
    };
    if (carneNuevo) data.carneSalud = carneNuevo;

    const actualizado = await prisma.empleado.update({ where: { id }, data });
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
    const empleado = await prisma.empleado.findUnique({
      where: { id },
      select: { nombre: true, apellido: true, email: true },
    });
    if (!empleado) return res.status(404).json({ error: 'Empleado no encontrado' });

    const where = {
      empleadoId: id,
      ...(desde || hasta
        ? {
            fecha: {
              ...(desde ? { gte: new Date(desde) } : {}),
              ...(hasta
                ? (() => {
                    const fin = new Date(hasta);
                    fin.setHours(23, 59, 59, 999);
                    return { lte: fin };
                  })()
                : {}),
            },
          }
        : {}),
    };

    const registros = await prisma.registroDeTrabajo.findMany({
      where,
      orderBy: { fecha: 'asc' },
      select: {
        id: true,
        fecha: true,
        horas: true,
        rol: true,
        trabajoRealizado: true, // 👈 ahora lo incluimos
        ordenId: true,
      },
    });

    const totalHoras = registros.reduce((acc, r) => acc + (r.horas || 0), 0);
    const fmt = d => new Date(d).toLocaleDateString('es-UY');

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const filename = `horas-empleado-${id}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    doc.pipe(res);

    // Encabezado
    try {
      const logoPath = path.join(process.cwd(), 'public', 'celcol-logo.jpeg');
      if (fs.existsSync(logoPath)) doc.image(logoPath, 40, 30, { width: 80 });
    } catch {}
    doc.fontSize(18).text('Celcol | Extracto de horas', 130, 40);
    doc.moveDown(2);

    doc.fontSize(16).text(`${empleado.nombre} ${empleado.apellido}`, { underline: true });
    doc.moveDown(0.3);
    if (empleado.email) doc.fontSize(11).fillColor('#555').text(`Email: ${empleado.email}`).fillColor('#000');
    doc.moveDown(0.6);
    doc.fontSize(12).text(`Período: ${desde ? fmt(desde) : '—'} a ${hasta ? fmt(hasta) : '—'}`);
    doc.moveDown(0.6);

    // Cabecera de tabla
    const x0 = 40;
    const y0 = doc.y + 6;
    const col = {
      fecha: x0,
      ot: x0 + 80,
      rol: x0 + 140,
      horas: x0 + 220,
      trabajo: x0 + 270,
    };

    doc.fontSize(11).fillColor('#111')
      .text('Fecha', col.fecha, y0)
      .text('OT', col.ot, y0)
      .text('Rol', col.rol, y0)
      .text('Horas', col.horas, y0)
      .text('Trabajo realizado', col.trabajo, y0);

    doc.moveTo(x0, y0 + 14).lineTo(555, y0 + 14).strokeColor('#e5e7eb').stroke();

    // Filas
    doc.fontSize(10).fillColor('#000');
    let y = y0 + 20;
    const trabajoWidth = 555 - col.trabajo;

    registros.forEach(r => {
      const lineaBase = Math.max(
        doc.heightOfString(fmt(r.fecha), { width: 70 }),
        doc.heightOfString(String(r.ordenId || '—'), { width: 40 }),
        doc.heightOfString(r.rol || '—', { width: 60 }),
        doc.heightOfString(String(r.horas ?? '—'), { width: 40 }),
        doc.heightOfString(r.trabajoRealizado || '—', { width: trabajoWidth })
      );

      if (y + lineaBase + 10 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        y = doc.y;
      }

      doc.text(fmt(r.fecha), col.fecha, y, { width: 70 });
      doc.text(String(r.ordenId || '—'), col.ot, y, { width: 40 });
      doc.text(r.rol || '—', col.rol, y, { width: 60 });
      doc.text(String(r.horas ?? '—'), col.horas, y, { width: 40, align: 'right' });
      doc.text(r.trabajoRealizado || '—', col.trabajo, y, { width: trabajoWidth });

      y += lineaBase + 6;
      doc.moveTo(x0, y).lineTo(555, y).strokeColor('#f1f5f9').stroke();
      y += 4;
    });

    doc.moveDown(1.2);
    doc.fontSize(12).fillColor('#111').text(`Total de horas: ${totalHoras}`);

    doc.end();
  } catch (error) {
    console.error('Error al generar PDF:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Error al generar el PDF' });
  }
};


exports.obtenerRegistrosDeTrabajo = async (req, res) => {
  const id = parseInt(req.params.id);
  const { desde, hasta } = req.query;

  try {
    const where = {
      empleadoId: id,
      ...(desde || hasta
        ? {
            fecha: {
              ...(desde ? { gte: new Date(desde) } : {}),
              ...(hasta
                ? (() => {
                    const fin = new Date(hasta);
                    fin.setHours(23, 59, 59, 999);
                    return { lte: fin };
                  })()
                : {}),
            },
          }
        : {}),
    };

    const registros = await prisma.registroDeTrabajo.findMany({
      where,
      orderBy: { fecha: 'asc' },
      select: {
        id: true,
        fecha: true,
        horas: true,
        rol: true,
        trabajoRealizado: true,        // 👈 IMPORTANTE
        ordenId: true,
        orden: { select: { solicitud: true } }, // 👈 para tu columna “Solicitud”
      },
    });

    res.json(
      registros.map(r => ({
        id: r.id,
        fecha: r.fecha,
        horas: r.horas,
        rol: r.rol || 'NO_ESPECIFICADO',
        trabajoRealizado: r.trabajoRealizado || '',
        ordenId: r.ordenId,
        solicitud: r.orden?.solicitud || '',
      }))
    );
  } catch (error) {
    console.error('Error al obtener registros de trabajo:', error);
    res.status(500).json({ error: 'Error al obtener los registros de trabajo' });
  }
};



// ✅ Exportar correctamente
module.exports = exports;

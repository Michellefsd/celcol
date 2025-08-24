import { subirArchivoGenerico } from '../utils/archivoupload.js';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// CREATE
const ALLOWED_LIC = ['MOTOR', 'AERONAVE', 'AVIONICA'];

export const crearPersonal = async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      email,
      telefono,
      esCertificador,
      esTecnico,
      direccion,
      tipoLicencia,               // "MOTOR" o ["MOTOR", "AERONAVE"]
      numeroLicencia,
      vencimientoLicencia,
      fechaAlta,
      horasTrabajadas
    } = req.body;

    const archivos = req.files || {};

    // normalizar y validar tipoLicencia -> array de enums válidos
    let lic = tipoLicencia;
    if (typeof lic === 'string') lic = [lic];
    if (!Array.isArray(lic)) lic = [];
    lic = lic
      .map(v => String(v).trim().toUpperCase())
      .filter(v => ALLOWED_LIC.includes(v));

    if (lic.length === 0) {
      return res.status(400).json({
        error: 'tipoLicencia inválido. Valores permitidos: MOTOR, AERONAVE, AVIONICA'
      });
    }

    const nuevo = await prisma.empleado.create({
      data: {
        nombre,
        apellido,
        email,
        telefono,
        esCertificador: Boolean(esCertificador),
        esTecnico: Boolean(esTecnico),
        direccion,
        tipoLicencia: { set: lic },
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
export const listarPersonal = async (_req, res) => {
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

// READ ONE — includeArchived + URL absoluta de carneSalud
export const obtenerPersonal = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const includeArchived =
      req.query.includeArchived === '1' || req.query.includeArchived === 'true';

    const where = includeArchived ? { id } : { id, archivado: false };
    const empleado = await prisma.empleado.findFirst({ where });

    if (!empleado) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    if (empleado.carneSalud && typeof empleado.carneSalud === 'string') {
      const isAbsolute = /^https?:\/\//i.test(empleado.carneSalud);
      if (!isAbsolute) {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const normalized = empleado.carneSalud.replace(/\\/g, '/').replace(/^\/+/, '');
        empleado.carneSalud = `${baseUrl}/${normalized}`;
      }
    }

    res.json(empleado);
  } catch (error) {
    console.error('Error al obtener empleado:', error);
    res.status(500).json({ error: 'Error al obtener el empleado' });
  }
};

// UPDATE
export const actualizarPersonal = async (req, res) => {
  const id = parseInt(req.params.id, 10);
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

    const {
      tipoLicencia,             // string | array | undefined
      vencimientoLicencia,
      fechaAlta,
      horasTrabajadas,
      ...resto
    } = req.body;

    const data = {
      ...resto,
      vencimientoLicencia: vencimientoLicencia ? new Date(vencimientoLicencia) : null,
      fechaAlta: fechaAlta ? new Date(fechaAlta) : null,
      horasTrabajadas: horasTrabajadas ? parseFloat(horasTrabajadas) : 0,
    };

    if (carneNuevo) data.carneSalud = carneNuevo;

    // Normalización de tipoLicencia (enum list) si viene en la request
    if (typeof tipoLicencia !== 'undefined') {
      let lic = tipoLicencia;
      if (typeof lic === 'string') lic = [lic];
      if (!Array.isArray(lic)) lic = [];
      lic = lic
        .map(v => String(v).trim().toUpperCase())
        .filter(v => ALLOWED_LIC.includes(v));

      data.tipoLicencia = { set: lic };
    }

    const actualizado = await prisma.empleado.update({ where: { id }, data });
    res.json(actualizado);
  } catch (error) {
    console.error('Error al actualizar personal:', error);
    res.status(500).json({ error: 'Error al actualizar el personal' });
  }
};

// ARCHIVAR PERSONAL (estricto: no archiva si está en OT abiertas)
export const archivarPersonal = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    // estados considerados "abiertos" (ajustá a tus valores reales)
    const OPEN_STATES = ['abierta', 'fase1', 'fase2', 'fase3', 'fase4'];

    const force = ['1', 'true', 'yes'].includes(
      String(req.query.force || '').toLowerCase()
    );

    // 🔧 micro-fix: usar registroDeTrabajo (consistente con el resto del código)
    const enOtAbierta = await prisma.registroDeTrabajo.findFirst({
      where: {
        empleadoId: id,
        orden: {
          archivada: false,
          // si tu campo real es estadoOrden, ajustá aquí:
          estado: { in: OPEN_STATES },
        },
      },
      select: { id: true },
    });

    if (enOtAbierta && !force) {
      return res
        .status(409)
        .json({ error: 'No se puede archivar: el empleado participa en OT abiertas' });
    }

    await prisma.empleado.update({
      where: { id },
      data: {
        archivado: true,
        // archivedAt: new Date(),
        // archivedBy: req.user?.sub || null,
      },
    });

    return res.json({
      mensaje: 'Empleado archivado correctamente',
      ...(enOtAbierta && force ? { warning: 'Se forzó el archivado con OT abierta' } : {}),
    });
  } catch (error) {
    console.error('Error al archivar personal:', error);
    return res.status(500).json({ error: 'Error al archivar el personal' });
  }
};

export const subirCarneSalud = (req, res) =>
  subirArchivoGenerico({
    req,
    res,
    modeloPrisma: prisma.empleado,
    campoArchivo: 'carneSalud',
    nombreRecurso: 'Personal',
    campoParam: 'id',
  });

// GET /personal/:id/registros-trabajo?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
export const descargarHorasEmpleado = async (req, res) => {
  const id = parseInt(req.params.id, 10);
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
        trabajoRealizado: true,
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

export const obtenerRegistrosDeTrabajo = async (req, res) => {
  const id = parseInt(req.params.id, 10);
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
        trabajoRealizado: true,
        ordenId: true,
        orden: { select: { solicitud: true } }, // para columna “Solicitud”
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

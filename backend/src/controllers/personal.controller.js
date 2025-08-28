import { subirArchivoGenerico } from '../utils/archivoupload.js';
import { PrismaClient } from '@prisma/client';
import { empleadoEnOtAbierta } from '../services/archiveGuards.js';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();
const ALLOWED_LIC = ['MOTOR', 'AERONAVE', 'AVIONICA'];


// CREATE
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
      tipoLicencia,              
      numeroLicencia,
      vencimientoLicencia,
      fechaAlta,
      horasTrabajadas
      // ⚠️ NO incluir carneSalud acá
    } = req.body;

    // normalizar tipoLicencia -> array de enums válidos
    let lic = tipoLicencia;
    if (typeof lic === 'string') lic = [lic];
    if (!Array.isArray(lic)) lic = [];
    lic = lic
      .map(v => String(v).trim().toUpperCase())
      .filter(v => ALLOWED_LIC.includes(v));

    if (!nombre || !apellido || !telefono) {
      return res.status(400).json({ error: 'nombre, apellido y telefono son obligatorios' });
    }
    if (lic.length === 0) {
      return res.status(400).json({
        error: `tipoLicencia inválido. Permitidos: ${ALLOWED_LIC.join(', ')}`
      });
    }

    const nuevo = await prisma.empleado.create({
      data: {
        nombre,
        apellido,
        email: email || null,
        telefono,
        esCertificador: esCertificador === true || esCertificador === 'true',
        esTecnico: esTecnico === true || esTecnico === 'true',
        direccion: direccion || null,
        tipoLicencia: { set: lic },
        numeroLicencia: numeroLicencia || null,
        vencimientoLicencia: vencimientoLicencia ? new Date(vencimientoLicencia) : null,
        fechaAlta: fechaAlta ? new Date(fechaAlta) : null,
        horasTrabajadas: horasTrabajadas ? Number(horasTrabajadas) : 0,
        archivado: false,
        // ⚠️ No poner carneSalud ni carneSaludId aquí
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

// READ ONE — GET BY ID con includeArchived y relación Archivo
export const obtenerPersonal = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const includeArchived =
      req.query.includeArchived === '1' || req.query.includeArchived === 'true';

    const where = includeArchived ? { id } : { id, archivado: false };

    const empleado = await prisma.empleado.findFirst({
      where,
      include: {
        carneSalud: {
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

    if (!empleado) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    // 🚫 Nada de toAbs ni URL públicas
    res.json(empleado);
  } catch (error) {
    console.error('Error al obtener empleado:', error);
    res.status(500).json({ error: 'Error al obtener el empleado' });
  }
};

// UPDATE (sin manejo de carné de salud)
export const actualizarPersonal = async (req, res) => {
  const id = parseInt(req.params.id, 10);

  // buscamos el registro y validamos que no esté archivado
  const actual = await prisma.empleado.findUnique({ where: { id } });
  if (!actual || actual.archivado) {
    return res.status(400).json({ error: 'No se puede modificar personal archivado o inexistente' });
  }

  try {
    const {
      tipoLicencia,             // string | array | undefined
      vencimientoLicencia,
      fechaAlta,
      horasTrabajadas,
      ...resto
    } = req.body;

    // armamos el objeto data como en tu versión original
    const data = {
      ...resto,
      vencimientoLicencia: vencimientoLicencia ? new Date(vencimientoLicencia) : null,
      fechaAlta: fechaAlta ? new Date(fechaAlta) : null,
      horasTrabajadas: horasTrabajadas ? parseFloat(horasTrabajadas) : 0,
      // ⚠️ sin carneSalud aquí
    };

    // Normalización de tipoLicencia si viene en la request
    if (typeof tipoLicencia !== 'undefined') {
      let lic = tipoLicencia;
      if (typeof lic === 'string') lic = [lic];
      if (!Array.isArray(lic)) lic = [];
      lic = lic
        .map(v => String(v).trim().toUpperCase())
        .filter(v => ALLOWED_LIC.includes(v)); // asumimos tu constante existente

      data.tipoLicencia = { set: lic };
    }

    const actualizado = await prisma.empleado.update({ where: { id }, data });
    res.json(actualizado);
  } catch (error) {
    console.error('Error al actualizar personal:', error);
    res.status(500).json({ error: 'Error al actualizar el personal' });
  }
};

// ARCHIVAR personal (sin force)
export const archivarPersonal = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const vinculado = await empleadoEnOtAbierta(id);
    if (vinculado) {
      const otRef =
        (await prisma.empleadoAsignado.findFirst({
          where: { empleadoId: id, orden: { is: { estadoOrden: 'ABIERTA' } } },
          select: { ordenId: true },
        })) ||
        (await prisma.registroDeTrabajo.findFirst({
          where: { empleadoId: id, orden: { is: { estadoOrden: 'ABIERTA' } } },
          select: { ordenId: true },
        }));

      return res.status(409).json({
        error: `No se puede archivar: el empleado participa en una OT ABIERTA${otRef?.ordenId ? ` (OT ${otRef.ordenId})` : ''}.`,
      });
    }

    const actualizado = await prisma.empleado.update({
      where: { id },
      data: { archivado: true },
    });

    return res.json({ mensaje: 'Empleado archivado correctamente', empleado: actualizado });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'No existe el registro' });
    console.error('Error al archivar personal:', error);
    return res.status(500).json({ error: 'Error al archivar el personal' });
  }
};


export const subirCarneSalud = (req, res) =>
  subirArchivoGenerico({
    req,
    res,
    modeloPrisma: prisma.empleado,
    campoArchivo: 'carneSalud',   // 👈 nombre exacto de la relación en Prisma
    nombreRecurso: 'Empleado',
    borrarAnterior: true,
    prefix: 'empleado',
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
      doc.text(r.rol || '—', col.rol, y, { width: 80 });
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

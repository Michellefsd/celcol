// src/controllers/ordenTrabajo.descarga.controller.js (ESM completo)
import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

export const descargarOrdenPDF = async (req, res) => {
  const id = parseInt(req.params.id, 10);

  // ----- Helpers -----
  const drawLine = (doc) => {
    doc.moveTo(doc.x, doc.y + 5)
      .lineTo(550, doc.y + 5)
      .strokeColor('#e2e8f0')
      .stroke()
      .fillColor('#000')
      .moveDown(0.6);
  };

  const fmtLocal = (d) => (d ? new Date(d).toLocaleDateString('es-UY') : '—');
  const fmtISO = (d) => {
    if (!d) return '—';
    const dd = new Date(d);
    if (isNaN(dd)) return '—';
    const y = dd.getUTCFullYear();
    const m = String(dd.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dd.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const nombrePropietario = (p) => {
    if (!p) return '—';
    const tipo = (p.tipoPropietario || '').toUpperCase();
    if (tipo === 'INSTITUCION') {
      return p.nombreEmpresa || p.razonSocial || p.nombre || '—';
    }
    const full = [p.nombre, p.apellido].filter(Boolean).join(' ').trim();
    return full || '—';
  };

  // Acepta array de objetos de pivot [{ propietario: {...} }] o
  // array directo [{...}] o incluso array de strings
  const propietariosTexto = (lista) => {
    if (!Array.isArray(lista) || !lista.length) return '—';
    return lista
      .map((x) => {
        if (typeof x === 'string') return x;
        const p = x?.propietario ?? x;
        return nombrePropietario(p);
      })
      .filter(Boolean)
      .join(', ');
  };

  const toolLabel = (h) => {
    const nombre = h?.nombre ?? '—';
    const marca = h?.marca?.trim();
    const modelo = h?.modelo?.trim();
    let dentro = '';
    if (marca && modelo) dentro = `${marca} ${modelo}`;
    else if (modelo) dentro = modelo;
    return dentro ? `${nombre} (${dentro})` : nombre;
  };

  // Construye URL absoluta para el archivo de solicitud.
  // Revisa múltiples campos posibles y arma base confiable.
  const solicitudURL = (orden) => {
    // posibles ubicaciones
    const f =
      orden.archivoSolicitud ||
      orden.solicitudArchivo ||
      orden.archivos?.solicitud ||
      orden.solicitud?.archivo ||
      null;

    if (!f) return null;

    const raw =
      typeof f === 'string'
        ? f
        : f.url || f.path || f.location || f.href || null;

    if (!raw) return null;
    if (/^https?:\/\//i.test(raw)) return raw;

    // Base de URL pública del API. Preferí una env explícita si existe.
    const base =
      process.env.API_PUBLIC_URL ||
      `${req.protocol}://${req.get('host')}`;

    return `${base}/${String(raw).replace(/^\/+/, '')}`;
  };

  try {
    if (!id) return res.status(400).json({ error: 'ID inválido' });

    const orden = await prisma.ordenTrabajo.findUnique({
      where: { id },
      include: {
        stockAsignado:     { include: { stock: true } },
        herramientas:      { include: { herramienta: true } },
        empleadosAsignados:{ include: { empleado: true } },
        registrosTrabajo:  { orderBy: { fecha: 'asc' }, include: { empleado: true } },

        // AVIÓN: importante incluir propietario anidado en pivot
        avion: {
          include: {
            ComponenteAvion: true,
            propietarios: { include: { propietario: true } },
          },
        },
        // COMPONENTE: propietario directo
        componente: { include: { propietario: true } },
      },
    });

    if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });

    if (!['CERRADA', 'CANCELADA'].includes(orden.estadoOrden)) {
      return res
        .status(400)
        .json({ error: 'La descarga solo está disponible para órdenes CERRADAS o CANCELADAS' });
    }

    // ¿Fue sobre avión o sobre componente?
    const trabajoEnAvion = !!orden.datosAvionSnapshot || !!orden.avionId;

    // PDF
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const filename = `orden-${id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    doc.pipe(res);

    // Logo (opcional)
    try {
      const logoPath = path.join(process.cwd(), 'public', 'celcol-logo.jpeg');
      if (fs.existsSync(logoPath)) doc.image(logoPath, 40, 30, { width: 80 });
    } catch {}

    // Header
    doc.fontSize(18).text('Celcol | Orden de Trabajo', 130, 40);
    doc.moveDown(2);

    doc.fontSize(16).text(`OT N.º ${orden.numero ?? orden.id}`, { underline: true });
    doc.fontSize(12).moveDown(0.5);
    doc.text(`Estado: ${orden.estadoOrden}`);
    doc.text(`Fecha de apertura: ${fmtLocal(orden.fechaApertura)}`);
    if (orden.estadoOrden === 'CERRADA') {
      doc.text(`Fecha de cierre: ${fmtLocal(orden.fechaCierre)}`);
    } else {
      doc.text(`Fecha de cancelación: ${fmtLocal(orden.fechaCancelacion)}`);
    }
    doc.moveDown();

    // ===== ENTIDAD + PROPIETARIOS =====
    if (trabajoEnAvion) {
      // Avión
      doc.fontSize(14).text('Datos del avión (snapshot)');
      drawLine(doc);
      doc.fontSize(12);
      const av = orden.datosAvionSnapshot || null;

      if (av) {
        doc.text(`Matrícula: ${av.matricula ?? '—'}`);
        doc.text(`Marca / Modelo: ${av.marca ?? '—'} ${av.modelo ?? ''}`);
        if (av.numeroSerie) doc.text(`N.º de serie: ${av.numeroSerie}`);
        if (av.TSN != null) doc.text(`TSN: ${av.TSN}`);
        // Algunos snapshots traen propietarios embebidos:
        if (Array.isArray(av.propietarios) && av.propietarios.length) {
          doc.text(`Propietario(s): ${propietariosTexto(av.propietarios)}`);
        }
      } else {
        doc.fillColor('#666').text('Sin snapshot disponible').fillColor('#000');
      }

      // Snapshot explícito de propietario de la OT (si existiera)
      if (orden.datosPropietarioSnapshot) {
        const snap = orden.datosPropietarioSnapshot;
        if (Array.isArray(snap)) {
          doc.text(`Propietario(s): ${propietariosTexto(snap)}`);
        } else {
          doc.text(`Propietario: ${nombrePropietario(snap)}`);
        }
      } else if (Array.isArray(orden.avion?.propietarios) && orden.avion.propietarios.length) {
        // Fallback a propietarios actuales del avión
        doc.text(`Propietario(s): ${propietariosTexto(orden.avion.propietarios)}`);
      } else if (!av || !Array.isArray(av?.propietarios)) {
        doc.text('Propietario(s): —');
      }

      doc.moveDown();
    } else {
      // Componente externo
      doc.fontSize(14).text('Componente externo (snapshot)');
      drawLine(doc);
      doc.fontSize(12);
      const comp = orden.datosComponenteSnapshot || null;

      if (comp) {
        doc.text(`Tipo: ${comp.tipo ?? '—'}`);
        doc.text(`Marca / Modelo: ${comp.marca ?? '—'} ${comp.modelo ?? ''}`);
        const serie = comp.numeroSerie ?? '—';
        const parte = comp.numeroParte ?? '—';
        doc.text(`N.º de serie / parte: ${serie} / ${parte}`);
        if (comp.TSN != null) doc.text(`TSN: ${comp.TSN}`);
      } else {
        doc.fillColor('#666').text('Sin snapshot disponible').fillColor('#000');
      }
      doc.moveDown();

      // Propietario del componente
      doc.fontSize(14).text('Propietario (al cierre)');
      drawLine(doc);
      doc.fontSize(12);

      if (orden.datosPropietarioSnapshot) {
        const p = orden.datosPropietarioSnapshot;
        if (Array.isArray(p)) {
          doc.text(`Propietario(s): ${propietariosTexto(p)}`);
        } else {
          doc.text(`Nombre/Razón Social: ${nombrePropietario(p)}`);
          if (p.rut || p.cedula) doc.text(`RUT/Cédula: ${p.rut ?? p.cedula}`);
          if (p.email) doc.text(`Email: ${p.email}`);
          if (p.telefono) doc.text(`Teléfono: ${p.telefono}`);
        }
      } else if (orden.componente?.propietario) {
        const p = orden.componente.propietario;
        doc.text(`Nombre/Razón Social: ${nombrePropietario(p)}`);
        if (p.rut) doc.text(`RUT: ${p.rut}`);
        if (p.email) doc.text(`Email: ${p.email}`);
        if (p.telefono) doc.text(`Teléfono: ${p.telefono}`);
      } else {
        doc.fillColor('#666').text('Sin datos de propietario').fillColor('#000');
      }
      doc.moveDown();
    }

    // ===== DATOS DE SOLICITUD =====
    doc.fontSize(14).text('Datos de solicitud');
    drawLine(doc);
    doc.fontSize(12);
    doc.text(`Solicitado por: ${orden.solicitadoPor ?? '—'}`);
    doc.text(`Descripción del trabajo solicitado: ${orden.solicitud ?? orden.descripcionTrabajo ?? '—'}`);
    const flag = !!orden.inspeccionRecibida;
    doc.text(`¿Inspección recibida?: ${flag ? 'Sí' : 'No'}`);
    if (orden.danosPrevios) doc.text(`Daños previos: ${orden.danosPrevios}`);
    if (orden.accionTomada) doc.text(`Acción tomada: ${orden.accionTomada}`);
    if (orden.observaciones) doc.text(`Observaciones: ${orden.observaciones}`);

    const urlSol = solicitudURL(orden);
    if (urlSol) {
      doc.fillColor('#2563eb').text(`Archivo de solicitud: ${urlSol}`, { link: urlSol, underline: true }).fillColor('#000');
    } else {
      doc.text('Archivo de solicitud: —');
    }
    doc.moveDown();

    // ===== HERRAMIENTAS =====
    doc.fontSize(14).text('Herramientas asignadas');
    drawLine(doc);
    doc.fontSize(12);
    if (orden.herramientas?.length) {
      orden.herramientas.forEach((h) => {
        const label = toolLabel(h.herramienta);
        const fv =
          h.herramienta?.fechaVencimiento ||
          h.herramienta?.vencimiento ||
          h.herramienta?.fechaCalibracion ||
          null;
        const venc = fv ? ` · Vence: ${fmtISO(fv)}` : '';
        doc.text(`- ${label}${venc}`);
      });
    } else {
      doc.fillColor('#666').text('—').fillColor('#000');
    }
    doc.moveDown();

    // ===== STOCK =====
    doc.fontSize(14).text('Stock utilizado');
    drawLine(doc);
    doc.fontSize(12);
    if (orden.stockAsignado?.length) {
      orden.stockAsignado.forEach((s) => {
        const nombre = s.stock?.nombre ?? s.stock?.codigo ?? 'Ítem';
        const cant = s.cantidadUtilizada ?? s.cantidad ?? '—';
        doc.text(`- ${nombre} · Cantidad: ${cant}`);
      });
    } else {
      doc.fillColor('#666').text('—').fillColor('#000');
    }
    doc.moveDown();

    // ===== PERSONAL (resumen) =====
    doc.fontSize(14).text('Personal asignado');
    drawLine(doc);
    doc.fontSize(12);
    if (orden.empleadosAsignados?.length) {
      const tecnicos = orden.empleadosAsignados
        .filter((a) => (a.rol || '').toUpperCase() === 'TECNICO')
        .map((t) => [t.empleado?.nombre, t.empleado?.apellido].filter(Boolean).join(' ').trim())
        .filter(Boolean);
      const certificadores = orden.empleadosAsignados
        .filter((a) => (a.rol || '').toUpperCase() === 'CERTIFICADOR')
        .map((c) => [c.empleado?.nombre, c.empleado?.apellido].filter(Boolean).join(' ').trim())
        .filter(Boolean);

      doc.text(`Técnicos: ${tecnicos.length ? tecnicos.join(', ') : '—'}`);
      doc.text(`Certificadores: ${certificadores.length ? certificadores.join(', ') : '—'}`);
    } else {
      doc.fillColor('#666').text('—').fillColor('#000');
    }
    doc.moveDown();

    // ===== REGISTROS DE TRABAJO =====
    if (orden.registrosTrabajo?.length) {
      doc.fontSize(14).text('Registros de trabajo');
      drawLine(doc);
      doc.fontSize(12);
      orden.registrosTrabajo.forEach((r) => {
        const nombre = [r.empleado?.nombre, r.empleado?.apellido].filter(Boolean).join(' ').trim() || '—';
        const rol = r.rol || '—';
        const horas = r.horas ?? r.cantidadHoras ?? '—';
        const desc = r.trabajoRealizado || r.detalle || r.descripcion || '—';
        doc.text(`- ${fmtISO(r.fecha)} · ${nombre} (${rol}) · Horas: ${horas} · ${desc}`);
      });
      doc.moveDown();
    }

    // Cierre
    doc.end();
  } catch (error) {
    console.error('Error al generar PDF de OT:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Error al generar el PDF' });
  }
};

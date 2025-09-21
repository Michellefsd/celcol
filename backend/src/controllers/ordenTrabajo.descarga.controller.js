// src/controllers/ordenTrabajo.descarga.controller.js (ESM)
import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

export const descargarOrdenPDF = async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);

  // ===== Helpers =====
  const fmtUY = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt)) return '';
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yyyy = dt.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const normalizeSnap = (val) => {
    if (!val) return null;
    if (typeof val === 'string') {
      try { return JSON.parse(val) ?? null; } catch { return null; }
    }
    return val;
  };

  const nombrePropietario = (p) => {
    if (!p) return '-';
    const tipo = (p.tipoPropietario || '').toUpperCase();
    if (tipo === 'INSTITUCION') return p.nombreEmpresa || '-';
    const full = [p.nombre, p.apellido].filter(Boolean).join(' ').trim();
    return full || '-';
  };

  const propietariosTexto = (lista) => {
    if (!Array.isArray(lista) || !lista.length) return '-';
    return lista
      .map((x) => {
        if (typeof x === 'string') {
          const maybe = normalizeSnap(x);
          if (maybe) return nombrePropietario(maybe);
          return x;
        }
        const p = x?.propietario ?? x;
        return nombrePropietario(p);
      })
      .filter(Boolean)
      .join(', ');
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
        avion: {
          include: {
            ComponenteAvion: true,
            propietarios: { include: { propietario: true } }
          }
        },
        componente: { include: { propietario: true } }
      }
    });

    if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });

    const estado = orden.estadoOrden || '';
    if (!['CERRADA', 'CANCELADA'].includes(estado)) {
      return res.status(400).json({ error: 'La descarga solo está disponible para órdenes CERRADAS o CANCELADAS' });
    }

    // Snapshots (si existen)
    const avSnap           = normalizeSnap(orden.datosAvionSnapshot);
    const compSnap         = normalizeSnap(orden.datosComponenteSnapshot);
    const propSnap         = normalizeSnap(orden.datosPropietarioSnapshot);
    const herramientasSnap = normalizeSnap(orden.datosHerramientasSnapshot);
    const stockSnap        = normalizeSnap(orden.datosStockSnapshot);
    const personalSnap     = normalizeSnap(orden.datosPersonalSnapshot);
    const discrepSnap      = normalizeSnap(orden.discrepanciasSnapshot);

    const trabajoEnAvion = !!avSnap || !!orden.avionId;

    // ===== PDF setup =====
    const doc = new PDFDocument({ size: 'A4', margin: 36 }); // ~12.7mm
    const filename = `OT-${orden.numero ?? orden.id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    doc.pipe(res);

    // Logo (opcional)
    try {
      const logoPath = path.join(process.cwd(), 'public', 'celcol-logo.jpeg');
      if (fs.existsSync(logoPath)) doc.image(logoPath, 36, 24, { width: 90 });
    } catch {}

    // ===== Encabezado CA-29 =====
    const topY = 24;

    // Título principal
    doc.font('Helvetica-Bold').fontSize(14)
       .text('SOLICITUD - ORDEN DE TRABAJO', 140, topY, { continued: true })
       .text('   DISCREPANCIAS');

    // Caja derecha con metadatos
    doc.font('Helvetica').fontSize(9);
    const boxX = 420, boxY = topY, boxW = 150, boxH = 60;
    doc.rect(boxX, boxY, boxW, boxH).stroke();
    doc.text('Capítulo: 9', boxX + 6, boxY + 6);
    doc.text('Máster de Formatos y formularios', boxX + 6, boxY + 18);
    doc.text('Quinta Edición', boxX + 6, boxY + 30);
    doc.text(`Fecha: ${fmtUY(new Date())}`, boxX + 6, boxY + 42);
    doc.font('Helvetica-Bold').text('CA-29', boxX + boxW - 40, boxY + 6);

    // Separador bajo encabezado
    doc.moveTo(36, topY + 70).lineTo(559, topY + 70).stroke();

    // Subtítulo con OT + estado/fechas
    doc.font('Helvetica-Bold').fontSize(11)
       .text(`OT Nro: ${orden.numero ?? orden.id}`, 36, topY + 80);

    doc.font('Helvetica').fontSize(10)
       .text(`Estado: ${estado}`, 36, topY + 96)
       .text(`Fecha de apertura: ${fmtUY(orden.fechaApertura)}`, 36, topY + 110);

    if (estado === 'CERRADA') {
      doc.text(`Fecha de cierre: ${fmtUY(orden.fechaCierre)}`, 36, topY + 124);
    } else {
      doc.text(`Fecha de cancelación: ${fmtUY(orden.fechaCancelacion)}`, 36, topY + 124);
    }

    const flagArchivado = (orden.archivado === true) || (orden.archivada === true);
    if (flagArchivado) doc.text('Archivado: Sí', 36, topY + 138);

    // ======= Helpers gráficos locales =======
    const cell = (doc2, x, y, w, h, text = '', opts = {}) => {
      const { label, labelSize = 8, textSize = 10, boldLabel = false } = opts;
      doc2.save();
      doc2.rect(x, y, w, h).stroke();
      if (label) {
        doc2.fontSize(labelSize).font(boldLabel ? 'Helvetica-Bold' : 'Helvetica')
            .text(label, x + 4, y + 2, { width: w - 8, height: 10 });
      }
      if (text) {
        doc2.fontSize(textSize).font('Helvetica')
            .text(text, x + 4, y + (label ? 14 : 4), { width: w - 8, height: h - (label ? 18 : 8) });
      }
      doc2.restore();
    };

    const t = (doc2, text, x, y, size = 10, bold = false, align = 'left', width = null) => {
      doc2.save();
      doc2.fontSize(size).font(bold ? 'Helvetica-Bold' : 'Helvetica')
          .text(text, x, y, { width: width ?? 9999, align });
      doc2.restore();
    };

    const tablaItems = (doc2, x, y, widths, rowHeight, filas) => {
      // Encabezado
      const headers = ['#', '6 Reporte', '7 Acción Tomada', '8 Técnico', '9 Certific.', '10 H.H'];
      let cx = x;
      for (let i = 0; i < widths.length; i++) {
        cell(doc2, cx, y, widths[i], rowHeight, headers[i], { boldLabel: true, labelSize: 10 });
        cx += widths[i];
      }
      // Filas (4)
      let yy = y + rowHeight;
      for (let r = 0; r < 4; r++) {
        const fila = filas[r] || {};
        const data = [
          String(fila.numero ?? (r + 1)),
          fila.reporte || '',
          fila.accionTomada || '',
          fila.tecnico || '',
          fila.certificador || '',
          fila.hh != null ? String(fila.hh) : ''
        ];
        cx = x;
        for (let i = 0; i < widths.length; i++) {
          cell(doc2, cx, yy, widths[i], rowHeight, null, {});
          t(doc2, data[i], cx + 4, yy + 6, 10, false, 'left', widths[i] - 8);
          cx += widths[i];
        }
        yy += rowHeight;
      }
      return yy;
    };

    const tablaAB = (doc2, x, y, widths, rowHeight, A, B) => {
      const headers = ['A/B', '11 Discrepancias encontradas', '12 Acción Tomada', '8 Técnico', '9 Certific.', '10 H.H'];
      let cx = x;
      for (let i = 0; i < widths.length; i++) {
        cell(doc2, cx, y, widths[i], rowHeight, headers[i], { boldLabel: true, labelSize: 10 });
        cx += widths[i];
      }
      const drawRow = (tag, row, yy) => {
        const data = [
          tag,
          row?.texto || '',
          row?.accion || '',
          row?.tecnico || '',
          row?.certificador || '',
          row?.hh != null ? String(row.hh) : ''
        ];
        let cxx = x;
        for (let i = 0; i < widths.length; i++) {
          cell(doc2, cxx, yy, widths[i], rowHeight, null, {});
          t(doc2, data[i], cxx + 4, yy + 6, 10, false, 'left', widths[i] - 8);
          cxx += widths[i];
        }
      };
      let yy = y + rowHeight;
      drawRow('A', A || {}, yy);
      yy += rowHeight;
      drawRow('B', B || {}, yy);
      yy += rowHeight;
      return yy;
    };

    // ======= Contenido CA-29 =======
    // Contenido va de x=36 a x=559 (ancho útil 523pt)
    let curY = topY + 150; // debajo del bloque estado/fechas

    const X = 36, WIDTH = 523;
    const rowH = 42;

    // 1–3 en una fila: Matrícula | Fecha solicitud | OT Nro.
    const col1 = 180, col2 = 160, col3 = WIDTH - col1 - col2; // 523
    const matricula =
      (normalizeSnap(orden.datosAvionSnapshot)?.matricula) ||
      (orden.avion?.matricula) ||
      (normalizeSnap(orden.datosComponenteSnapshot)?.matricula) || '';

    cell(doc, X, curY, col1, rowH, matricula || '-', { label: '1 Matrícula', boldLabel: true });
    cell(doc, X + col1, curY, col2, rowH, fmtUY(orden.fechaSolicitud) || '-', { label: '2 Fecha solicitud', boldLabel: true });
    cell(doc, X + col1 + col2, curY, col3, rowH, String(orden.numero ?? orden.id), { label: '3 O/T Nro.', boldLabel: true });
    curY += rowH + 6;

    // 4 Solicitud + 5 Firma o email
    const solicitudH = 78;
    const firmaW = 200;
    const solicitudW = WIDTH - firmaW - 6; // separador
    const solicitudTexto = orden.solicitud || orden.descripcionTrabajo || orden.descripcion || '';
    const firmaTexto =
      orden.solicitadoPor ||
      orden.solicitanteEmail ||
      (propSnap ? (propSnap.email || nombrePropietario(propSnap)) : '') ||
      propietariosTexto(orden?.avion?.propietarios) ||
      (orden?.componente?.propietario ? nombrePropietario(orden.componente.propietario) : '');

    cell(doc, X, curY, solicitudW, solicitudH, solicitudTexto || '', { label: '4 Solicitud (descripción del trabajo)', boldLabel: true });
    cell(doc, X + solicitudW + 6, curY, firmaW, solicitudH, firmaTexto || '', { label: '5 Firma o email', boldLabel: true });
    curY += solicitudH + 4;

    t(doc, 'Autorizo a la OMA, la realización en la aeronave o componente de los trabajos detallados en la siguiente orden', X, curY, 9);
    curY += 14;

    // Tabla 6–10 (4 renglones)
    // widths suman 523: [28, 240, 150, 40, 40, 25]
    const tW = [28, 240, 150, 40, 40, 25], tRowH = 42;

    // Mapeo simple a partir de registrosTrabajo y empleadosAsignados
    const toNombre = (emp) => {
      const n = emp?.nombre ?? emp?.empleado?.nombre;
      const a = emp?.apellido ?? emp?.empleado?.apellido;
      return [n, a].filter(Boolean).join(' ').trim();
    };
    const personalArray = Array.isArray(personalSnap) ? personalSnap : (orden.empleadosAsignados || []);
    const tecnicos = personalArray.filter(e => (e?.rol || '').toUpperCase() === 'TECNICO').map(toNombre).filter(Boolean);
    const certificadores = personalArray.filter(e => (e?.rol || '').toUpperCase() === 'CERTIFICADOR').map(toNombre).filter(Boolean);

    const filas = [];
    const regs = Array.isArray(orden.registrosTrabajo) ? orden.registrosTrabajo : [];
    for (let i = 0; i < Math.min(4, regs.length); i++) {
      const r = regs[i];
      const nombre = [r?.empleado?.nombre, r?.empleado?.apellido].filter(Boolean).join(' ').trim();
      filas.push({
        numero: i + 1,
        reporte: r?.trabajoRealizado || r?.detalle || r?.descripcion || '',
        accionTomada: r?.accionTomada || orden?.accionTomada || '',
        tecnico: nombre || (tecnicos[0] || ''),
        certificador: certificadores[0] || '',
        hh: r?.horas ?? r?.cantidadHoras ?? ''
      });
    }
    while (filas.length < 4) filas.push({ numero: filas.length + 1 });

    curY = tablaItems(doc, X, curY, tW, tRowH, filas) + 8;

    // Bloque A/B (11–12)
    const discA = discrepSnap?.A || {};
    const discB = discrepSnap?.B || {};
    curY = tablaAB(doc, X, curY, tW, tRowH, discA, discB) + 10;

    // 13 Fecha de cierre/cancelación
    const fechaCierreTexto = estado === 'CERRADA'
      ? fmtUY(orden.fechaCierre)
      : fmtUY(orden.fechaCancelacion);
    cell(doc, X, curY, 220, 36, fechaCierreTexto || '', { label: '13 Fecha de cierre', boldLabel: true });
    curY += 50;

    // Pie de página
    const footY = Math.max(curY + 8, 800); // forzado cerca del pie A4
    t(doc, 'Manual de la Organización de Mantenimiento – MOM', X, footY, 9);
    t(doc, 'Aprobado por: CELCOL AVIATION', X + 300, footY, 9);

    // Cierre PDF
    doc.end();
  } catch (error) {
    console.error('Error al generar PDF de OT:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Error al generar el PDF' });
  }
};

/*// src/controllers/ordenTrabajo.descarga.controller.js (ESM)
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
*/

















// src/controllers/ordenTrabajo.descarga.controller.js (ESM)
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import puppeteer from 'puppeteer';

const prisma = new PrismaClient();

export const descargarOrdenPDF = async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);

  // ----- helpers -----
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

  const escapeHTML = (s) =>
    String(s ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const nombrePropietario = (p) => {
    if (!p) return '-';
    const tipo = (p.tipoPropietario || '').toUpperCase();
    if (tipo === 'INSTITUCION') return p.nombreEmpresa || '-';
    const full = [p.nombre, p.apellido].filter(Boolean).join(' ').trim();
    return full || '-';
  };
  const emailPropietario = (p) => (p?.email || p?.correo || p?.mail || '');

  try {
    if (!id) return res.status(400).json({ error: 'ID inválido' });

    const orden = await prisma.ordenTrabajo.findUnique({
      where: { id },
      include: {
        empleadosAsignados: { include: { empleado: true } },
        registrosTrabajo:   { orderBy: { fecha: 'asc' }, include: { empleado: true } },
        avion: {
          include: {
            propietarios: { include: { propietario: true } }
          }
        },
        componente: { include: { propietario: true } }
      }
    });
    if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });
    const estado = orden.estadoOrden || '';
    if (!['CERRADA', 'CANCELADA'].includes(estado)) {
      return res.status(400).json({ error: 'Solo disponible para órdenes CERRADAS o CANCELADAS' });
    }

    // snapshots
    const avSnap   = normalizeSnap(orden.datosAvionSnapshot);
    const compSnap = normalizeSnap(orden.datosComponenteSnapshot);
    const propSnap = normalizeSnap(orden.datosPropietarioSnapshot);
    const discrep  = normalizeSnap(orden.discrepanciasSnapshot) || {};

    // datos de cabecera
    const matricula = (avSnap?.matricula) || (orden.avion?.matricula) || (compSnap?.matricula) || '';
    const fechaSolicitud = fmtUY(orden.fechaApertura); // regla: usar apertura
    const otNro = String(orden.numero ?? orden.id);

    const propName =
      (propSnap ? nombrePropietario(propSnap) : '') ||
      (orden?.componente?.propietario ? nombrePropietario(orden.componente.propietario) : '') ||
      (orden?.avion?.propietarios?.[0]?.propietario ? nombrePropietario(orden.avion.propietarios[0].propietario) : '') ||
      (orden.solicitadoPor || '');
    const propEmail =
      (propSnap ? emailPropietario(propSnap) : '') ||
      (orden?.componente?.propietario ? emailPropietario(orden.componente.propietario) : '') || '';

    const firmaTexto = [propName, propEmail].filter(Boolean).join('<br/>');
    const solicitudTexto = orden.solicitud || orden.descripcionTrabajo || orden.descripcion || '';

    // personal
    const toNombre = (emp) => {
      const n = emp?.nombre ?? emp?.empleado?.nombre;
      const a = emp?.apellido ?? emp?.empleado?.apellido;
      return [n, a].filter(Boolean).join(' ').trim();
    };
    const tecnicos = (orden.empleadosAsignados || [])
      .filter(e => (e?.rol || '').toUpperCase() === 'TECNICO')
      .map(toNombre);
    const certificadores = (orden.empleadosAsignados || [])
      .filter(e => (e?.rol || '').toUpperCase() === 'CERTIFICADOR')
      .map(toNombre);

    // filas 1-4
    const regs = Array.isArray(orden.registrosTrabajo) ? orden.registrosTrabajo : [];
    const filas = [];
    for (let i = 0; i < Math.min(4, regs.length); i++) {
      const r = regs[i];
      const nombre = [r?.empleado?.nombre, r?.empleado?.apellido].filter(Boolean).join(' ').trim();
      filas.push({
        num: i + 1,
        reporte: r?.trabajoRealizado || r?.detalle || r?.descripcion || '',
        accion: r?.accionTomada || orden?.accionTomada || '',
        tecnico: nombre || (tecnicos[0] || ''),
        certificador: certificadores[0] || '',
        hh: r?.horas ?? r?.cantidadHoras ?? ''
      });
    }
    while (filas.length < 4) filas.push({ num: filas.length + 1, reporte: '', accion: '', tecnico: '', certificador: '', hh: '' });

    // A/B
    const A = discrep?.A || {};
    const B = discrep?.B || {};
    const fechaCierreTexto = estado === 'CERRADA' ? fmtUY(orden.fechaCierre) : fmtUY(orden.fechaCancelacion);

    // logo embebido (base64) opcional
    let logoData = '';
    try {
      const logoPath = path.join(process.cwd(), 'public', 'celcol-logo.jpeg');
      if (fs.existsSync(logoPath)) {
        const buf = fs.readFileSync(logoPath);
        logoData = `data:image/jpeg;base64,${buf.toString('base64')}`;
      }
    } catch {}

    // HTML
    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>CA-29 OT ${escapeHTML(otNro)}</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #000; }
  .row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4mm; }
  .box { border: 0.4pt solid #000; padding: 2.5mm; position: relative; }
  .label { position:absolute; top: -3.8mm; left: 2mm; background:#fff; padding: 0 1mm; font-size: 8pt; font-weight: 700; }
  .h1 { font-weight: 700; font-size: 14pt; margin: 2mm 0 3mm 0; }
  .topline { border-top: 0.4pt solid #000; margin-top: 2mm; }
  .meta { position: absolute; top: 0; right: 0; width: 55mm; height: 18mm; border: 0.4pt solid #000; padding: 2mm; font-size: 8.5pt; }
  .meta .ca { position: absolute; top: 2mm; right: 3mm; font-weight: 700; }
  .mono { white-space: pre-wrap; }
  .mini { border: 0.4pt solid #000; padding: 1mm 2mm; font-size: 8pt; height: 6mm; }
  .items { margin-top: 2mm; }
  .item { display: grid; grid-template-columns: 13mm 1fr; gap: 2mm; height: 28mm; margin-bottom: 2mm; }
  .item .num { border: 0.4pt solid #000; display:flex; align-items:center; justify-content:center; font-weight:700; }
  .half { border: 0.4pt solid #000; position: relative; padding: 2.5mm 2.5mm 10mm 2.5mm; }
  .half + .half { margin-top: 1.5mm; }
  .mini-wrap { position:absolute; right: 2mm; bottom: -7mm; display:flex; gap: 2mm; }
  .ab { display: grid; grid-template-columns: 13mm 1fr; gap: 2mm; height: 24mm; margin-bottom: 2mm; }
  .right { float: right; }
  .footer { margin-top: 2mm; display:flex; justify-content: space-between; font-size:9pt; }
  .logo { position:absolute; left:0; top:0; }
  .hdr { position:relative; height: 18mm; }
</style>
</head>
<body>

<div class="hdr">
  ${logoData ? `<img class="logo" src="${logoData}" style="width:30mm; margin-top: -2mm">` : ''}
  <div class="meta">
    <div>Capítulo: 9</div>
    <div>Fecha: ${escapeHTML(fmtUY(new Date()))}</div>
    <div class="ca">CA-29</div>
  </div>
</div>

<div class="h1">SOLICITUD - ORDEN DE TRABAJO&nbsp;&nbsp;DISCREPANCIAS</div>
<div class="topline"></div>

<!-- 1-3 -->
<div class="row" style="margin-top: 3mm;">
  <div class="box"><div class="label">1 Matrícula</div><div class="mono">${escapeHTML(matricula || '-')}</div></div>
  <div class="box"><div class="label">2 Fecha solicitud</div><div class="mono">${escapeHTML(fechaSolicitud || '-')}</div></div>
  <div class="box"><div class="label">3 O/T Nro.</div><div class="mono">${escapeHTML(otNro)}</div></div>
</div>

<!-- 4-5 -->
<div class="row" style="margin-top: 3mm; grid-template-columns: 1fr 55mm 0; gap: 4mm;">
  <div class="box" style="height: 24mm;"><div class="label">4 Solicitud (descripción del trabajo)</div>
    <div class="mono" style="line-height: 1.25;">${escapeHTML(solicitudTexto)}</div></div>
  <div class="box" style="height: 24mm;"><div class="label">5 Firma o email</div>
    <div class="mono" style="line-height: 1.25;">${firmaTexto}</div></div>
</div>

<div style="margin: 2mm 0 1mm 0; font-size: 9pt;">
  Autorizo a la OMA, la realización en la aeronave o componente de los trabajos detallados en la siguiente orden
</div>

<!-- 1-4 items -->
<div class="items">
  ${filas.map(f => `
    <div class="item">
      <div class="num">${f.num}</div>
      <div>
        <div class="half">
          <div class="label">6 Reporte</div>
          <div class="mono" style="line-height:1.2;">${escapeHTML(f.reporte)}</div>
          <div class="mini-wrap">
            <div class="mini">8 Técnico</div>
          </div>
          <div style="position:absolute; right: 4mm; bottom: -11mm; width: 30mm; text-align:right; font-size: 8pt;">${escapeHTML(f.tecnico)}</div>
        </div>
        <div class="half">
          <div class="label">7 Acción Tomada</div>
          <div class="mono" style="line-height:1.2;">${escapeHTML(f.accion)}</div>
          <div class="mini-wrap">
            <div class="mini">9 Certific.</div>
            <div class="mini">10 H.H</div>
          </div>
          <div style="position:absolute; right: 36mm; bottom: -11mm; width: 28mm; text-align:left; font-size: 8pt;">${escapeHTML(f.certificador)}</div>
          <div style="position:absolute; right: 4mm; bottom: -11mm; width: 30mm; text-align:right; font-size: 8pt;">${escapeHTML(String(f.hh ?? ''))}</div>
        </div>
      </div>
    </div>
  `).join('')}
</div>

<!-- A/B -->
${[['A', A], ['B', B]].map(([tag, r]) => `
  <div class="ab">
    <div class="num" style="border:0.4pt solid #000; display:flex; align-items:center; justify-content:center; font-weight:700;">${tag}</div>
    <div>
      <div class="half">
        <div class="label">11 Discrepancias encontradas</div>
        <div class="mono" style="line-height:1.2;">${escapeHTML(r?.texto || '')}</div>
        <div class="mini-wrap"><div class="mini">8 Técnico</div></div>
        <div style="position:absolute; right: 4mm; bottom: -11mm; width: 30mm; text-align:right; font-size: 8pt;">${escapeHTML(r?.tecnico || '')}</div>
      </div>
      <div class="half">
        <div class="label">12 Acción Tomada</div>
        <div class="mono" style="line-height:1.2;">${escapeHTML(r?.accion || '')}</div>
        <div class="mini-wrap"><div class="mini">9 Certific.</div><div class="mini">10 H.H</div></div>
        <div style="position:absolute; right: 36mm; bottom: -11mm; width: 28mm; text-align:left; font-size: 8pt;">${escapeHTML(r?.certificador || '')}</div>
        <div style="position:absolute; right: 4mm; bottom: -11mm; width: 30mm; text-align:right; font-size: 8pt;">${escapeHTML(String(r?.hh ?? ''))}</div>
      </div>
    </div>
  </div>
`).join('')}

<!-- 13 Fecha de cierre (derecha) -->
<div class="row" style="grid-template-columns: 1fr 55mm 0; margin-top: 2mm;">
  <div></div>
  <div class="box" style="height: 11mm;">
    <div class="label">13 Fecha de cierre</div>
    <div class="mono">${escapeHTML(fechaCierreTexto || '')}</div>
  </div>
</div>

<div class="footer">
  <div>Manual de la Organización de Mantenimiento – MOM</div>
  <div>Aprobado por: CELCOL AVIATION</div>
</div>

</body>
</html>`;

    // ---- Puppeteer render ----
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' }
    });

    await browser.close();

    const filename = `OT-${orden.numero ?? orden.id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    return res.send(pdf);
  } catch (error) {
    console.error('Error al generar PDF de OT (Puppeteer):', error);
    if (!res.headersSent) return res.status(500).json({ error: 'Error al generar el PDF' });
  }
};

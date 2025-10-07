/*import prisma from '../lib/prisma.js';
import path from 'path';
import fs from 'fs';
import puppeteer from 'puppeteer';

export const descargarConformidadPDF = async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);

  // Helpers
  const fmtUY = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt)) return '';
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yyyy = dt.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const escapeHTML = (s) =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const normalizeSnap = (val) => {
    if (!val) return null;
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch { return null; }
    }
    return val;
  };

  // Certificador: empleadosAsignados -> registrosTrabajo -> esCertificador
  const pickCertificadorEmpleado = (orden) => {
    const ea = (orden.empleadosAsignados || []).find(
      (e) => String(e?.rol || '').toUpperCase() === 'CERTIFICADOR'
    );
    if (ea?.empleado) return ea.empleado;

    const rt = (orden.registrosTrabajo || []).find(
      (r) => String(r?.rol || '').toUpperCase() === 'CERTIFICADOR'
    );
    if (rt?.empleado) return rt.empleado;

    const ea2 = (orden.empleadosAsignados || []).find((e) => e?.empleado?.esCertificador);
    return ea2?.empleado ?? null;
  };

  try {
    if (!id) return res.status(400).json({ error: 'ID inválido' });

    const orden = await prisma.ordenTrabajo.findUnique({
      where: { id },
      include: {
        empleadosAsignados: { include: { empleado: true } },
        registrosTrabajo: { include: { empleado: true } }, // <- para fallback de certificador
        avion: true,
        componente: true
      }
    });
    if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });

    // Logo embebido (si existe en "public/celcol-logo.jpeg")
    let logoData = '';
    try {
      const logoPath = path.join(process.cwd(), 'public', 'celcol-logo.jpeg');
      if (fs.existsSync(logoPath)) {
        const buf = fs.readFileSync(logoPath);
        logoData = `data:image/jpeg;base64,${buf.toString('base64')}`;
      }
    } catch {}

    const body = req.method === 'POST' ? (req.body || {}) : {};
    const q = req.query || {};

    // Snapshot de avión
    const avSnap = normalizeSnap(orden.datosAvionSnapshot) ?? {};
    const componentesSnap = Array.isArray(avSnap.componentes) ? avSnap.componentes : [];

    // TSN del avión → "Horas TT"
    const avionTSN = avSnap.TSN ?? '';

    // Motor (snapshot, tipo === 'motor')
    const motor = componentesSnap.find(
      (c) => (c?.tipo ?? '').toString().toLowerCase() === 'motor'
    ) || null;

    // TBOHoras del motor
    const motorTBOHoras = motor?.TBOHoras ?? motor?.tboHoras ?? '';

    // Certificador (empleado)
    const certEmp = pickCertificadorEmpleado(orden);

    // Avión/componente de DB (solo como fallback de datos básicos del encabezado)
    const avion = orden.avion ?? null;

    // Variables a imprimir
    const motorTBOBase = q.motorTBO ?? body.motorTBO ?? (motor?.TBO ?? motor?.tbo ?? '');
    const motorTBODisplay =
      motorTBOBase
        ? (motorTBOHoras
            ? `${motorTBOBase} (TBOHoras ${motorTBOHoras})`
            : `${motorTBOBase} ?TBOHoras`)
        : (motorTBOHoras
            ? `(TBOHoras ${motorTBOHoras})`
            : '');

    const vars = {
      // Encabezado
      fechaEmision: q.fechaEmision ?? body.fechaEmision ?? fmtUY(new Date()),
      empresaTitulo: q.empresaTitulo ?? body.empresaTitulo ?? 'CELCOL AVIATION',
      empresaLinea1: q.empresaLinea1 ?? body.empresaLinea1 ?? 'Camino Melilla Aeropuerto Ángel Adami',
      empresaLinea2: q.empresaLinea2 ?? body.empresaLinea2 ?? 'Sector CAMES – Hangar Nº 2 · OMA IR-158',

      // Avión (prioridad snapshot; fallback a DB si faltara algo)
      matricula: q.matricula ?? body.matricula ?? (avSnap.matricula ?? avion?.matricula ?? ''),
      marca:     q.marca     ?? body.marca     ?? (avSnap.marca     ?? avion?.marca     ?? ''),
      modelo:    q.modelo    ?? body.modelo    ?? (avSnap.modelo    ?? avion?.modelo    ?? ''),
      serial:    q.serial    ?? body.serial    ?? (avSnap.numeroSerie ?? avion?.numeroSerie ?? ''),

      // Tabla derecha (ambos recuadros)
      fecha:  '', // en blanco
      lugar:  q.lugar   ?? body.lugar   ?? '',
      horasTT: String(q.horasTT ?? body.horasTT ?? avionTSN ?? ''), // TSN
      ot:     q.ot      ?? body.ot      ?? (orden.numero ?? orden.id),

      // Certificación
      textoCertificacion:
        q.textoCertificacion ??
        body.textoCertificacion ??
        'Certifico que esta aeronave ha sido inspeccionada y los trabajos arriba descritos han sido completados de manera satisfactoria, por lo que se encuentra en condiciones seguras y aeronavegable por concepto de los trabajos realizados. Los detalles de estos mantenimientos se encuentran bajo la Orden de Trabajo arriba descrita.',

      certificadorNombre:
        q.certificadorNombre ??
        body.certificadorNombre ??
        [certEmp?.nombre, certEmp?.apellido].filter(Boolean).join(' '),

      certificadorLicString:
        q.certificadorLicString ??
        body.certificadorLicString ??
        (certEmp?.numeroLicencia ? `MMA. ${certEmp.numeroLicencia}` : ''),

      // Motor (snapshot)
      motorMarca:  q.motorMarca  ?? body.motorMarca  ?? (motor?.marca       ?? ''),
      motorModelo: q.motorModelo ?? body.motorModelo ?? (motor?.modelo      ?? ''),
      motorSerial: q.motorSerial ?? body.motorSerial ?? (motor?.numeroSerie ?? ''),
      motorTSO:    q.motorTSO    ?? body.motorTSO    ?? (motor?.TSO         ?? motor?.tso ?? ''),
      motorTBO:    motorTBODisplay
    };

    // HTML del PDF
    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>Conformidad de Mantenimiento</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 9pt; color: #000; background: #fff; line-height: 1.15; }

  // Fecha fuera del recuadro (más arriba) //
  .fecha-emision { position: fixed; top: 3mm; right: 12mm; font-size: 9pt; }

  // Bajar el contenido para que no se encime con la fecha fija //
  .wrap { display: flex; flex-direction: column; gap: 4mm; margin-top: 10mm; }

  .box { border: 2pt double #000; padding: 3mm; }
  // Primer recuadro más bajo para evitar hueco //
  .box-top { min-height: 100mm; }
  .box-bottom { min-height: 110mm; }

  .header-grid {
    display: grid;
    grid-template-columns: 1fr 2fr 1fr;
    align-items: flex-start;
    gap: 3mm;
  }
  .center {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
  }
  .center img { height: 18mm; margin-bottom: 1mm; }
  .title { font-weight: bold; font-size: 11pt; }
  .address { font-size: 8pt; line-height: 1.2; }
  .cert-title { font-size: 9.5pt; font-weight: bold; margin-top: 1mm; white-space: nowrap; }

  .sheet { width: 100%; border-collapse: collapse; font-size: 7.5pt; }
  .sheet td { border: 0.5pt solid #000; padding: 1mm; vertical-align: top; }

  .motor-helice-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3mm;
    margin-top: 3mm;
  }

  .trabajos { margin-top: 3mm; font-size: 8pt; }

  .cert-table { width: 100%; border-collapse: collapse; margin-top: 3mm; font-size: 8pt; }
  .cert-table td { border: 0.5pt solid #000; padding: 1mm; vertical-align: top; }
  .cert-table .hdr { font-weight: bold; text-align: center; }
  .cert-table tr:last-child td { height: 8mm; }
</style>
</head>
<body>
<div class="fecha-emision">Fecha: ${escapeHTML(vars.fechaEmision)}</div>

<div class="wrap">
  <!-- Primer recuadro -->
  <div class="box box-top">
    <div class="header-grid">
      <div>
        <table class="sheet">
          <tr><td><strong>Matrícula:</strong> ${escapeHTML(vars.matricula)}</td></tr>
          <tr><td><strong>Marca:</strong> ${escapeHTML(vars.marca)}</td></tr>
          <tr><td><strong>Modelo:</strong> ${escapeHTML(vars.modelo)}</td></tr>
          <tr><td><strong>Serial:</strong> ${escapeHTML(vars.serial)}</td></tr>
        </table>
      </div>
      <div class="center">
        ${logoData ? `<img src="${logoData}" alt="logo">` : ''}
        <div class="title">${escapeHTML(vars.empresaTitulo)}</div>
        <div class="address">${escapeHTML(vars.empresaLinea1)}<br>${escapeHTML(vars.empresaLinea2)}</div>
        <div class="cert-title">CERTIFICADO DE CONFORMIDAD DE MANTENIMIENTO</div>
      </div>
      <div>
        <table class="sheet">
          <tr><td><strong>Fecha:</strong> </td></tr>
          <tr><td><strong>Lugar:</strong> ${escapeHTML(vars.lugar)}</td></tr>
          <tr><td><strong>Horas TT:</strong> ${escapeHTML(vars.horasTT)}</td></tr>
          <tr><td><strong>OT:</strong> ${escapeHTML(String(vars.ot))}</td></tr>
        </table>
      </div>
    </div>

    <div class="trabajos">
      <p style="font-weight:bold; text-align:center;">A la aeronave se le efectuaron los trabajos que a continuación se describen:</p>
      <div style="height:15mm;"></div>
    </div>

    <table class="cert-table">
      <tr><td colspan="3">${escapeHTML(vars.textoCertificacion)}</td></tr>
      <tr>
        <td class="hdr">Nombre Certificador</td>
        <td class="hdr">Lic. Nº y Tipo</td>
        <td class="hdr">Firma y Sello</td>
      </tr>
      <tr>
        <td>${escapeHTML(vars.certificadorNombre)}</td>
        <td>${escapeHTML(vars.certificadorLicString)}</td>
        <td></td>
      </tr>
    </table>
  </div>

  <!-- Segundo recuadro -->
  <div class="box box-bottom">
    <div class="header-grid">
      <div>
        <table class="sheet">
          <tr><td><strong>Matrícula:</strong> ${escapeHTML(vars.matricula)}</td></tr>
          <tr><td><strong>Marca:</strong> ${escapeHTML(vars.marca)}</td></tr>
          <tr><td><strong>Modelo:</strong> ${escapeHTML(vars.modelo)}</td></tr>
          <tr><td><strong>Serial:</strong> ${escapeHTML(vars.serial)}</td></tr>
        </table>
      </div>
      <div class="center">
        ${logoData ? `<img src="${logoData}" alt="logo">` : ''}
        <div class="title">${escapeHTML(vars.empresaTitulo)}</div>
        <div class="address">${escapeHTML(vars.empresaLinea1)}<br>${escapeHTML(vars.empresaLinea2)}</div>
        <div class="cert-title">CERTIFICADO DE CONFORMIDAD DE MANTENIMIENTO</div>
      </div>
      <div>
        <table class="sheet">
          <tr><td><strong>Fecha:</strong> </td></tr>
          <tr><td><strong>Lugar:</strong> ${escapeHTML(vars.lugar)}</td></tr>
          <tr><td><strong>Horas TT:</strong> ${escapeHTML(vars.horasTT)}</td></tr>
          <tr><td><strong>OT:</strong> ${escapeHTML(String(vars.ot))}</td></tr>
        </table>
      </div>
    </div>

    <div class="motor-helice-grid">
      <table class="sheet">
        <tr><td colspan="2"><strong>Motor</strong></td></tr>
        <tr><td><strong>Marca:</strong> ${escapeHTML(vars.motorMarca)}</td><td><strong>TSO:</strong> ${escapeHTML(vars.motorTSO)}</td></tr>
        <tr><td><strong>Modelo:</strong> ${escapeHTML(vars.motorModelo)}</td><td><strong>TBO:</strong> ${escapeHTML(vars.motorTBO)}</td></tr>
        <tr><td><strong>Serial:</strong> ${escapeHTML(vars.motorSerial)}</td><td></td></tr>
      </table>
      <table class="sheet">
        <tr><td colspan="2"><strong>Hélice</strong></td></tr>
        <tr><td><strong>Marca:</strong></td><td><strong>TSO:</strong></td></tr>
        <tr><td><strong>Modelo:</strong></td><td><strong>TBO:</strong></td></tr>
        <tr><td><strong>Serial:</strong></td><td></td></tr>
      </table>
    </div>

    <div class="trabajos">
      <p style="font-weight:bold; text-align:center;">Al motor se le efectuaron los trabajos que a continuación se describen:</p>
      <div style="height:15mm;"></div>
    </div>

    <table class="cert-table">
      <tr><td colspan="3">${escapeHTML(vars.textoCertificacion)}</td></tr>
      <tr>
        <td class="hdr">Nombre Certificador</td>
        <td class="hdr">Lic. Nº y Tipo</td>
        <td class="hdr">Firma y Sello</td>
      </tr>
      <tr>
        <td>${escapeHTML(vars.certificadorNombre)}</td>
        <td>${escapeHTML(vars.certificadorLicString)}</td>
        <td></td>
      </tr>
    </table>
  </div>
</div>
</body>
</html>`;

    // Generación del PDF con Puppeteer
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' }
    });
    await page.close();
    await browser.close();

    const filename = `Conformidad-Mantenimiento-${orden.numero ?? orden.id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Error al generar PDF de Conformidad:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Error al generar el PDF' });
    }
  }
};
*/


















/*

import prisma from '../lib/prisma.js';
import path from 'path';
import fs from 'fs';
import puppeteer from 'puppeteer';

export const descargarConformidadPDF = async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);

  // Helpers
  const fmtUY = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt)) return '';
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yyyy = dt.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const escapeHTML = (s) =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const normalizeSnap = (val) => {
    if (!val) return null;
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch { return null; }
    }
    return val;
  };

  // Certificador: empleadosAsignados -> registrosTrabajo -> esCertificador
  const pickCertificadorEmpleado = (orden) => {
    const ea = (orden.empleadosAsignados || []).find(
      (e) => String(e?.rol || '').toUpperCase() === 'CERTIFICADOR'
    );
    if (ea?.empleado) return ea.empleado;

    const rt = (orden.registrosTrabajo || []).find(
      (r) => String(r?.rol || '').toUpperCase() === 'CERTIFICADOR'
    );
    if (rt?.empleado) return rt.empleado;

    const ea2 = (orden.empleadosAsignados || []).find((e) => e?.empleado?.esCertificador);
    return ea2?.empleado ?? null;
  };

  try {
    if (!id) return res.status(400).json({ error: 'ID inválido' });

    const orden = await prisma.ordenTrabajo.findUnique({
      where: { id },
      include: {
        empleadosAsignados: { include: { empleado: true } },
        registrosTrabajo: { include: { empleado: true } },
        avion: true,
        componente: true
      }
    });
    if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });

    // Logo embebido (si existe en "public/celcol-logo.jpeg")
    let logoData = '';
    try {
      const logoPath = path.join(process.cwd(), 'public', 'celcol-logo.jpeg');
      if (fs.existsSync(logoPath)) {
        const buf = fs.readFileSync(logoPath);
        logoData = `data:image/jpeg;base64,${buf.toString('base64')}`;
      }
    } catch {}

    const body = req.method === 'POST' ? (req.body || {}) : {};
    const q = req.query || {};

    // Snapshot de avión
    const avSnap = normalizeSnap(orden.datosAvionSnapshot) ?? {};
    const componentesSnap = Array.isArray(avSnap.componentes) ? avSnap.componentes : [];

    // TSN del avión → "Horas TT"
    const avionTSN = avSnap.TSN ?? '';

    // Motor (snapshot, tipo === 'motor')
    const motor = componentesSnap.find(
      (c) => (c?.tipo ?? '').toString().toLowerCase() === 'motor'
    ) || null;

    // Certificador (empleado)
    const certEmp = pickCertificadorEmpleado(orden);

    // Avión de DB (solo como fallback de encabezado)
    const avion = orden.avion ?? null;

    // Licencia + vencimiento
    const licNumero = certEmp?.numeroLicencia ? `MMA. ${certEmp.numeroLicencia}` : '';
    const licVenc   = certEmp?.vencimientoLicencia ? fmtUY(certEmp.vencimientoLicencia) : '';
    const licFull   = licNumero ? `${licNumero}${licVenc ? ` - Venc.: ${licVenc}` : ''}` : (licVenc ? `Venc.: ${licVenc}` : '');

    const vars = {
      // Encabezado
      fechaEmision: q.fechaEmision ?? body.fechaEmision ?? fmtUY(new Date()),
      empresaTitulo: q.empresaTitulo ?? body.empresaTitulo ?? 'CELCOL AVIATION',
      empresaLinea1: q.empresaLinea1 ?? body.empresaLinea1 ?? 'Camino Melilla Aeropuerto Ángel Adami',
      empresaLinea2: q.empresaLinea2 ?? body.empresaLinea2 ?? 'Sector CAMES – Hangar Nº 2 · OMA IR-158',

      // Avión (prioridad snapshot; fallback a DB si faltara algo)
      matricula: q.matricula ?? body.matricula ?? (avSnap.matricula ?? avion?.matricula ?? ''),
      marca:     q.marca     ?? body.marca     ?? (avSnap.marca     ?? avion?.marca     ?? ''),
      modelo:    q.modelo    ?? body.modelo    ?? (avSnap.modelo    ?? avion?.modelo    ?? ''),
      serial:    q.serial    ?? body.serial    ?? (avSnap.numeroSerie ?? avion?.numeroSerie ?? ''),

      // Tabla derecha (ambos recuadros)
      fecha:  '',
      lugar:  q.lugar   ?? body.lugar   ?? '',
      horasTT: String(q.horasTT ?? body.horasTT ?? avionTSN ?? ''),
      ot:     q.ot      ?? body.ot      ?? (orden.numero ?? orden.id),

      // Certificación
      textoCertificacion:
        q.textoCertificacion ??
        body.textoCertificacion ??
        'Certifico que esta aeronave ha sido inspeccionada y los trabajos arriba descritos han sido completados de manera satisfactoria, por lo que se encuentra en condiciones seguras y aeronavegable por concepto de los trabajos realizados. Los detalles de estos mantenimientos se encuentran bajo la Orden de Trabajo arriba descrita.',

      certificadorNombre:
        q.certificadorNombre ??
        body.certificadorNombre ??
        [certEmp?.nombre, certEmp?.apellido].filter(Boolean).join(' '),

      certificadorLicString:
        q.certificadorLicString ??
        body.certificadorLicString ??
        licFull,

      // Motor (snapshot) — TBO solo la variable
      motorMarca:  q.motorMarca  ?? body.motorMarca  ?? (motor?.marca       ?? ''),
      motorModelo: q.motorModelo ?? body.motorModelo ?? (motor?.modelo      ?? ''),
      motorSerial: q.motorSerial ?? body.motorSerial ?? (motor?.numeroSerie ?? ''),
      motorTSO:    q.motorTSO    ?? body.motorTSO    ?? (motor?.TSO         ?? motor?.tso ?? ''),
      motorTBO:    q.motorTBO    ?? body.motorTBO    ?? (motor?.TBO         ?? motor?.tbo ?? '')
    };

    // HTML del PDF
    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>Conformidad de Mantenimiento</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 9pt; color: #000; background: #fff; line-height: 1.15; }

  // Fecha fuera del recuadro (arriba) * /
  .fecha-emision { position: fixed; top: 3mm; right: 12mm; font-size: 9pt; }

  // Bajar el contenido para que no se encime con la fecha fija * / 
  .wrap { display: flex; flex-direction: column; gap: 4mm; margin-top: 10mm; }

  .box { border: 2pt double #000; padding: 3mm; }
  // Primer recuadro más bajo para evitar hueco innecesario * /
  .box-top { min-height: 100mm; }
  .box-bottom { min-height: 110mm; }

  .header-grid {
    display: grid;
    grid-template-columns: 1fr 2fr 1fr;
    align-items: flex-start;
    gap: 3mm;
  }
  .center {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
  }
  .center img { height: 18mm; margin-bottom: 1mm; }
  .title { font-weight: bold; font-size: 11pt; }
  .address { font-size: 8pt; line-height: 1.2; }
  .cert-title { font-size: 9.5pt; font-weight: bold; margin-top: 1mm; white-space: nowrap; }

  .sheet { width: 100%; border-collapse: collapse; font-size: 7.5pt; }
  .sheet td { border: 0.5pt solid #000; padding: 1mm; vertical-align: top; }

  .motor-helice-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3mm;
    margin-top: 3mm;
  }

  .trabajos { margin-top: 3mm; font-size: 8pt; }

  .cert-table { width: 100%; border-collapse: collapse; margin-top: 3mm; font-size: 8pt; }
  .cert-table td { border: 0.5pt solid #000; padding: 1mm; vertical-align: top; }
  .cert-table .hdr { font-weight: bold; text-align: center; }
  .cert-table tr:last-child td { height: 8mm; }
</style>
</head>
<body>
<div class="fecha-emision">Fecha: ${escapeHTML(vars.fechaEmision)}</div>

<div class="wrap">
  <!-- Primer recuadro -->
  <div class="box box-top">
    <div class="header-grid">
      <div>
        <table class="sheet">
          <tr><td><strong>Matrícula:</strong> ${escapeHTML(vars.matricula)}</td></tr>
          <tr><td><strong>Marca:</strong> ${escapeHTML(vars.marca)}</td></tr>
          <tr><td><strong>Modelo:</strong> ${escapeHTML(vars.modelo)}</td></tr>
          <tr><td><strong>Serial:</strong> ${escapeHTML(vars.serial)}</td></tr>
        </table>
      </div>
      <div class="center">
        ${logoData ? `<img src="${logoData}" alt="logo">` : ''}
        <div class="title">${escapeHTML(vars.empresaTitulo)}</div>
        <div class="address">${escapeHTML(vars.empresaLinea1)}<br>${escapeHTML(vars.empresaLinea2)}</div>
        <div class="cert-title">CERTIFICADO DE CONFORMIDAD DE MANTENIMIENTO</div>
      </div>
      <div>
        <table class="sheet">
          <tr><td><strong>Fecha:</strong> </td></tr>
          <tr><td><strong>Lugar:</strong> ${escapeHTML(vars.lugar)}</td></tr>
          <tr><td><strong>Horas TT:</strong> ${escapeHTML(vars.horasTT)}</td></tr>
          <tr><td><strong>OT:</strong> ${escapeHTML(String(vars.ot))}</td></tr>
        </table>
      </div>
    </div>

    <div class="trabajos">
      <p style="font-weight:bold; text-align:center;">A la aeronave se le efectuaron los trabajos que a continuación se describen:</p>
      <div style="height:15mm;"></div>
    </div>

    <table class="cert-table">
      <tr><td colspan="3">${escapeHTML(vars.textoCertificacion)}</td></tr>
      <tr>
        <td class="hdr">Nombre Certificador</td>
        <td class="hdr">Lic. Nº y Tipo</td>
        <td class="hdr">Firma y Sello</td>
      </tr>
      <tr>
        <td>${escapeHTML(vars.certificadorNombre)}</td>
        <td>MMA - ${escapeHTML(vars.certificadorLicString)}</td>
        <td></td>
      </tr>
    </table>
  </div>

  <!-- Segundo recuadro -->
  <div class="box box-bottom">
    <div class="header-grid">
      <div>
        <table class="sheet">
          <tr><td><strong>Matrícula:</strong> ${escapeHTML(vars.matricula)}</td></tr>
          <tr><td><strong>Marca:</strong> ${escapeHTML(vars.marca)}</td></tr>
          <tr><td><strong>Modelo:</strong> ${escapeHTML(vars.modelo)}</td></tr>
          <tr><td><strong>Serial:</strong> ${escapeHTML(vars.serial)}</td></tr>
        </table>
      </div>
      <div class="center">
        ${logoData ? `<img src="${logoData}" alt="logo">` : ''}
        <div class="title">${escapeHTML(vars.empresaTitulo)}</div>
        <div class="address">${escapeHTML(vars.empresaLinea1)}<br>${escapeHTML(vars.empresaLinea2)}</div>
        <div class="cert-title">CERTIFICADO DE CONFORMIDAD DE MANTENIMIENTO</div>
      </div>
      <div>
        <table class="sheet">
          <tr><td><strong>Fecha:</strong> </td></tr>
          <tr><td><strong>Lugar:</strong> ${escapeHTML(vars.lugar)}</td></tr>
          <tr><td><strong>Horas TT:</strong> ${escapeHTML(vars.horasTT)}</td></tr>
          <tr><td><strong>OT:</strong> ${escapeHTML(String(vars.ot))}</td></tr>
        </table>
      </div>
    </div>

    <div class="motor-helice-grid">
      <table class="sheet">
        <tr><td colspan="2"><strong>Motor</strong></td></tr>
        <tr><td><strong>Marca:</strong> ${escapeHTML(vars.motorMarca)}</td><td><strong>TSO:</strong> ${escapeHTML(vars.motorTSO)}</td></tr>
        <tr><td><strong>Modelo:</strong> ${escapeHTML(vars.motorModelo)}</td><td><strong>TBO:</strong> ${escapeHTML(vars.motorTBO)}</td></tr>
        <tr><td><strong>Serial:</strong> ${escapeHTML(vars.motorSerial)}</td><td></td></tr>
      </table>
      <table class="sheet">
        <tr><td colspan="2"><strong>Hélice</strong></td></tr>
        <tr><td><strong>Marca:</strong></td><td><strong>TSO:</strong></td></tr>
        <tr><td><strong>Modelo:</strong></td><td><strong>TBO:</strong></td></tr>
        <tr><td><strong>Serial:</strong></td><td></td></tr>
      </table>
    </div>

    <div class="trabajos">
      <p style="font-weight:bold; text-align:center;">Al motor se le efectuaron los trabajos que a continuación se describen:</p>
      <div style="height:15mm;"></div>
    </div>

    <table class="cert-table">
      <tr><td colspan="3">${escapeHTML(vars.textoCertificacion)}</td></tr>
      <tr>
        <td class="hdr">Nombre Certificador</td>
        <td class="hdr">Lic. Nº y Tipo</td>
        <td class="hdr">Firma y Sello</td>
      </tr>
      <tr>
        <td>${escapeHTML(vars.certificadorNombre)}</td>
        <td>MMA - ${escapeHTML(vars.certificadorLicString)}</td>
        <td></td>
      </tr>
    </table>
  </div>
</div>
</body>
</html>`;

    // Generación del PDF con Puppeteer
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' }
    });
    await page.close();
    await browser.close();

    const filename = `Conformidad-Mantenimiento-${orden.numero ?? orden.id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Error al generar PDF de Conformidad:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Error al generar el PDF' });
    }
  }
};
*/










import prisma from '../lib/prisma.js';
import path from 'path';
import fs from 'fs';
import puppeteer from 'puppeteer';

export const descargarConformidadPDF = async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);

  // Helpers
  const fmtUY = (d) => {
    if (!d) return '';
    // admite "YYYY-MM-DD" o Date-like
    const isStr = typeof d === 'string';
    const dt = isStr && /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(d + 'T00:00:00') : new Date(d);
    if (isNaN(dt)) return '';
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yyyy = dt.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const escapeHTML = (s) =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const normalizeSnap = (val) => {
    if (!val) return null;
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch { return null; }
    }
    return val;
  };

  const pickCertificadorEmpleado = (orden) => {
    const ea = (orden.empleadosAsignados || []).find(
      (e) => String(e?.rol || '').toUpperCase() === 'CERTIFICADOR'
    );
    if (ea?.empleado) return ea.empleado;

    const rt = (orden.registrosTrabajo || []).find(
      (r) => String(r?.rol || '').toUpperCase() === 'CERTIFICADOR'
    );
    if (rt?.empleado) return rt.empleado;

    const ea2 = (orden.empleadosAsignados || []).find((e) => e?.empleado?.esCertificador);
    return ea2?.empleado ?? null;
  };

  try {
    if (!id) return res.status(400).json({ error: 'ID inválido' });

    const orden = await prisma.ordenTrabajo.findUnique({
      where: { id },
      include: {
        empleadosAsignados: { include: { empleado: true } },
        registrosTrabajo: { include: { empleado: true } },
        avion: true,
        componente: true
      }
    });
    if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });

    // Logo embebido (si existe en "public/celcol-logo.jpeg")
    let logoData = '';
    try {
      const logoPath = path.join(process.cwd(), 'public', 'celcol-logo.jpeg');
      if (fs.existsSync(logoPath)) {
        const buf = fs.readFileSync(logoPath);
        logoData = `data:image/jpeg;base64,${buf.toString('base64')}`;
      }
    } catch {}

    // ⬇️ AHORA: preferimos POST JSON; GET queda como fallback
    const body = req.method === 'POST' ? (req.body || {}) : {};
    const q = req.query || {};

    // Snapshot de avión
    const avSnap = normalizeSnap(orden.datosAvionSnapshot) ?? {};
    const componentesSnap = Array.isArray(avSnap.componentes) ? avSnap.componentes : [];

    // TSN del avión → "Horas TT"
    const avionTSN = avSnap.TSN ?? '';

    // Motor (snapshot, tipo === 'motor')
    const motorSnap = componentesSnap.find(
      (c) => (c?.tipo ?? '').toString().toLowerCase() === 'motor'
    ) || null;

    // Certificador (empleado)
    const certEmp = pickCertificadorEmpleado(orden);

    // Avión DB (fallback)
    const avion = orden.avion ?? null;

    // Licencia + vencimiento
    const licNumero = certEmp?.numeroLicencia ? `MMA. ${certEmp.numeroLicencia}` : '';
    const licVenc   = certEmp?.vencimientoLicencia ? fmtUY(certEmp.vencimientoLicencia) : '';
    const licFull   = licNumero ? `${licNumero}${licVenc ? ` - Venc.: ${licVenc}` : ''}` : (licVenc ? `Venc.: ${licVenc}` : '');

    // ⬇️ NUEVAS VARIABLES desde el modal (POST JSON) o query (GET)
    const fechaInput   = body.fecha ?? q.fecha ?? body.fechaEmision ?? q.fechaEmision ?? ''; // "YYYY-MM-DD" preferido
    const lugarInput   = body.lugar ?? q.lugar ?? '';
    const aeronaveTxt  = body.aeronave ?? q.aeronave ?? ''; // se imprime debajo del primer recuadro
    const motorTxt     = body.motor ?? q.motor ?? '';       // se imprime en el recuadro inferior

    const vars = {
      // Encabezado
      fechaEmision: fmtUY(fechaInput) || fmtUY(new Date()),
      empresaTitulo: q.empresaTitulo ?? body.empresaTitulo ?? 'CELCOL AVIATION',
      empresaLinea1: q.empresaLinea1 ?? body.empresaLinea1 ?? 'Camino Melilla Aeropuerto Ángel Adami',
      empresaLinea2: q.empresaLinea2 ?? body.empresaLinea2 ?? 'Sector CAMES – Hangar Nº 2 · OMA IR-158',

      // Avión (prioridad snapshot; fallback DB)
      matricula: q.matricula ?? body.matricula ?? (avSnap.matricula ?? avion?.matricula ?? ''),
      marca:     q.marca     ?? body.marca     ?? (avSnap.marca     ?? avion?.marca     ?? ''),
      modelo:    q.modelo    ?? body.modelo    ?? (avSnap.modelo    ?? avion?.modelo    ?? ''),
      serial:    q.serial    ?? body.serial    ?? (avSnap.numeroSerie ?? avion?.numeroSerie ?? ''),

      // Tabla derecha
      lugar:  lugarInput,
      horasTT: String(q.horasTT ?? body.horasTT ?? avionTSN ?? ''),
      ot:     q.ot      ?? body.ot      ?? (orden.numero ?? orden.id),

      // Certificación
      textoCertificacion:
        q.textoCertificacion ??
        body.textoCertificacion ??
        'Certifico que esta aeronave ha sido inspeccionada y los trabajos arriba descritos han sido completados de manera satisfactoria, por lo que se encuentra en condiciones seguras y aeronavegable por concepto de los trabajos realizados. Los detalles de estos mantenimientos se encuentran bajo la Orden de Trabajo arriba descrita.',

      certificadorNombre:
        q.certificadorNombre ??
        body.certificadorNombre ??
        [certEmp?.nombre, certEmp?.apellido].filter(Boolean).join(' '),

      certificadorLicString:
        q.certificadorLicString ??
        body.certificadorLicString ??
        licFull,

      // Motor snapshot (para la tablita de motor)
      motorMarca:  q.motorMarca  ?? body.motorMarca  ?? (motorSnap?.marca       ?? ''),
      motorModelo: q.motorModelo ?? body.motorModelo ?? (motorSnap?.modelo      ?? ''),
      motorSerial: q.motorSerial ?? body.motorSerial ?? (motorSnap?.numeroSerie ?? ''),
      motorTSO:    q.motorTSO    ?? body.motorTSO    ?? (motorSnap?.TSO         ?? motorSnap?.tso ?? ''),
      motorTBO:    q.motorTBO    ?? body.motorTBO    ?? (motorSnap?.TBO         ?? motorSnap?.tbo ?? ''),

      // ⬇️ Campos de texto libre para imprimir donde pediste
      aeronaveTextoLibre: aeronaveTxt,
      motorTextoLibre: motorTxt,
    };

    // HTML
    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>Conformidad de Mantenimiento</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 9pt; color: #000; background: #fff; line-height: 1.15; }

  /* Fecha fuera del recuadro (arriba) */
  .fecha-emision { position: fixed; top: 3mm; right: 12mm; font-size: 9pt; }

  .wrap { display: flex; flex-direction: column; gap: 4mm; margin-top: 10mm; }

  .box { border: 2pt double #000; padding: 3mm; }
  .box-top { min-height: 100mm; }
  .box-bottom { min-height: 110mm; }

  .header-grid {
    display: grid;
    grid-template-columns: 1fr 2fr 1fr;
    align-items: flex-start;
    gap: 3mm;
  }
  .center {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
  }
  .center img { height: 18mm; margin-bottom: 1mm; }
  .title { font-weight: bold; font-size: 11pt; }
  .address { font-size: 8pt; line-height: 1.2; }
  .cert-title { font-size: 9.5pt; font-weight: bold; margin-top: 1mm; white-space: nowrap; }

  .sheet { width: 100%; border-collapse: collapse; font-size: 7.5pt; }
  .sheet td { border: 0.5pt solid #000; padding: 1mm; vertical-align: top; }

  .motor-helice-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3mm;
    margin-top: 3mm;
  }

  .trabajos { margin-top: 3mm; font-size: 8pt; }
  .texto-libre { margin-top: 2mm; min-height: 15mm; white-space: pre-wrap; }

  .cert-table { width: 100%; border-collapse: collapse; margin-top: 3mm; font-size: 8pt; }
  .cert-table td { border: 0.5pt solid #000; padding: 1mm; vertical-align: top; }
  .cert-table .hdr { font-weight: bold; text-align: center; }
  .cert-table tr:last-child td { height: 8mm; }
</style>
</head>
<body>
<div class="fecha-emision">Fecha: ${escapeHTML(vars.fechaEmision)}</div>

<div class="wrap">
  <!-- Primer recuadro -->
  <div class="box box-top">
    <div class="header-grid">
      <div>
        <table class="sheet">
          <tr><td><strong>Matrícula:</strong> ${escapeHTML(vars.matricula)}</td></tr>
          <tr><td><strong>Marca:</strong> ${escapeHTML(vars.marca)}</td></tr>
          <tr><td><strong>Modelo:</strong> ${escapeHTML(vars.modelo)}</td></tr>
          <tr><td><strong>Serial:</strong> ${escapeHTML(vars.serial)}</td></tr>
        </table>
      </div>
      <div class="center">
        ${logoData ? `<img src="${logoData}" alt="logo">` : ''}
        <div class="title">${escapeHTML(vars.empresaTitulo)}</div>
        <div class="address">${escapeHTML(vars.empresaLinea1)}<br>${escapeHTML(vars.empresaLinea2)}</div>
        <div class="cert-title">CERTIFICADO DE CONFORMIDAD DE MANTENIMIENTO</div>
      </div>
      <div>
        <table class="sheet">
          <tr><td><strong>Fecha:</strong> </td></tr>
          <tr><td><strong>Lugar:</strong> ${escapeHTML(vars.lugar)}</td></tr>
          <tr><td><strong>Horas TT:</strong> ${escapeHTML(vars.horasTT)}</td></tr>
          <tr><td><strong>OT:</strong> ${escapeHTML(String(vars.ot))}</td></tr>
        </table>
      </div>
    </div>

    <div class="trabajos">
      <p style="font-weight:bold; text-align:center;">A la aeronave se le efectuaron los trabajos que a continuación se describen:</p>
      <!-- ⬇️ TEXTO LIBRE AERONAVE -->
      <div class="texto-libre">${escapeHTML(vars.aeronaveTextoLibre)}</div>
    </div>

    <table class="cert-table">
      <tr><td colspan="3">${escapeHTML(vars.textoCertificacion)}</td></tr>
      <tr>
        <td class="hdr">Nombre Certificador</td>
        <td class="hdr">Lic. Nº y Tipo</td>
        <td class="hdr">Firma y Sello</td>
      </tr>
      <tr>
        <td>${escapeHTML(vars.certificadorNombre)}</td>
        <td>MMA - ${escapeHTML(vars.certificadorLicString)}</td>
        <td></td>
      </tr>
    </table>
  </div>

  <!-- Segundo recuadro -->
  <div class="box box-bottom">
    <div class="header-grid">
      <div>
        <table class="sheet">
          <tr><td><strong>Matrícula:</strong> ${escapeHTML(vars.matricula)}</td></tr>
          <tr><td><strong>Marca:</strong> ${escapeHTML(vars.marca)}</td></tr>
          <tr><td><strong>Modelo:</strong> ${escapeHTML(vars.modelo)}</td></tr>
          <tr><td><strong>Serial:</strong> ${escapeHTML(vars.serial)}</td></tr>
        </table>
      </div>
      <div class="center">
        ${logoData ? `<img src="${logoData}" alt="logo">` : ''}
        <div class="title">${escapeHTML(vars.empresaTitulo)}</div>
        <div class="address">${escapeHTML(vars.empresaLinea1)}<br>${escapeHTML(vars.empresaLinea2)}</div>
        <div class="cert-title">CERTIFICADO DE CONFORMIDAD DE MANTENIMIENTO</div>
      </div>
      <div>
        <table class="sheet">
          <tr><td><strong>Fecha:</strong> </td></tr>
          <tr><td><strong>Lugar:</strong> ${escapeHTML(vars.lugar)}</td></tr>
          <tr><td><strong>Horas TT:</strong> ${escapeHTML(vars.horasTT)}</td></tr>
          <tr><td><strong>OT:</strong> ${escapeHTML(String(vars.ot))}</td></tr>
        </table>
      </div>
    </div>

    <div class="motor-helice-grid">
      <table class="sheet">
        <tr><td colspan="2"><strong>Motor</strong></td></tr>
        <tr><td><strong>Marca:</strong> ${escapeHTML(vars.motorMarca)}</td><td><strong>TSO:</strong> ${escapeHTML(vars.motorTSO)}</td></tr>
        <tr><td><strong>Modelo:</strong> ${escapeHTML(vars.motorModelo)}</td><td><strong>TBO:</strong> ${escapeHTML(vars.motorTBO)}</td></tr>
        <tr><td><strong>Serial:</strong> ${escapeHTML(vars.motorSerial)}</td><td></td></tr>
      </table>
      <table class="sheet">
        <tr><td colspan="2"><strong>Hélice</strong></td></tr>
        <tr><td><strong>Marca:</strong></td><td><strong>TSO:</strong></td></tr>
        <tr><td><strong>Modelo:</strong></td><td><strong>TBO:</strong></td></tr>
        <tr><td><strong>Serial:</strong></td><td></td></tr>
      </table>
    </div>

    <div class="trabajos">
      <p style="font-weight:bold; text-align:center;">Al motor se le efectuaron los trabajos que a continuación se describen:</p>
      <!-- ⬇️ TEXTO LIBRE MOTOR -->
      <div class="texto-libre">${escapeHTML(vars.motorTextoLibre)}</div>
    </div>

    <table class="cert-table">
      <tr><td colspan="3">${escapeHTML(vars.textoCertificacion)}</td></tr>
      <tr>
        <td class="hdr">Nombre Certificador</td>
        <td class="hdr">Lic. Nº y Tipo</td>
        <td class="hdr">Firma y Sello</td>
      </tr>
      <tr>
        <td>${escapeHTML(vars.certificadorNombre)}</td>
        <td>MMA - ${escapeHTML(vars.certificadorLicString)}</td>
        <td></td>
      </tr>
    </table>
  </div>
</div>
</body>
</html>`;

    // Generación del PDF con Puppeteer
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' }
    });
    await page.close();
    await browser.close();

    const filename = `Conformidad-Mantenimiento-${orden.numero ?? orden.id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Error al generar PDF de Conformidad:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Error al generar el PDF' });
    }
  }
};

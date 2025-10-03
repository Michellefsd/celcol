// src/controllers/conformidadMantenimiento.controller.js (ESM)
/*import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import puppeteer from 'puppeteer';

const prisma = new PrismaClient();

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
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const normalizeSnap = (val) => {
    if (!val) return null;
    if (typeof val === 'string') {
      try { return JSON.parse(val) ?? null; } catch { return null; }
    }
    return val;
  };

  try {
    if (!id) return res.status(400).json({ error: 'ID inválido' });

    // Traemos SOLO lo que necesitamos (sin avion/componente) y con filtro enum sin 'mode'
    const orden = await prisma.ordenTrabajo.findUnique({
      where: { id },
      include: {
        empleadosAsignados: {
          include: { empleado: true },
          where: { rol: { in: ['CERTIFICADOR', 'TECNICO'] } }
        },
        registrosTrabajo: {
          orderBy: { fecha: 'asc' },
          include: { empleado: true }
        }
      }
    });

    if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });

    // Snapshots (EXCLUSIVO: si falta algo, queda vacío)
    const avSnap   = normalizeSnap(orden.datosAvionSnapshot);
    const compSnap = normalizeSnap(orden.datosComponenteSnapshot);
    const s = avSnap || compSnap || {};

    const matricula   = s.matricula   ?? '';
    const marca       = s.marca       ?? '';
    const modelo      = s.modelo      ?? '';
    const numeroSerie = s.numeroSerie ?? '';
    const horasTT     = s.TSN         ?? ''; // TSN desde snapshot

    // Certificador principal (desde asignaciones actuales de la OT)
    const certAsign = (orden.empleadosAsignados || [])
      .find(e => (e.rol || '').toUpperCase() === 'CERTIFICADOR');
    const certificador = certAsign?.empleado;

    const nombreCertificador = certificador
      ? `${certificador.nombre || ''} ${certificador.apellido || ''}`.trim()
      : '';

    // Tipo + Nº de licencia (según tu modelo Empleado)
    const licenciaCertificador = (() => {
      const tipos = Array.isArray(certificador?.tipoLicencia)
        ? certificador.tipoLicencia.join(', ')
        : (certificador?.tipoLicencia || '');
      const numero = certificador?.numeroLicencia || '';
      return [tipos, numero].filter(Boolean).join(' — ');
    })();

    // Descripción del trabajo (prioridad razonable)
    const descripcionTrabajo =
      orden.accionTomada ||
      orden.solicitud ||
      orden.descripcionTrabajo ||
      orden.descripcion ||
      '';

    // (Opcional) Logo embebido si existiera - no se muestra para mantener tu layout original
    let logoData = '';
    try {
      const logoPath = path.join(process.cwd(), 'public', 'celcol-logo.jpeg');
      if (fs.existsSync(logoPath)) {
        const buf = fs.readFileSync(logoPath);
        logoData = `data:image/jpeg;base64,${buf.toString('base64')}`;
      }
    } catch {}

    // HTML/CSS — respetando tu formato visual original
    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>Conformidad de Mantenimiento - OT ${escapeHTML(String(orden.numero ?? orden.id))}</title>
<style>
  @page { 
    size: A4; 
    margin: 30mm 30mm 20mm 30mm; /* 3cm izq/der, 2cm abajo, 3cm arriba * /
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { 
    font-family: Arial, Helvetica, sans-serif; 
    font-size: 11pt; 
    color: #000; 
    line-height: 1.4;
    width: 210mm;
    margin: 0 auto;
    padding: 0;
  }

  // Header //
  .header {
    text-align: center;
    margin-bottom: 12mm;
    border-bottom: 1pt solid #000;
    padding-bottom: 4mm;
  }

  .header h1 {
    font-size: 16pt;
    font-weight: bold;
    margin-bottom: 2mm;
    text-transform: uppercase;
  }

  .header .subtitle { font-size: 12pt; font-weight: bold; }

  // Información de la OMA //
  .oma-info { text-align: center; margin-bottom: 8mm; font-size: 10pt; }
  .oma-info .address { font-weight: bold; margin-bottom: 1mm; }
  .oma-info .hangar { font-style: italic; }

  // Tabla de datos de la aeronave //
  .aircraft-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10mm;
    font-size: 11pt;
  }
  .aircraft-table td {
    border: 1pt solid #000;
    padding: 3mm 2mm;
    vertical-align: top;
  }
  .aircraft-table .label { font-weight: bold; width: 25%; }
  .aircraft-table .value { width: 75%; }

  // Sección de certificado //
  .certificate-section { margin-bottom: 10mm; }
  .certificate-title {
    font-size: 14pt; font-weight: bold; text-align: center;
    margin-bottom: 6mm; text-transform: uppercase;
  }
  .work-description {
    border: 1pt solid #000; padding: 4mm; min-height: 40mm;
    margin-bottom: 6mm; font-size: 11pt; line-height: 1.6;
  }
  .certificate-text {
    margin-bottom: 8mm; font-size: 11pt; line-height: 1.6; text-align: justify;
  }

  // Tabla de certificador //
  .certifier-table {
    width: 100%; border-collapse: collapse; margin-top: 15mm; font-size: 11pt;
  }
  .certifier-table td {
    border: 1pt solid #000; padding: 3mm 2mm; vertical-align: top; text-align: center;
  }
  .certifier-table .label { font-weight: bold; width: 33.33%; }

  .signature-line {
    border-top: 1pt solid #000; margin-top: 15mm; padding-top: 2mm;
    text-align: center; font-size: 10pt;
  }

  .ca-number {
    position: absolute; top: 5mm; right: 5mm;
    font-size: 10pt; font-weight: bold;
  }

  // Utilidades //
  .text-center { text-align: center; }
  .text-bold { font-weight: bold; }
  .mb-2 { margin-bottom: 2mm; }
  .mb-4 { margin-bottom: 4mm; }
</style>
</head>
<body>

<div class="ca-number">CA-19</div>

<!-- Header (sin logo para respetar tu original) -->
<div class="header">
  <h1>CONFORMIDAD DE MANTENIMIENTO</h1>
</div>

<!-- Información de la OMA -->
<div class="oma-info">
  <div class="address">CELCOL AVIATION</div>
  <div class="hangar">Camino Melilla Aeropuerto Ángel Adami</div>
  <div class="hangar">Sector Carnes Hangar No. 2 - OMA IR-158</div>
</div>

<!-- Tabla de datos de la aeronave (solo snapshot) -->
<table class="aircraft-table">
  <tr>
    <td class="label">Matrícula:</td>
    <td class="value">${escapeHTML(matricula)}</td>
  </tr>
  <tr>
    <td class="label">Marca:</td>
    <td class="value">${escapeHTML(marca)}</td>
  </tr>
  <tr>
    <td class="label">Modelo:</td>
    <td class="value">${escapeHTML(modelo)}</td>
  </tr>
  <tr>
    <td class="label">Serial:</td>
    <td class="value">${escapeHTML(numeroSerie)}</td>
  </tr>
</table>

<!-- Información adicional -->
<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4mm; margin-bottom: 8mm; font-size: 11pt;">
  <div><span class="text-bold">Fecha:</span> ${escapeHTML(fmtUY(new Date()))}</div>
  <div><span class="text-bold">Lugar:</span> Aeropuerto Ángel Adami</div>
  <div><span class="text-bold">Horas TT:</span> ${escapeHTML(String(horasTT || ''))}</div>
  <div style="grid-column: span 3;"><span class="text-bold">OT:</span> ${escapeHTML(String(orden.numero ?? orden.id))}</div>
</div>

<!-- Certificado -->
<div class="certificate-section">
  <div class="certificate-title">CERTIFICADO DE CONFORMIDAD DE MANTENIMIENTO</div>
  <div class="work-description">
    ${escapeHTML(descripcionTrabajo).replace(/\n/g, '<br>')}
  </div>
  <div class="certificate-text">
    Certifico que esta aeronave ha sido inspeccionada y los trabajos arriba descritos, 
    han sido completados de manera satisfactoria, por lo que se encuentra en condiciones 
    seguras y aeronavegable por concepto de los trabajos realizados. Los detalles de estos 
    mantenimientos se encuentran bajo la Orden de Trabajo arriba descrita.
  </div>
</div>

<!-- Tabla del certificador -->
<table class="certifier-table">
  <tr>
    <td class="label">Nombre Certificador</td>
    <td class="label">Lic. No y Tipo</td>
    <td class="label">Firma y Sello</td>
  </tr>
  <tr>
    <td style="height: 25mm;">${escapeHTML(nombreCertificador)}</td>
    <td style="height: 25mm;">${escapeHTML(licenciaCertificador)}</td>
    <td style="height: 25mm;"></td>
  </tr>
</table>

<!-- Línea de firma adicional -->
<div class="signature-line">
  Firma del Propietario/Operador
</div>

</body>
</html>`;

    // Render PDF
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '30mm', bottom: '20mm', left: '30mm', right: '30mm' }
    });

    await page.close();
    await browser.close();

    const filename = `Conformidad-Mantenimiento-OT-${orden.numero ?? orden.id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    return res.send(pdf);

  } catch (error) {
    console.error('Error al generar PDF de Conformidad de Mantenimiento:', error);
    if (!res.headersSent) return res.status(500).json({ error: 'Error al generar el PDF' });
  }
};
*/























// src/controllers/conformidadMantenimiento.controller.js (ESM)
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import puppeteer from 'puppeteer';

const prisma = new PrismaClient();

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
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  try {
    if (!id) return res.status(400).json({ error: 'ID inválido' });

    const orden = await prisma.ordenTrabajo.findUnique({
      where: { id },
      include: {
        empleadosAsignados: { include: { empleado: true } },
        avion: true,
        componente: true
      }
    });
    if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });

    // Logo embebido
    let logoData = '';
    try {
      const logoPath = path.join(process.cwd(), 'public', 'celcol-logo.jpeg');
      if (fs.existsSync(logoPath)) {
        const buf = fs.readFileSync(logoPath);
        logoData = `data:image/jpeg;base64,${buf.toString('base64')}`;
      }
    } catch {}

    // HTML/CSS - FORMULARIO DE CONFORMIDAD
    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>Conformidad de Mantenimiento</title>
<style>
  @page { size: A4; margin: 10mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #000; line-height: 1.2; background: white; }

  /* Cabecera con número de página */
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5mm; }
  .capitulo { font-size: 9pt; }
  .pagina { font-size: 9pt; font-weight: bold; }

  /* Título principal */
  .titulo-principal { text-align: center; font-size: 14pt; font-weight: bold; margin: 3mm 0 5mm 0; }

  /* Tabla de datos de aeronave */
  .tabla-datos { width: 100%; border-collapse: collapse; margin-bottom: 5mm; }
  .tabla-datos td { border: 1pt solid #000; padding: 2mm; vertical-align: top; width: 50%; }
  .campo-label { font-weight: bold; margin-bottom: 1mm; display: block; }

  /* Información de CELCOL */
  .info-celcol { text-align: center; margin: 4mm 0; font-size: 9pt; line-height: 1.3; }

  /* Certificado */
  .certificado { text-align: center; font-size: 12pt; font-weight: bold; margin: 5mm 0; }

  /* Descripción de trabajos */
  .descripcion-trabajos { border: 1pt solid #000; padding: 3mm; min-height: 40mm; margin-bottom: 4mm; }
  .titulo-descripcion { font-weight: bold; margin-bottom: 2mm; }

  /* Texto de certificación */
  .texto-certificacion { margin-bottom: 8mm; line-height: 1.4; }

  /* Firma del certificador */
  .firma-certificador { margin-top: 10mm; }
  .fila-firmas { display: flex; justify-content: space-between; margin-bottom: 2mm; }
  .campo-firma { width: 32%; }
  .linea-firma { border-top: 1pt solid #000; padding-top: 1mm; text-align: center; font-size: 8pt; }

  /* CIS */
  .cis { text-align: center; font-weight: bold; margin: 5mm 0; }

  /* Sección duplicada para motor */
  .seccion-motor { margin-top: 15mm; }
  
  /* Footer */
  .footer { position: absolute; bottom: 10mm; left: 0; right: 0; text-align: center; font-size: 8pt; }
  .footer .mom { margin-bottom: 1mm; }
  .footer .aprobado { font-weight: bold; }

  .valor-campo { min-height: 4mm; margin-bottom: 1mm; }
</style>
</head>
<body>

<!-- Cabecera -->
<div class="header">
  <div class="capitulo">
    <div>Capítulo: 9</div>
    <div>Máster de Formatos</div>
    <div>Y formularios</div>
    <div>Quinta Edición</div>
    <div>Fecha: ${escapeHTML(fmtUY(new Date()))}</div>
  </div>
  <div class="pagina">37</div>
</div>

<!-- Título principal -->
<div class="titulo-principal">CONFORMIDAD DE MANTENIMIENTO</div>

<!-- Tabla de datos de aeronave -->
<table class="tabla-datos">
  <tr>
    <td>
      <span class="campo-label">Matrícula:</span>
      <div class="valor-campo"></div>
      <span class="campo-label">Marca:</span>
      <div class="valor-campo"></div>
      <span class="campo-label">Modelo:</span>
      <div class="valor-campo"></div>
      <span class="campo-label">Serial:</span>
      <div class="valor-campo"></div>
    </td>
    <td>
      <span class="campo-label">Fecha:</span>
      <div class="valor-campo"></div>
      <span class="campo-label">Lugar:</span>
      <div class="valor-campo"></div>
      <span class="campo-label">HorasTT:</span>
      <div class="valor-campo"></div>
      <span class="campo-label">OT:</span>
      <div class="valor-campo"></div>
    </td>
  </tr>
</table>

<!-- Información CELCOL -->
<div class="info-celcol">
  ${logoData ? `<img src="${logoData}" style="height: 15mm; margin-bottom: 2mm;">` : ''}
  <div>CELCOL AVIATION</div>
  <div>Camino Melilla Aeropuerto Ángel Adami</div>
  <div>Sector Carnes Hangar No. 2 - OMA IR-158</div>
</div>

<!-- Certificado -->
<div class="certificado">CERTIFICADO DE CONFORMIDAD DE MANTENIMIENTO</div>

<!-- Descripción de trabajos -->
<div class="descripcion-trabajos">
  <div class="titulo-descripcion">A la aeronave se le efectuaron los trabajos que a continuación se describen:</div>
  <div style="margin-top: 3mm; min-height: 35mm;">
    <!-- Aquí irán las descripciones de trabajos -->
  </div>
</div>

<!-- Texto de certificación -->
<div class="texto-certificacion">
  Certifico que esta aeronave ha sido inspeccionada y los trabajos arriba descritos, han sido completados de manera satisfactoria, por lo que se encuentra en condiciones seguras y aeronavegable por concepto de los trabajos realizados. Los detalles de estos mantenimientos se encuentran bajo la Orden de Trabajo arriba descrita.
</div>

<!-- Firma del certificador -->
<div class="firma-certificador">
  <div class="fila-firmas">
    <div class="campo-firma">
      <div class="linea-firma">Nombre Certificador:</div>
    </div>
    <div class="campo-firma">
      <div class="linea-firma">Lic. No y Tipo:</div>
    </div>
    <div class="campo-firma">
      <div class="linea-firma">Firma y Sello:</div>
    </div>
  </div>
</div>

<!-- CIS -->
<div class="cis">C.I.S.</div>

<!-- Sección duplicada para motor -->
<div class="seccion-motor">
  <!-- Tabla de datos de aeronave (duplicada) -->
  <table class="tabla-datos">
    <tr>
      <td>
        <span class="campo-label">Matrícula:</span>
        <div class="valor-campo"></div>
        <span class="campo-label">Marca:</span>
        <div class="valor-campo"></div>
        <span class="campo-label">Modelo:</span>
        <div class="valor-campo"></div>
        <span class="campo-label">Serial:</span>
        <div class="valor-campo"></div>
      </td>
      <td>
        <span class="campo-label">Fecha:</span>
        <div class="valor-campo"></div>
        <span class="campo-label">Lugar:</span>
        <div class="valor-campo"></div>
        <span class="campo-label">HorasTT:</span>
        <div class="valor-campo"></div>
        <span class="campo-label">OT:</span>
        <div class="valor-campo"></div>
      </td>
    </tr>
  </table>

  <!-- Información CELCOL (duplicada) -->
  <div class="info-celcol">
    <div>CELCOL AVIATION</div>
    <div>Camino Melilla Aeropuerto Ángel Adami</div>
    <div>Sector Carnes Hangar No. 2 - OMA IR-158</div>
  </div>

  <!-- Certificado (duplicado) -->
  <div class="certificado">CERTIFICADO DE CONFORMIDAD DE MANTENIMIENTO</div>

  <!-- Descripción de trabajos para motor -->
  <div class="descripcion-trabajos">
    <div class="titulo-descripcion">Al motor se le efectuaron los trabajos que a continuación se describen:</div>
    <div style="margin-top: 3mm; min-height: 35mm;">
      <!-- Aquí irán las descripciones de trabajos del motor -->
    </div>
  </div>

  <!-- Texto de certificación (duplicado) -->
  <div class="texto-certificacion">
    Certifico que esta aeronave ha sido inspeccionada y los trabajos arriba descritos, han sido completados de manera satisfactoria, por lo que se encuentra en condiciones seguras y aeronavegable por concepto de los trabajos realizados. Los detalles de estos mantenimientos se encuentran bajo la Orden de Trabajo arriba descrita.
  </div>

  <!-- Firma del certificador (duplicada) -->
  <div class="firma-certificador">
    <div class="fila-firmas">
      <div class="campo-firma">
        <div class="linea-firma">Nombre Certificador:</div>
      </div>
      <div class="campo-firma">
        <div class="linea-firma">Lic. No y Tipo:</div>
      </div>
      <div class="campo-firma">
        <div class="linea-firma">Firma y Sello:</div>
      </div>
    </div>
  </div>

  <!-- CIS (duplicado) -->
  <div class="cis">C.I.S.</div>
</div>

<!-- Footer -->
<div class="footer">
  <div class="mom">Manual de la Organización de Mantenimiento – MOM</div>
  <div class="aprobado">Aprobado Por: CELCOL AVIATION</div>
</div>

</body>
</html>`;

    // Render
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

    await page.close();
    await browser.close();

    const filename = `Conformidad-Mantenimiento-${orden.numero ?? orden.id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    return res.send(pdf);
  } catch (error) {
    console.error('Error al generar PDF de Conformidad:', error);
    if (!res.headersSent) return res.status(500).json({ error: 'Error al generar el PDF' });
  }
};
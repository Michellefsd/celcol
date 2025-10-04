// src/controllers/conformidadMantenimiento.controller.js (ESM)
/*import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import puppeteer from 'puppeteer';

const prisma = new PrismaClient();

/**
 * Descarga el PDF de Conformidad de Mantenimiento.
 * Permite pasar variables mediante query o body (e.g. matricula, marca, modelo, lugar, certificador, etc.).
 * Si no se indican, se toman de la orden de trabajo o se dejan en blanco.
 */
/*export const descargarConformidadPDF = async (req, res) => {
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

  // Intenta elegir un certificador de los empleados asignados
  const pickCertificador = (empleadosAsignados = []) => {
    const cert = empleadosAsignados.find(
      (e) =>
        (e.rol && String(e.rol).toUpperCase().includes('CERT')) ||
        e.empleado?.esCertificador === true
    );
    return cert?.empleado ?? null;
  };

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

    // Logo embebido (si existe en public/)
    let logoData = '';
    try {
      const logoPath = path.join(process.cwd(), 'public', 'celcol-logo.jpeg');
      if (fs.existsSync(logoPath)) {
        const buf = fs.readFileSync(logoPath);
        logoData = `data:image/jpeg;base64,${buf.toString('base64')}`;
      }
    } catch {
      // Ignorar error de lectura del logo //
    }

    // Combinar variables de query, body, orden y defaults
    const body = req.method === 'POST' ? req.body || {} : {};
    const q = req.query || {};
    const avion = orden.avion ?? null;
    const comp = orden.componente ?? null;
    const cert = pickCertificador(orden.empleadosAsignados);

    const vars = {
      fechaEmision: q.fechaEmision ?? body.fechaEmision ?? fmtUY(new Date()),
      empresaTitulo: q.empresaTitulo ?? body.empresaTitulo ?? 'CELCOL AVIATION',
      empresaLinea1: q.empresaLinea1 ?? body.empresaLinea1 ?? 'Camino Melilla Aeropuerto Ángel Adami',
      empresaLinea2: q.empresaLinea2 ?? body.empresaLinea2 ?? 'Sector CAMES – Hangar Nº 2 · OMA IR-158',

      matricula: q.matricula ?? body.matricula ?? (avion?.matricula ?? ''),
      marca: q.marca ?? body.marca ?? (avion?.marca ?? comp?.marca ?? ''),
      modelo: q.modelo ?? body.modelo ?? (avion?.modelo ?? comp?.modelo ?? ''),
      serial: q.serial ?? body.serial ?? (avion?.numeroSerie ?? comp?.numeroSerie ?? ''),

      fecha: q.fecha ?? body.fecha ?? fmtUY(new Date()),
      lugar: q.lugar ?? body.lugar ?? '',
      horasTT: q.horasTT ?? body.horasTT ?? '',
      ot: q.ot ?? body.ot ?? (orden.numero ?? orden.id),

      textoCertificacion:
        q.textoCertificacion ??
        body.textoCertificacion ??
        'Certifico que esta aeronave ha sido inspeccionada y los trabajos arriba descritos han sido completados de manera satisfactoria, por lo que se encuentra en condiciones seguras y aeronavegable por concepto de los trabajos realizados. Los detalles de estos mantenimientos se encuentran bajo la Orden de Trabajo arriba descrita.',

      certificadorNombre:
        q.certificadorNombre ??
        body.certificadorNombre ??
        [cert?.nombre, cert?.apellido].filter(Boolean).join(' '),
      certificadorLic:
        q.certificadorLic ?? body.certificadorLic ?? (cert?.numeroLicencia ?? ''),
      certificadorTipo:
        q.certificadorTipo ??
        body.certificadorTipo ??
        (Array.isArray(cert?.tipoLicencia) && cert.tipoLicencia.length
          ? cert.tipoLicencia.join(', ')
          : '')
    };

    // Plantilla HTML/CSS con recuadros alineados y bordes dobles
    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>Conformidad de Mantenimiento</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 9pt; color: #000; background: #fff; line-height: 1.15; }

  .fecha-emision { position: absolute; top: 0; right: 0; font-size: 9pt; }

  .wrap { display: flex; flex-direction: column; gap: 4mm; }

  // Recuadros principales //
  .box { border: 2pt double #000; padding: 3mm; }
  .box-top { min-height: 100mm; }
  .box-bottom { min-height: 120mm; }

  // Cabecera con tablas a la misma altura que el logo y textos //
  .header-grid {
    display: grid;
    grid-template-columns: 1fr 1.5fr 1fr;
    gap: 3mm;
    align-items: flex-start;
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
  .cert-title { font-weight: bold; font-size: 9.5pt; margin-top: 1mm; }

  .sheet { width: 100%; border-collapse: collapse; font-size: 7.5pt; }
  .sheet td { border: 0.5pt solid #000; padding: 1mm; vertical-align: top; }

  // Bloque de descripción de trabajos (3 líneas) //
  .trabajos { margin-top: 3mm; font-size: 8pt; }
  .trabajo-label { margin-bottom: 1mm; }
  .linea { border-bottom: 0.4pt solid #000; height: 5mm; margin-bottom: 1mm; }

  // Tabla de certificación //
  .cert-table { width: 100%; border-collapse: collapse; margin-top: 3mm; font-size: 8pt; }
  .cert-table td { border: 0.5pt solid #000; padding: 1mm; vertical-align: top; }
  .cert-table .hdr { font-weight: bold; text-align: center; }
</style>
</head>
<body>
<div class="fecha-emision">Fecha: ${escapeHTML(vars.fechaEmision)}</div>
<div class="wrap">
  <!-- PRIMER RECUADRO -->
  <div class="box box-top">
    <div class="header-grid">
      <!-- Tabla izquierda -->
      <div>
        <table class="sheet">
          <tr><td><strong>Matrícula:</strong> ${escapeHTML(vars.matricula)}</td></tr>
          <tr><td><strong>Marca:</strong> ${escapeHTML(vars.marca)}</td></tr>
          <tr><td><strong>Modelo:</strong> ${escapeHTML(vars.modelo)}</td></tr>
          <tr><td><strong>Serial:</strong> ${escapeHTML(vars.serial)}</td></tr>
        </table>
      </div>
      <!-- Logo y textos centrados -->
      <div class="center">
        ${logoData ? `<img src="${logoData}" alt="logo">` : ''}
        <div class="title">${escapeHTML(vars.empresaTitulo)}</div>
        <div class="address">${escapeHTML(vars.empresaLinea1)}<br>${escapeHTML(vars.empresaLinea2)}</div>
        <div class="cert-title">CERTIFICADO DE CONFORMIDAD DE MANTENIMIENTO</div>
      </div>
      <!-- Tabla derecha -->
      <div>
        <table class="sheet">
          <tr><td><strong>Fecha:</strong> ${escapeHTML(vars.fecha)}</td></tr>
          <tr><td><strong>Lugar:</strong> ${escapeHTML(vars.lugar)}</td></tr>
          <tr><td><strong>Horas TT:</strong> ${escapeHTML(vars.horasTT)}</td></tr>
          <tr><td><strong>OT:</strong> ${escapeHTML(String(vars.ot))}</td></tr>
        </table>
      </div>
    </div>
    <!-- Área de trabajos con tres líneas -->
    <div class="trabajos">
      <div class="trabajo-label">A la aeronave se le efectuaron los trabajos que a continuación se describen:</div>
      <div class="linea"></div>
      <div class="linea"></div>
      <div class="linea"></div>
    </div>
    <!-- Tabla de certificación: texto amplio y firma -->
    <table class="cert-table">
      <tr>
        <td colspan="3">${escapeHTML(vars.textoCertificacion)}</td>
      </tr>
      <tr>
        <td class="hdr">Nombre Certificador</td>
        <td class="hdr">Lic. Nº y Tipo</td>
        <td class="hdr">Firma y Sello</td>
      </tr>
      <tr>
        <td>${escapeHTML(vars.certificadorNombre)}</td>
        <td>${escapeHTML(
          [vars.certificadorLic, vars.certificadorTipo].filter(Boolean).join(' · ')
        )}</td>
        <td></td>
      </tr>
    </table>
  </div>
  <!-- SEGUNDO RECUADRO -->
  <div class="box box-bottom">
    <div class="header-grid">
      <!-- Tabla izquierda -->
      <div>
        <table class="sheet">
          <tr><td><strong>Matrícula:</strong> ${escapeHTML(vars.matricula)}</td></tr>
          <tr><td><strong>Marca:</strong> ${escapeHTML(vars.marca)}</td></tr>
          <tr><td><strong>Modelo:</strong> ${escapeHTML(vars.modelo)}</td></tr>
          <tr><td><strong>Serial:</strong> ${escapeHTML(vars.serial)}</td></tr>
        </table>
      </div>
      <!-- Logo y textos centrados -->
      <div class="center">
        ${logoData ? `<img src="${logoData}" alt="logo">` : ''}
        <div class="title">${escapeHTML(vars.empresaTitulo)}</div>
        <div class="address">${escapeHTML(vars.empresaLinea1)}<br>${escapeHTML(vars.empresaLinea2)}</div>
        <div class="cert-title">CERTIFICADO DE CONFORMIDAD DE MANTENIMIENTO</div>
      </div>
      <!-- Tabla derecha -->
      <div>
        <table class="sheet">
          <tr><td><strong>Fecha:</strong> ${escapeHTML(vars.fecha)}</td></tr>
          <tr><td><strong>Lugar:</strong> ${escapeHTML(vars.lugar)}</td></tr>
          <tr><td><strong>Horas TT:</strong> ${escapeHTML(vars.horasTT)}</td></tr>
          <tr><td><strong>OT:</strong> ${escapeHTML(String(vars.ot))}</td></tr>
        </table>
      </div>
    </div>
    <!-- Tabla de certificación (sin líneas de trabajos) -->
    <table class="cert-table">
      <tr>
        <td colspan="3">${escapeHTML(vars.textoCertificacion)}</td>
      </tr>
      <tr>
        <td class="hdr">Nombre Certificador</td>
        <td class="hdr">Lic. Nº y Tipo</td>
        <td class="hdr">Firma y Sello</td>
      </tr>
      <tr>
        <td>${escapeHTML(vars.certificadorNombre)}</td>
        <td>${escapeHTML(
          [vars.certificadorLic, vars.certificadorTipo].filter(Boolean).join(' · ')
        )}</td>
        <td></td>
      </tr>
    </table>
  </div>
</div>
</body>
</html>`;

    // Renderizar con Puppeteer
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
    res.setHeader('Content-Disposition', `inline; filename=\"${filename}\"`);
    return res.send(pdf);
  } catch (error) {
    console.error('Error al generar PDF de Conformidad:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Error al generar el PDF' });
    }
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

  // toma la primera coincidencia de certificador si existe
  const pickCertificador = (empleadosAsignados = []) => {
    const cert = empleadosAsignados.find(e =>
      (e.rol && String(e.rol).toUpperCase().includes('CERT')) ||
      e.empleado?.esCertificador === true
    );
    return cert?.empleado ?? null;
  };

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

    // Logo embebido (opcional). Colocalo en "public/celcol-logo.jpeg"
    let logoData = '';
    try {
      const logoPath = path.join(process.cwd(), 'public', 'celcol-logo.jpeg');
      if (fs.existsSync(logoPath)) {
        const buf = fs.readFileSync(logoPath);
        logoData = `data:image/jpeg;base64,${buf.toString('base64')}`;
      }
    } catch {}

    // Armar variables (query/body/orden)
    const body = (req.method === 'POST' ? (req.body || {}) : {});
    const q = req.query || {};

    const avion = orden.avion ?? null;
    const comp = orden.componente ?? null;
    const cert = pickCertificador(orden.empleadosAsignados);

    const vars = {
      // Encabezado (puede cambiarse por "CELCOLLABORATION" si preferís)
      empresaTitulo: q.empresaTitulo ?? body.empresaTitulo ?? 'CELCOL AVIATION',
      empresaLinea1: q.empresaLinea1 ?? body.empresaLinea1 ?? 'Camino Melilla Aeropuerto Ángel Adami',
      empresaLinea2: q.empresaLinea2 ?? body.empresaLinea2 ?? 'Sector CAMES – Hangar Nº 2 · OMA IR-158',

      // Tablas izquierda
      matricula: q.matricula ?? body.matricula ?? (avion?.matricula ?? ''),
      marca:     q.marca     ?? body.marca     ?? (avion?.marca   ?? comp?.marca   ?? ''),
      modelo:    q.modelo    ?? body.modelo    ?? (avion?.modelo  ?? comp?.modelo  ?? ''),
      serial:    q.serial    ?? body.serial    ?? (avion?.numeroSerie ?? comp?.numeroSerie ?? ''),

      // Tablas derecha
      fecha:     q.fecha     ?? body.fecha     ?? fmtUY(new Date()),
      lugar:     q.lugar     ?? body.lugar     ?? '',
      horasTT:   q.horasTT   ?? body.horasTT   ?? '',
      ot:        q.ot        ?? body.ot        ?? (orden.numero ?? orden.id),

      // Texto intermedio (3 renglones; texto libre opcional)
      trabajosDescripcion: q.trabajosDescripcion ?? body.trabajosDescripcion ?? '',

      // Certificación (recuadro ancho)
      textoCertificacion: q.textoCertificacion ?? body.textoCertificacion ??
        'Certifico que esta aeronave ha sido inspeccionada y los trabajos arriba descritos han sido completados de manera satisfactoria, por lo que se encuentra en condiciones seguras y aeronavegable por concepto de los trabajos realizados. Los detalles de estos mantenimientos se encuentran bajo la Orden de Trabajo arriba descrita.',

      // Firmas
      certificadorNombre: q.certificadorNombre ?? body.certificadorNombre ??
        [cert?.nombre, cert?.apellido].filter(Boolean).join(' '),
      certificadorLic:    q.certificadorLic    ?? body.certificadorLic    ??
        (cert?.numeroLicencia ?? ''),
      certificadorTipo:   q.certificadorTipo   ?? body.certificadorTipo   ??
        (Array.isArray(cert?.tipoLicencia) && cert.tipoLicencia.length ? cert.tipoLicencia.join(', ') : ''),

      // Fecha de emisión que va arriba a la derecha (independiente de "fecha" del campo)
      fechaEmision: q.fechaEmision ?? body.fechaEmision ?? fmtUY(new Date())
    };

    // HTML/CSS – DOBLE BORDE en recuadros principales
    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>Conformidad de Mantenimiento</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 9pt; color: #000; line-height: 1.15; background: #fff; }

  /* Fecha emisión arriba-derecha */
  .fecha-emision { position: absolute; top: 0; right: 0; font-size: 9pt; }

  /* Contenedor general con separación */
  .wrap { display: flex; flex-direction: column; gap: 4mm; }

  /* Recuadros principales con Borde Doble */
  .box {
    border: 2pt double #000;
    padding: 4mm 4mm 10mm 4mm;
    position: relative;
  }

  /* Encabezado centrado */
  .logo-section { text-align: center; margin-bottom: 3mm; }
  .logo { height: 18mm; display: block; margin: 0 auto 2mm auto; }
  .title { font-weight: bold; font-size: 11pt; }
  .address { font-size: 8pt; line-height: 1.2; }

  /* Doble tabla tipo Excel (dos columnas, cuatro filas) */
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; margin: 2mm 0 3mm 0; }
  table.sheet { width: 100%; border-collapse: collapse; }
  .sheet td { border: 0.5pt solid #000; padding: 1mm; vertical-align: top; min-height: 6mm; }
  .label { font-weight: bold; font-size: 7.5pt; display: inline-block; min-width: 22mm; }

  /* Título de certificado */
  .cert { text-align: center; font-size: 10pt; font-weight: bold; margin: 2mm 0; }

  /* Párrafo de certificación */
  .texto { font-size: 8pt; text-align: justify; margin-bottom: 3mm; }

  /* Renglones (3 líneas) */
  .renglones { margin-top: 2mm; }
  .renglones .linea { border-bottom: 0.4pt solid #000; height: 5mm; margin-bottom: 2mm; }

  /* Tabla firmas 3x2 (cabecera + valores) */
  .firmas { width: 100%; border-collapse: collapse; }
  .firmas td { border: 0.5pt solid #000; padding: 1mm; vertical-align: top; }
  .hdr { text-align: center; font-weight: bold; font-size: 8pt; }

  /* Espaciado interior para la segunda caja */
  .sep { height: 2mm; }

</style>
</head>
<body>

<div class="fecha-emision">Fecha: ${escapeHTML(vars.fechaEmision)}</div>

<div class="wrap">

  <!-- RECUADRO SUPERIOR (más fino) -->
  <div class="box">
    <div class="logo-section">
      ${logoData ? `<img class="logo" src="${logoData}" alt="logo">` : ''}
      <div class="title">${escapeHTML(vars.empresaTitulo)}</div>
      <div class="address">${escapeHTML(vars.empresaLinea1)}<br>${escapeHTML(vars.empresaLinea2)}</div>
    </div>

    <div class="grid-2">

      <!-- Izquierda -->
      <table class="sheet">
        <tr><td><span class="label">Matrícula:</span> ${escapeHTML(vars.matricula)}</td></tr>
        <tr><td><span class="label">Marca:</span> ${escapeHTML(vars.marca)}</td></tr>
        <tr><td><span class="label">Modelo:</span> ${escapeHTML(vars.modelo)}</td></tr>
        <tr><td><span class="label">Serial:</span> ${escapeHTML(vars.serial)}</td></tr>
      </table>

      <!-- Derecha -->
      <table class="sheet">
        <tr><td><span class="label">Fecha:</span> ${escapeHTML(vars.fecha)}</td></tr>
        <tr><td><span class="label">Lugar:</span> ${escapeHTML(vars.lugar)}</td></tr>
        <tr><td><span class="label">Horas TT:</span> ${escapeHTML(vars.horasTT)}</td></tr>
        <tr><td><span class="label">OT:</span> ${escapeHTML(String(vars.ot))}</td></tr>
      </table>

    </div>

    <div class="cert">CERTIFICADO DE CONFORMIDAD DE MANTENIMIENTO</div>

    <div class="texto">
      A la aeronave se le efectuaron los trabajos que a continuación se describen:
      ${vars.trabajosDescripcion ? (' ' + escapeHTML(vars.trabajosDescripcion)) : ''}
    </div>

    <div class="renglones">
      <div class="linea"></div>
      <div class="linea"></div>
      <div class="linea"></div>
    </div>

    <div class="sep"></div>

    <table class="firmas">
      <tr>
        <td class="hdr">Nombre Certificador</td>
        <td class="hdr">Lic. Nº y Tipo</td>
        <td class="hdr">Firma y Sello</td>
      </tr>
      <tr>
        <td>${escapeHTML(vars.certificadorNombre)}</td>
        <td>${escapeHTML([vars.certificadorLic, vars.certificadorTipo].filter(Boolean).join(' · '))}</td>
        <td></td>
      </tr>
    </table>
  </div>

  <!-- RECUADRO INFERIOR (más alto). Base para la “copia” que vas a ajustar luego -->
  <div class="box">
    <div class="logo-section">
      ${logoData ? `<img class="logo" src="${logoData}" alt="logo">` : ''}
      <div class="title">${escapeHTML(vars.empresaTitulo)}</div>
      <div class="address">${escapeHTML(vars.empresaLinea1)}<br>${escapeHTML(vars.empresaLinea2)}</div>
    </div>

    <div class="grid-2">

      <!-- Izquierda -->
      <table class="sheet">
        <tr><td><span class="label">Matrícula:</span> ${escapeHTML(vars.matricula)}</td></tr>
        <tr><td><span class="label">Marca:</span> ${escapeHTML(vars.marca)}</td></tr>
        <tr><td><span class="label">Modelo:</span> ${escapeHTML(vars.modelo)}</td></tr>
        <tr><td><span class="label">Serial:</span> ${escapeHTML(vars.serial)}</td></tr>
      </table>

      <!-- Derecha -->
      <table class="sheet">
        <tr><td><span class="label">Fecha:</span> ${escapeHTML(vars.fecha)}</td></tr>
        <tr><td><span class="label">Lugar:</span> ${escapeHTML(vars.lugar)}</td></tr>
        <tr><td><span class="label">Horas TT:</span> ${escapeHTML(vars.horasTT)}</td></tr>
        <tr><td><span class="label">OT:</span> ${escapeHTML(String(vars.ot))}</td></tr>
      </table>

    </div>

    <div class="cert">CERTIFICADO DE CONFORMIDAD DE MANTENIMIENTO</div>

    <!-- Recuadro ancho de texto de certificación -->
    <table class="sheet" style="margin-bottom:3mm;">
      <tr>
        <td>${escapeHTML(vars.textoCertificacion)}</td>
      </tr>
    </table>

    <table class="firmas">
      <tr>
        <td class="hdr">Nombre Certificador</td>
        <td class="hdr">Lic. Nº y Tipo</td>
        <td class="hdr">Firma y Sello</td>
      </tr>
      <tr>
        <td>${escapeHTML(vars.certificadorNombre)}</td>
        <td>${escapeHTML([vars.certificadorLic, vars.certificadorTipo].filter(Boolean).join(' · '))}</td>
        <td></td>
      </tr>
    </table>
  </div>

</div>

</body>
</html>`;

    // Render y respuesta
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


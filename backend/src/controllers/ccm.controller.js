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

  // Selecciona al empleado con rol "Certificador"
  const pickCertificador = (empleadosAsignados = []) => {
    const cert = empleadosAsignados.find((e) => e.rol && /certificador/i.test(e.rol));
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

    // Logo embebido (si existe en "public/celcol-logo.jpeg")
    let logoData = '';
    try {
      const logoPath = path.join(process.cwd(), 'public', 'celcol-logo.jpeg');
      if (fs.existsSync(logoPath)) {
        const buf = fs.readFileSync(logoPath);
        logoData = `data:image/jpeg;base64,${buf.toString('base64')}`;
      }
    } catch {}

    const body = req.method === 'POST' ? req.body || {} : {};
    const q = req.query || {};
    const avion = orden.avion ?? null;
    const compOrden = orden.componente ?? null;

    // Seleccionar certificador
    const cert = pickCertificador(orden.empleadosAsignados);

    // Si la orden incluye un componente con tipo "motor", usarlo para rellenar la tabla Motor
    let motorComp = null;
    if (compOrden && compOrden.tipo && /motor/i.test(compOrden.tipo)) {
      motorComp = compOrden;
    }

    const vars = {
      fechaEmision: q.fechaEmision ?? body.fechaEmision ?? fmtUY(new Date()),
      empresaTitulo: q.empresaTitulo ?? body.empresaTitulo ?? 'CELCOL AVIATION',
      empresaLinea1: q.empresaLinea1 ?? body.empresaLinea1 ?? 'Camino Melilla Aeropuerto Ángel Adami',
      empresaLinea2: q.empresaLinea2 ?? body.empresaLinea2 ?? 'Sector CAMES – Hangar Nº 2 · OMA IR-158',

      matricula: q.matricula ?? body.matricula ?? (avion?.matricula ?? ''),
      marca: q.marca ?? body.marca ?? (avion?.marca ?? ''),
      modelo: q.modelo ?? body.modelo ?? (avion?.modelo ?? ''),
      serial: q.serial ?? body.serial ?? (avion?.numeroSerie ?? ''),

      // Campo "Fecha" en blanco en la tabla derecha
      fecha: '',
      lugar: q.lugar ?? body.lugar ?? '',
      horasTT: q.horasTT ?? body.horasTT ?? '',
      ot: q.ot ?? body.ot ?? (orden.numero ?? orden.id),

      // Texto de certificación
      textoCertificacion:
        q.textoCertificacion ??
        body.textoCertificacion ??
        'Certifico que esta aeronave ha sido inspeccionada y los trabajos arriba descritos han sido completados de manera satisfactoria, por lo que se encuentra en condiciones seguras y aeronavegable por concepto de los trabajos realizados. Los detalles de estos mantenimientos se encuentran bajo la Orden de Trabajo arriba descrita.',

      certificadorNombre:
        q.certificadorNombre ??
        body.certificadorNombre ??
        [cert?.nombre, cert?.apellido].filter(Boolean).join(' '),

      // Segunda columna de firmas: "MMA. {numeroLicencia}"
      certificadorLicString:
        q.certificadorLicString ??
        body.certificadorLicString ??
        (cert?.numeroLicencia ? `MMA. ${cert.numeroLicencia}` : ''),

      // Datos del motor (si existe)
      motorMarca: q.motorMarca ?? body.motorMarca ?? (motorComp?.marca ?? ''),
      motorModelo: q.motorModelo ?? body.motorModelo ?? (motorComp?.modelo ?? ''),
      motorSerial: q.motorSerial ?? body.motorSerial ?? (motorComp?.numeroSerie ?? ''),
      motorTSO: q.motorTSO ?? body.motorTSO ?? (motorComp?.tso ?? ''),
      motorTBO: q.motorTBO ?? body.motorTBO ?? (motorComp?.tbo ?? '')
    };

    // Estructura HTML del PDF
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

  .box { border: 2pt double #000; padding: 3mm; }
  .box-top { min-height: 120mm; }
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
  .cert-title {
    font-size: 9.5pt;
    font-weight: bold;
    margin-top: 1mm;
    white-space: nowrap;
  }

  .sheet { width: 100%; border-collapse: collapse; font-size: 7.5pt; }
  .sheet td { border: 0.5pt solid #000; padding: 1mm; vertical-align: top; }

  /* Tablas Motor y Hélice en el segundo recuadro */
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
    <!-- Texto y espacio para trabajos de aeronave -->
    <div class="trabajos">
      <p style="font-weight:bold; text-align:center;">A la aeronave se le efectuaron los trabajos que a continuación se describen:</p>
      <div style="height:15mm;"></div>
    </div>
    <!-- Texto de certificación y tabla de firmas -->
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
    <!-- Tablas Motor y Hélice -->
    <div class="motor-helice-grid">
      <table class="sheet">
        <tr><td colspan="2"><strong>Motor</strong></td></tr>
        <tr><td><strong>Marca:</strong> ${escapeHTML(vars.motorMarca)}</td><td><strong>TSO:</strong> ${escapeHTML(vars.motorTSO)}</td></tr>
        <tr><td><strong>Modelo:</strong> ${escapeHTML(vars.motorModelo)}</td><td><strong>TBO:</strong> ${escapeHTML(vars.motorTBO)}</td></tr>
        <tr><td><strong>Serial:</strong> ${escapeHTML(vars.motorSerial)}</td><td></td></tr>
      </table>
      <table class="sheet">
        <tr><td colspan="2"><strong>Helice</strong></td></tr>
        <tr><td><strong>Marca:</strong></td><td><strong>TSO:</strong></td></tr>
        <tr><td><strong>Modelo:</strong></td><td><strong>TBO:</strong></td></tr>
        <tr><td><strong>Serial:</strong></td><td></td></tr>
      </table>
    </div>
    <!-- Texto y espacio para trabajos del motor -->
    <div class="trabajos">
      <p style="font-weight:bold; text-align:center;">Al motor se le efectuaron los trabajos que a continuación se describen:</p>
      <div style="height:15mm;"></div>
    </div>
    <!-- Texto de certificación y tabla de firmas -->
    <table class="cert-table">
      <tr><td colspan="3">${escapeHTML(vars.textoCertificacion)}</td></tr>
      <tr>
        <td class="hdr">Nombre Certificador</td>
        <td class="hdr">Lic. Nº y Tipo</td>
        <td class "hdr">Firma y Sello</td>
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
    res.setHeader('Content-Disposition', `inline; filename=\"${filename}\"`);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Error al generar PDF de Conformidad:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Error al generar el PDF' });
    }
  }
};

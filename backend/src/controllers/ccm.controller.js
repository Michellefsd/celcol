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

  const normalizeSnap = (val) => {
    if (!val) return null;
    if (typeof val === 'string') {
      try { return JSON.parse(val) ?? null; } catch { return null; }
    }
    return val;
  };

  try {
    if (!id) return res.status(400).json({ error: 'ID inválido' });

    const orden = await prisma.ordenTrabajo.findUnique({
      where: { id },
      include: {
        empleadosAsignados: { 
          include: { empleado: true },
          where: {
            OR: [
              { rol: { equals: 'CERTIFICADOR', mode: 'insensitive' } },
              { rol: { equals: 'TECNICO', mode: 'insensitive' } }
            ]
          }
        },
        avion: { 
          include: { 
            propietarios: { include: { propietario: true } },
            modelo: true 
          } 
        },
        componente: { include: { propietario: true } },
        registrosTrabajo: { 
          orderBy: { fecha: 'asc' },
          include: { empleado: true }
        }
      }
    });

    if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });

    // Snapshots
    const avSnap = normalizeSnap(orden.datosAvionSnapshot);
    const compSnap = normalizeSnap(orden.datosComponenteSnapshot);

    // Datos de la aeronave
    const matricula = avSnap?.matricula || orden.avion?.matricula || compSnap?.matricula || '';
    const marca = avSnap?.marca || orden.avion?.modelo?.marca || compSnap?.marca || '';
    const modelo = avSnap?.modelo || orden.avion?.modelo?.nombre || compSnap?.modelo || '';
    const serial = avSnap?.serial || orden.avion?.serial || compSnap?.serial || '';
    
    // Horas totales (TT) - usar el último registro o valor por defecto
    const ultimoRegistro = orden.registrosTrabajo?.[orden.registrosTrabajo.length - 1];
    const horasTT = ultimoRegistro?.horasTotales || ultimoRegistro?.horas || '';

    // Certificador principal
    const certificador = orden.empleadosAsignados.find(e => 
      e.rol?.toUpperCase() === 'CERTIFICADOR'
    )?.empleado;

    const nombreCertificador = certificador ? 
      `${certificador.nombre || ''} ${certificador.apellido || ''}`.trim() : '';
    
    const licenciaCertificador = certificador?.licencia || '';

    // Descripción del trabajo
    const descripcionTrabajo = orden.OTsolicitud || orden.solicitud || 
                              orden.descripcionTrabajo || orden.descripcion || '';

    // Logo embebido
    let logoData = '';
    try {
      const logoPath = path.join(process.cwd(), 'public', 'celcol-logo.jpeg');
      if (fs.existsSync(logoPath)) {
        const buf = fs.readFileSync(logoPath);
        logoData = `data:image/jpeg;base64,${buf.toString('base64')}`;
      }
    } catch {}

    // HTML/CSS
    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>Conformidad de Mantenimiento - OT ${orden.numero || orden.id}</title>
<style>
  @page { 
    size: A4; 
    margin: 30mm 30mm 20mm 30mm; /* 3cm izquierda/derecha, 2cm abajo, 3cm arriba */
  }
  * { 
    box-sizing: border-box; 
    margin: 0; 
    padding: 0; 
  }
  body { 
    font-family: Arial, Helvetica, sans-serif; 
    font-size: 11pt; 
    color: #000; 
    line-height: 1.4;
    width: 210mm;
    margin: 0 auto;
    padding: 0;
  }

  /* Header */
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

  .header .subtitle {
    font-size: 12pt;
    font-weight: bold;
  }

  /* Información de la OMA */
  .oma-info {
    text-align: center;
    margin-bottom: 8mm;
    font-size: 10pt;
  }

  .oma-info .address {
    font-weight: bold;
    margin-bottom: 1mm;
  }

  .oma-info .hangar {
    font-style: italic;
  }

  /* Tabla de datos de la aeronave */
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

  .aircraft-table .label {
    font-weight: bold;
    width: 25%;
  }

  .aircraft-table .value {
    width: 75%;
  }

  /* Sección de certificado */
  .certificate-section {
    margin-bottom: 10mm;
  }

  .certificate-title {
    font-size: 14pt;
    font-weight: bold;
    text-align: center;
    margin-bottom: 6mm;
    text-transform: uppercase;
  }

  .work-description {
    border: 1pt solid #000;
    padding: 4mm;
    min-height: 40mm;
    margin-bottom: 6mm;
    font-size: 11pt;
    line-height: 1.6;
  }

  .certificate-text {
    margin-bottom: 8mm;
    font-size: 11pt;
    line-height: 1.6;
    text-align: justify;
  }

  /* Tabla de certificador */
  .certifier-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 15mm;
    font-size: 11pt;
  }

  .certifier-table td {
    border: 1pt solid #000;
    padding: 3mm 2mm;
    vertical-align: top;
    text-align: center;
  }

  .certifier-table .label {
    font-weight: bold;
    width: 33.33%;
  }

  .signature-line {
    border-top: 1pt solid #000;
    margin-top: 15mm;
    padding-top: 2mm;
    text-align: center;
    font-size: 10pt;
  }

  .ca-number {
    position: absolute;
    top: 5mm;
    right: 5mm;
    font-size: 10pt;
    font-weight: bold;
  }

  /* Utilidades */
  .text-center { text-align: center; }
  .text-bold { font-weight: bold; }
  .mb-2 { margin-bottom: 2mm; }
  .mb-4 { margin-bottom: 4mm; }
</style>
</head>
<body>

<div class="ca-number">CA-19</div>

<!-- Header -->
<div class="header">
  <h1>CONFORMIDAD DE MANTENIMIENTO</h1>
</div>

<!-- Información de la OMA -->
<div class="oma-info">
  <div class="address">CELCOL AVIATION</div>
  <div class="hangar">Camino Melilla Aeropuerto Ángel Adami</div>
  <div class="hangar">Sector Carnes Hangar No. 2 - OMA IR-158</div>
</div>

<!-- Tabla de datos de la aeronave -->
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
    <td class="value">${escapeHTML(serial)}</td>
  </tr>
</table>

<!-- Información adicional -->
<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4mm; margin-bottom: 8mm; font-size: 11pt;">
  <div><span class="text-bold">Fecha:</span> ${escapeHTML(fmtUY(new Date()))}</div>
  <div><span class="text-bold">Lugar:</span> Aeropuerto Ángel Adami</div>
  <div><span class="text-bold">Horas TT:</span> ${escapeHTML(horasTT.toString())}</div>
  <div style="grid-column: span 3;"><span class="text-bold">OT:</span> ${escapeHTML(orden.numero?.toString() || orden.id.toString())}</div>
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

    const filename = `Conformidad-Mantenimiento-OT-${orden.numero || orden.id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    return res.send(pdf);

  } catch (error) {
    console.error('Error al generar PDF de Conformidad de Mantenimiento:', error);
    if (!res.headersSent) return res.status(500).json({ error: 'Error al generar el PDF' });
  }
};
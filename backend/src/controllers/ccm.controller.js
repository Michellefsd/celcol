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
        // ❌ NO incluir 'modelo: true' porque no es relación
        avion: { 
          include: { 
            propietarios: { include: { propietario: true } }
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
    const avSnap   = normalizeSnap(orden.datosAvionSnapshot);
    const compSnap = normalizeSnap(orden.datosComponenteSnapshot);

    // Datos aeronave / componente (priorizar snapshots)
    const matricula   = avSnap?.matricula ?? orden.avion?.matricula ?? compSnap?.matricula ?? '';
    const marca       = avSnap?.marca     ?? orden.avion?.marca     ?? compSnap?.marca     ?? '';
    const modelo      = avSnap?.modelo    ?? orden.avion?.modelo    ?? compSnap?.modelo    ?? '';
    const numeroSerie = avSnap?.numeroSerie ?? orden.avion?.numeroSerie ?? compSnap?.numeroSerie ?? '';

    // Horas TT (TSN)
    const horasTT = avSnap?.TSN ?? orden.avion?.TSN ?? '';

    // Certificador principal
    const certAsign = (orden.empleadosAsignados || []).find(
      (e) => (e.rol || '').toUpperCase() === 'CERTIFICADOR'
    );
    const certificador = certAsign?.empleado;
    const nombreCertificador = certificador
      ? `${certificador.nombre || ''} ${certificador.apellido || ''}`.trim()
      : '';

    // Tipo + Nº de licencia
    const licenciaCertificador = (() => {
      const tipos = Array.isArray(certificador?.tipoLicencia)
        ? certificador.tipoLicencia.join(', ')
        : (certificador?.tipoLicencia || ''); // por si fuera string en algún entorno
      const numero = certificador?.numeroLicencia || '';
      return [tipos, numero].filter(Boolean).join(' — ');
    })();

    // Descripción del trabajo (prioridad a lo que certifica)
    const descripcionTrabajo =
      orden.accionTomada ||
      orden.solicitud ||
      orden.descripcionTrabajo ||
      orden.descripcion ||
      '';

    // Logo embebido (opcional)
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
<title>Conformidad de Mantenimiento - OT ${escapeHTML(String(orden.numero ?? orden.id))}</title>
<style>
  @page { size: A4; margin: 30mm 30mm 20mm 30mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; color: #000; line-height: 1.4; }
  .header { text-align: center; margin-bottom: 12mm; border-bottom: 1pt solid #000; padding-bottom: 4mm; }
  .header h1 { font-size: 16pt; font-weight: bold; margin-bottom: 2mm; text-transform: uppercase; }
  .oma-info { text-align: center; margin-bottom: 8mm; font-size: 10pt; }
  .oma-info .address { font-weight: bold; margin-bottom: 1mm; }
  .aircraft-table { width: 100%; border-collapse: collapse; margin-bottom: 10mm; font-size: 11pt; }
  .aircraft-table td { border: 1pt solid #000; padding: 3mm 2mm; vertical-align: top; }
  .aircraft-table .label { font-weight: bold; width: 25%; }
  .certificate-section { margin-bottom: 10mm; }
  .certificate-title { font-size: 14pt; font-weight: bold; text-align: center; margin-bottom: 6mm; text-transform: uppercase; }
  .work-description { border: 1pt solid #000; padding: 4mm; min-height: 40mm; margin-bottom: 6mm; font-size: 11pt; line-height: 1.6; }
  .certificate-text { margin-bottom: 8mm; font-size: 11pt; line-height: 1.6; text-align: justify; }
  .certifier-table { width: 100%; border-collapse: collapse; margin-top: 15mm; font-size: 11pt; }
  .certifier-table td { border: 1pt solid #000; padding: 3mm 2mm; vertical-align: top; text-align: center; }
  .signature-line { border-top: 1pt solid #000; margin-top: 15mm; padding-top: 2mm; text-align: center; font-size: 10pt; }
  .ca-number { position: absolute; top: 5mm; right: 5mm; font-size: 10pt; font-weight: bold; }
</style>
</head>
<body>

<div class="ca-number">CA-19</div>

<div class="header">
  ${logoData ? `<img src="${logoData}" alt="logo" style="height:24mm;display:block;margin:0 auto 4mm;">` : ''}
  <h1>CONFORMIDAD DE MANTENIMIENTO</h1>
</div>

<div class="oma-info">
  <div class="address">CELCOL AVIATION</div>
  <div>Camino Melilla Aeropuerto Ángel Adami</div>
  <div>Sector Carnes Hangar No. 2 - OMA IR-158</div>
</div>

<table class="aircraft-table">
  <tr><td class="label">Matrícula:</td><td>${escapeHTML(matricula)}</td></tr>
  <tr><td class="label">Marca:</td><td>${escapeHTML(marca)}</td></tr>
  <tr><td class="label">Modelo:</td><td>${escapeHTML(modelo)}</td></tr>
  <tr><td class="label">N.º de serie:</td><td>${escapeHTML(numeroSerie)}</td></tr>
</table>

<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4mm;margin-bottom:8mm;font-size:11pt;">
  <div><strong>Fecha:</strong> ${escapeHTML(fmtUY(new Date()))}</div>
  <div><strong>Lugar:</strong> Aeropuerto Ángel Adami</div>
  <div><strong>Horas TT (TSN):</strong> ${escapeHTML(String(horasTT || ''))}</div>
  <div style="grid-column:1 / -1;"><strong>OT:</strong> ${escapeHTML(String(orden.numero ?? orden.id))}</div>
</div>

<div class="certificate-section">
  <div class="certificate-title">CERTIFICADO DE CONFORMIDAD DE MANTENIMIENTO</div>
  <div class="work-description">${escapeHTML(descripcionTrabajo).replace(/\n/g,'<br>')}</div>
  <div class="certificate-text">
    Certifico que esta aeronave ha sido inspeccionada y los trabajos arriba descritos
    han sido completados de manera satisfactoria, por lo que se encuentra en condiciones
    seguras y aeronavegable por concepto de los trabajos realizados. Los detalles de estos
    mantenimientos se encuentran bajo la Orden de Trabajo arriba descrita.
  </div>
</div>

<table class="certifier-table">
  <tr>
    <td><strong>Nombre Certificador</strong></td>
    <td><strong>Lic. No y Tipo</strong></td>
    <td><strong>Firma y Sello</strong></td>
  </tr>
  <tr>
    <td style="height:25mm;">${escapeHTML(nombreCertificador)}</td>
    <td style="height:25mm;">${escapeHTML(licenciaCertificador)}</td>
    <td style="height:25mm;"></td>
  </tr>
</table>

<div class="signature-line">Firma del Propietario/Operador</div>

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

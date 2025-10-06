import prisma from '../lib/prisma.js';
import path from 'path';
import fs from 'fs';
import puppeteer from 'puppeteer';

/*
 * Controlador descargarOrdenPDF con mejoras adicionales:
 *
 *  - «Autorizo a la OMA...» aparece en negrita.
 *  - Se reemplaza la sección individual de «Trabajo realizado (certificador)» por
 *    una fila combinada junto a la fecha de cierre: un recuadro etiquetado
 *    «3 Certificado» ocupa ~3/4 de la fila, mientras que la fecha ocupa 1/4
 *    y se numera como paso 4.
 *  - La lógica de detección de acciones de certificadores replica la de técnicos
 *    y muestra cada una con rol (CERTIFICADOR), nombre y horas dedicadas.
 *  - La estructura sigue generando múltiples páginas si el contenido excede
 *    una hoja A4. Las clases `page-break-inside: avoid` ayudan a mantener
 *    la integridad de los bloques. Para textos aún más largos se podría
 *    reducir la fuente o dividir en más páginas.
 */

export const descargarOrdenPDF = async (req, res) => {
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
  const splitBullets = (txt) => {
    if (!txt) return [];
    const s = String(txt).replace(/\r/g, '\n');
    return s
      .split(/\n+|(?:^\s*[*•-]\s*)/gm)
      .map(x => String(x).trim())
      .filter(Boolean);
  };

  try {
    if (!id) return res.status(400).json({ error: 'ID inválido' });
    const orden = await prisma.ordenTrabajo.findUnique({
      where: { id },
      include: {
        empleadosAsignados: { include: { empleado: true } },
        registrosTrabajo:   { orderBy: { fecha: 'asc' }, include: { empleado: true } },
        avion: { include: { propietarios: { include: { propietario: true } } } },
        componente: { include: { propietario: true } }
      }
    });
    if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });
    const estado = orden.estadoOrden || '';
    if (!['CERRADA', 'CANCELADA'].includes(estado)) {
      return res.status(400).json({ error: '' });
    }
    // Snapshots y cabecera
    const avSnap   = normalizeSnap(orden.datosAvionSnapshot);
    const compSnap = normalizeSnap(orden.datosComponenteSnapshot);
    const propSnap = normalizeSnap(orden.datosPropietarioSnapshot);
    const discrep  = normalizeSnap(orden.discrepanciasSnapshot) || {};
    const matricula = (avSnap?.matricula) || (orden.avion?.matricula) || (compSnap?.matricula) || '';
    const fechaSolicitud = fmtUY(orden.fechaApertura);
    const otNro = String(orden.numero ?? orden.id);
    const propName =
      (propSnap ? nombrePropietario(propSnap) : '') ||
      (orden?.componente?.propietario ? nombrePropietario(orden.componente.propietario) : '') ||
      (orden?.avion?.propietarios?.[0]?.propietario ? nombrePropietario(orden.avion.propietarios[0].propietario) : '') ||
      (orden.solicitadoPor || '');
    const propEmail =
      (propSnap ? emailPropietario(propSnap) : '') ||
      (orden?.componente?.propietario ? emailPropietario(orden.componente.propietario) : '') || '';
    const solicitudBruta = orden.OTsolicitud || orden.solicitud || orden.descripcionTrabajo || orden.descripcion || '';
    const solicitudBullets = splitBullets(solicitudBruta);
    const observBullets = splitBullets(orden.observaciones || '');
    // Helpers de personal
    const toNombre = (emp) => {
      const n = emp?.nombre ?? emp?.empleado?.nombre;
      const a = emp?.apellido ?? emp?.empleado?.apellido;
      return [n, a].filter(Boolean).join(' ').trim();
    };
    // Obtener acciones tomadas de registros de trabajo
    const regs = Array.isArray(orden.registrosTrabajo) ? orden.registrosTrabajo : [];
    const accionesTomadas = [];
    for (let i = 0; i < Math.min(4, regs.length); i++) {
      const r = regs[i];
      const accion = r?.trabajoRealizado || r?.detalle || r?.descripcion || '';
      const empleadoNombre = [r?.empleado?.nombre, r?.empleado?.apellido].filter(Boolean).join(' ').trim();
      const rolEmpleado = r?.empleado?.rol || 'TÉCNICO';
      const hh = String(r?.horas ?? r?.cantidadHoras ?? '');
      if (accion) {
        accionesTomadas.push({ descripcion: accion, empleado: empleadoNombre, rol: rolEmpleado, horas: hh });
      }
    }
    // Si no hay registros, usar datos de solicitud
    if (accionesTomadas.length === 0 && solicitudBullets.length > 0) {
      const tecnicos = (orden.empleadosAsignados || [])
        .filter(e => (e?.rol || '').toUpperCase() === 'TECNICO')
        .map(toNombre);
      solicitudBullets.forEach((bullet, index) => {
        if (index < 4) {
          accionesTomadas.push({ descripcion: bullet, empleado: tecnicos[0] || '', rol: 'TÉCNICO', horas: '' });
        }
      });
    }
    const discrepanciaTexto = discrep?.A?.texto || discrep?.B?.texto || observBullets[0] || '';
    const fechaCierreTexto = estado === 'CERRADA' ? fmtUY(orden.fechaCierre) : fmtUY(orden.fechaCancelacion);
    // Logo embebido
    let logoData = '';
    try {
      const logoPath = path.join(process.cwd(), 'public', 'celcol-logo.jpeg');
      if (fs.existsSync(logoPath)) {
        const buf = fs.readFileSync(logoPath);
        logoData = `data:image/jpeg;base64,${buf.toString('base64')}`;
      }
    } catch {}
    // Filtrar acciones de certificadores
    const accionesCertificador = accionesTomadas.filter(a => String(a.rol || '').toUpperCase().includes('CERTIFICADOR'));
    // Construcción de HTML
    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>CA-29 OT ${escapeHTML(otNro)}</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; color: #000; line-height: 1.25; position: relative; min-height: 270mm; font-size: 9.5pt; }
  /* Header */
  .header { position: relative; margin-bottom: 6mm; height: 28mm; }
  .logo { position: absolute; left: 0; top: 0; width: 40mm; height: auto; }
  .header-content { margin-left: 45mm; text-align: center; }
  .header h1 { font-size: 14pt; font-weight: bold; margin-bottom: 2mm; }
  .header-fecha { position: absolute; top: 12mm; right: 0; font-size: 9pt; }
  /* Grid principal */
  .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2.5mm; margin-bottom: 2.5mm; }
  .field { border: 0.5pt solid #000; padding: 2mm; position: relative; min-height: 12mm; }
  .field-label { position: absolute; top: -3mm; left: 2mm; background: #fff; padding: 0 2mm; font-size: 7.5pt; font-weight: bold; }
  /* Sección 4-5 */
  .section-45 { display: grid; grid-template-columns: 1fr 40mm; gap: 2.5mm; margin-bottom: 2.5mm; }
  .solicitud, .firma { border: 0.5pt solid #000; padding: 2mm; position: relative; min-height: 25mm; }
  /* Discrepancias */
  .discrepancias { border: 0.5pt solid #000; padding: 2mm; margin-bottom: 2.5mm; position: relative; min-height: 15mm; }
  .discrepancias-label { position: absolute; top: -3mm; left: 2mm; background: #fff; padding: 0 2mm; font-size: 7.5pt; font-weight: bold; }
  /* Autorización */
  .autorizacion { text-align: center; font-size: 8.5pt; margin: 3mm 0; padding: 0 5mm; }
  .autorizacion strong { font-weight: bold; }
  /* Secciones */
  .seccion { border: 0.5pt solid #000; padding: 2mm; margin-bottom: 2.5mm; position: relative; }
  .seccion-label { position: absolute; top: -3mm; left: 2mm; background: #fff; padding: 0 2mm; font-size: 7.5pt; font-weight: bold; }
  .seccion-contenido { margin-top: 2mm; }
  .page-break { page-break-inside: avoid; }
  /* Lista de acciones */
  .lista-acciones { margin-top: 1.5mm; }
  .accion-item { margin-bottom: 2.5mm; padding-bottom: 2mm; border-bottom: 0.3pt solid #ccc; page-break-inside: avoid; }
  .accion-desc { margin-bottom: 1.5mm; }
  .accion-datos { display: flex; gap: 2.5mm; font-size: 8pt; }
  .dato-box { border: 0.5pt solid #000; padding: 1mm 2mm; min-width: 28mm; }
  /* Fila de certificado y cierre */
  .cierre-cert-row { display: grid; grid-template-columns: 3fr 1fr; gap: 2.5mm; margin-top: 4mm; }
  .cert-section { border: 0.5pt solid #000; padding: 2mm; position: relative; min-height: 20mm; }
  .cert-section-label { position: absolute; top: -3mm; left: 2mm; background: #fff; padding: 0 2mm; font-size: 7.5pt; font-weight: bold; }
  .fecha-cierre { border: 0.5pt solid #000; padding: 2mm; position: relative; min-height: 20mm; }
  /* Footer */
  .footer { position: absolute; bottom: 5mm; left: 0; right: 0; display: flex; justify-content: space-between; font-size: 7.5pt; border-top: 0.5pt solid #000; padding-top: 2mm; margin-top: 8mm; }
  .mono { white-space: pre-wrap; font-family: monospace; }
  .bold { font-weight: bold; }
</style>
</head>
<body>
<div class="header">
  ${logoData ? `<img class="logo" src="${logoData}">` : ''}
  <div class="header-fecha">Fecha: ${escapeHTML(fmtUY(new Date()))}</div>
  <div class="header-content">
    <h1>SOLICITUD - ORDEN DE TRABAJO DISCREPANCIAS</h1>
  </div>
</div>
<div class="grid">
  <div class="field">
    <div class="field-label">1 Matrícula</div>
    <div class="mono">${escapeHTML(matricula || '')}</div>
  </div>
  <div class="field">
    <div class="field-label">2 Fecha solicitud</div>
    <div class="mono">${escapeHTML(fechaSolicitud || '')}</div>
  </div>
  <div class="field">
    <div class="field-label">3 O/T Nro.</div>
    <div class="mono">${escapeHTML(otNro)}</div>
  </div>
</div>
<div class="section-45">
  <div class="solicitud">
    <div class="field-label">4 Solicitud (descripción del trabajo)</div>
    <div class="mono" style="margin-top: 1mm;">${escapeHTML(solicitudBruta)}</div>
  </div>
  <div class="firma">
    <div class="field-label">5 Firma o email</div>
    <div style="margin-top: 1mm;">
      <div class="bold">Solicitó:</div>
      <div>${escapeHTML(propName || '')}</div>
      <div>${escapeHTML(propEmail || '')}</div>
      <div style="margin-top: 8mm; border-top: 0.5pt solid #000; text-align: center; padding-top: 1mm;">Firma</div>
    </div>
  </div>
</div>
<div class="discrepancias">
  <div class="discrepancias-label">6 Discrepancias encontradas</div>
  <div class="mono" style="margin-top: 1mm;">${escapeHTML(discrepanciaTexto)}</div>
</div>
<div class="autorizacion"><strong>Autorizo a la OMA, la realización en la aeronave o componente de los trabajos detallados en la siguiente orden</strong></div>
<div class="seccion page-break">
  <div class="seccion-label">1 Reporte</div>
  <div class="mono seccion-contenido">
    ${accionesTomadas.map(a => escapeHTML(a.descripcion)).join('<br>') || escapeHTML(solicitudBruta || '')}
  </div>
</div>
<div class="seccion page-break">
  <div class="seccion-label">2 Acciones tomadas</div>
  <div class="lista-acciones">
    ${accionesTomadas.map((accion) => `
      <div class="accion-item">
        <div class="accion-desc">${escapeHTML(accion.descripcion)}</div>
        <div class="accion-datos">
          <div class="dato-box">${escapeHTML(accion.rol)}</div>
          <div class="dato-box">${escapeHTML(accion.empleado)}</div>
          <div class="dato-box">H.H: ${escapeHTML(accion.horas)}</div>
        </div>
      </div>
    `).join('')}
    ${accionesTomadas.length === 0 ? `
      <div class="accion-item">
        <div class="accion-desc"></div>
        <div class="accion-datos">
          <div class="dato-box">TÉCNICO</div>
          <div class="dato-box"></div>
          <div class="dato-box">H.H:</div>
        </div>
      </div>
    ` : ''}
  </div>
</div>
<div class="cierre-cert-row page-break">
  <div class="cert-section">
    <div class="cert-section-label">3 Certificado</div>
    <div class="lista-acciones">
      ${accionesCertificador.length > 0 ? accionesCertificador.map((accion) => `
        <div class="accion-item">
          <div class="accion-desc">${escapeHTML(accion.descripcion)}</div>
          <div class="accion-datos">
            <div class="dato-box">${escapeHTML(accion.rol)}</div>
            <div class="dato-box">${escapeHTML(accion.empleado)}</div>
            <div class="dato-box">H.H: ${escapeHTML(accion.horas)}</div>
          </div>
        </div>
      `).join('') : '<div class="accion-item"><div class="accion-desc">-</div></div>'}
    </div>
  </div>
  <div class="fecha-cierre">
    <div class="field-label">4 Fecha de cierre</div>
    <div class="mono bold" style="margin-top: 1mm; text-align: center;">${escapeHTML(fechaCierreTexto || '')}</div>
  </div>
</div>
<div class="footer">
  <div>Manual de la Organización de Mantenimiento – MOM</div>
  <div>Aprobado por: CELCOL AVIATION</div>
</div>
</body>
</html>`;
    // Renderizado
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' } });
    await page.close();
    await browser.close();
    const baseName = `OT-${orden.numero ?? orden.id}`;
    const filename = `${baseName}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Error al generar PDF de OT (Puppeteer):', error);
    if (!res.headersSent) return res.status(500).json({ error: 'Error al generar el PDF' });
  }
};
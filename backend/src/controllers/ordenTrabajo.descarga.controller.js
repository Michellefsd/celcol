// src/controllers/ordenTrabajo.descarga.controller.js (ESM)
/*import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import puppeteer from 'puppeteer';

const prisma = new PrismaClient();

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
  const isEmpty = (v) => !v || !String(v).trim();

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
      return res.status(400).json({ error: 'Solo disponible para órdenes CERRADAS o CANCELADAS' });
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

    // Personal
    const toNombre = (emp) => {
      const n = emp?.nombre ?? emp?.empleado?.nombre;
      const a = emp?.apellido ?? emp?.empleado?.apellido;
      return [n, a].filter(Boolean).join(' ').trim();
    };
    
    const toRol = (emp) => {
      return emp?.rol ?? emp?.empleado?.rol ?? 'TÉCNICO';
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
        accionesTomadas.push({
          descripcion: accion,
          empleado: empleadoNombre,
          rol: rolEmpleado,
          horas: hh
        });
      }
    }

    // Si no hay registros, usar datos de solicitud
    if (accionesTomadas.length === 0 && solicitudBullets.length > 0) {
      const tecnicos = (orden.empleadosAsignados || [])
        .filter(e => (e?.rol || '').toUpperCase() === 'TECNICO')
        .map(toNombre);
      
      solicitudBullets.forEach((bullet, index) => {
        if (index < 4) {
          accionesTomadas.push({
            descripcion: bullet,
            empleado: tecnicos[0] || '',
            rol: 'TÉCNICO',
            horas: ''
          });
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

// HTML/CSS - ESTRUCTURA CORREGIDA
const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>CA-29 OT ${escapeHTML(otNro)}</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #000; line-height: 1.2; 
         position: relative; min-height: 270mm; }

  // Header //
  .header { position: relative; margin-bottom: 4mm; height: 25mm; }
  .logo { position: absolute; left: 0; top: 0; width: 40mm; height: auto; }
  .header-content { margin-left: 45mm; text-align: center; }
  .header h1 { font-size: 14pt; font-weight: bold; margin-bottom: 1mm; }
  .header-fecha { position: absolute; top: 5mm; right: 0; font-size: 10pt; }

  // Grid principal //
  .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 3mm; margin-bottom: 3mm; }
  .field { border: 0.5pt solid #000; padding: 2mm; position: relative; min-height: 12mm; }
  .field-label { position: absolute; top: -3mm; left: 2mm; background: white; padding: 0 2mm; font-size: 8pt; font-weight: bold; }

  // Sección 4-5 //
  .section-45 { display: grid; grid-template-columns: 1fr 40mm; gap: 3mm; margin-bottom: 3mm; }
  .solicitud { border: 0.5pt solid #000; padding: 2mm; position: relative; min-height: 25mm; }
  .firma { border: 0.5pt solid #000; padding: 2mm; position: relative; min-height: 25mm; }

  // Discrepancias //
  .discrepancias { border: 0.5pt solid #000; padding: 2mm; margin-bottom: 3mm; position: relative; min-height: 15mm; }
  .discrepancias-label { position: absolute; top: -3mm; left: 2mm; background: white; padding: 0 2mm; font-size: 8pt; font-weight: bold; }

  // Autorización //
  .autorizacion { text-align: center; font-size: 9pt; margin: 4mm 0; padding: 0 5mm; }

  // Sección 1 - Reporte //
  .seccion-reporte { border: 0.5pt solid #000; padding: 2mm; margin-bottom: 3mm; position: relative; min-height: 25mm; }
  .seccion-label { position: absolute; top: -3mm; left: 2mm; background: white; padding: 0 2mm; font-size: 8pt; font-weight: bold; }

  // Sección 2 - Acciones Tomadas //
  .seccion-acciones { border: 0.5pt solid #000; padding: 2mm; margin-bottom: 3mm; position: relative; min-height: 35mm; }
  
  // Lista de acciones //
  .lista-acciones { margin-top: 2mm; }
  .accion-item { margin-bottom: 3mm; padding-bottom: 2mm; border-bottom: 0.5pt solid #ccc; }
  .accion-desc { margin-bottom: 2mm; }
  .accion-datos { display: flex; gap: 3mm; font-size: 8pt; }
  .dato-box { border: 0.5pt solid #000; padding: 1mm 2mm; min-width: 25mm; }

  // Fecha cierre //
  .cierre { display: grid; grid-template-columns: 1fr 40mm; gap: 3mm; margin-top: 5mm; }
  .fecha-cierre { border: 0.5pt solid #000; padding: 2mm; position: relative; min-height: 12mm; }

  // Footer - POSICIÓN FIJA MEJORADA //
  .footer { position: absolute; bottom: 10mm; left: 0; right: 0; 
            display: flex; justify-content: space-between; 
            font-size: 8pt; border-top: 0.5pt solid #000; 
            padding-top: 2mm; margin-top: 10mm; }

  .mono { white-space: pre-wrap; font-family: monospace; }
  .bold { font-weight: bold; }
</style>
</head>
<body>

<!-- Header con logo y fecha -->
<div class="header">
  ${logoData ? `<img class="logo" src="${logoData}">` : ''}
  <div class="header-fecha">Fecha: ${escapeHTML(fmtUY(new Date()))}</div>
  <div class="header-content">
    <h1>SOLICITUD - ORDEN DE TRABAJO DISCREPANCIAS</h1>
  </div>
</div>

<!-- Campos 1-3 -->
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

<!-- Sección 4-5 -->
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
      <div style="margin-top: 8mm; border-top: 0.5pt solid #000; text-align: center; padding-top: 1mm;">
        Firma
      </div>
    </div>
  </div>
</div>

<!-- Discrepancias - NUMERO 6 -->
<div class="discrepancias">
  <div class="discrepancias-label">6 Discrepancias encontradas</div>
  <div class="mono" style="margin-top: 1mm;">${escapeHTML(discrepanciaTexto)}</div>
</div>

<!-- Texto de autorización -->
<div class="autorizacion">
  Autorizo a la OMA, la realización en la aeronave o componente de los trabajos detallados en la siguiente orden
</div>

<!-- SECCIÓN 1 - REPORTE -->
<div class="seccion-reporte">
  <div class="seccion-label">1 Reporte</div>
  <div class="mono" style="margin-top: 1mm;">${escapeHTML(solicitudBruta)}</div>
</div>

<!-- SECCIÓN 2 - ACCIONES TOMADAS -->
<div class="seccion-acciones">
  <div class="seccion-label">2 Reportes</div>
  <div class="lista-acciones">
    ${accionesTomadas.map((accion, index) => `
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
        <div class="-datos">
          <div class="dato-box">TÉCNICO</div>
          <div class="dato-box"></div>
          <div class="dato-box">H.H:</div>
        </div>
      </div>
    ` : ''}
  </div>
</div>

<!-- Fecha de cierre -->
<div class="cierre">
  <div></div>
  <div class="fecha-cierre">
    <div class="field-label">3 Fecha de cierre</div>
    <div class="mono bold" style="margin-top: 1mm; text-align: center;">${escapeHTML(fechaCierreTexto || '')}</div>
  </div>
</div>

<!-- Footer - POSICIÓN FIJA MEJORADA -->
<div class="footer">
  <div>Manual de la Organización de Mantenimiento – MOM</div>
  <div>Aprobado por: CELCOL AVIATION</div>
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

    const filename = `OT-${orden.numero ?? orden.id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    return res.send(pdf);
  } catch (error) {
    console.error('Error al generar PDF de OT (Puppeteer):', error);
    if (!res.headersSent) return res.status(500).json({ error: 'Error al generar el PDF' });
  }
};
*/













































import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import puppeteer from 'puppeteer';

/*
 * Esta versión de descargarOrdenPDF incorpora mejoras solicitadas:
 *
 *  - Se aleja la fecha del borde superior de la página para que no quede pegada al título.
 *  - El apartado «Reporte» ahora muestra las acciones realizadas (si existen);
 *    en caso de no haber acciones, se muestra la descripción original de la solicitud.
 *  - La sección «Acciones tomadas» está rotulada correctamente y lista cada
 *    acción con rol, nombre y horas empleadas.
 *  - Se añade un apartado opcional «Trabajo realizado (certificador)» que
 *    lista el rol, nombre y horas de quienes actúan como certificadores.
 *  - La numeración de las secciones se ajusta dinámicamente si existe
 *    la sección de certificadores, desplazando la fecha de cierre.
 *  - Mejora la estética general: fuentes ligeramente más pequeñas para
 *    acomodar textos largos, más espacio entre bloques, y uso de
 *    `page-break-inside: avoid` para evitar cortes innecesarios.
 *  - Se sugiere una estrategia básica de reducción de tamaño de fuente
 *    y márgenes para textos muy extensos. Para contenidos que aún así
 *    excedan la hoja A4, se recomienda dividir en varias páginas, ya
 *    que Puppeteer respetará los saltos automáticos.
 */

const prisma = new PrismaClient();

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
      return res.status(400).json({ error: 'Solo disponible para órdenes CERRADAS o CANCELADAS' });
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
    // Personal helper
    const toNombre = (emp) => {
      const n = emp?.nombre ?? emp?.empleado?.nombre;
      const a = emp?.apellido ?? emp?.empleado?.apellido;
      return [n, a].filter(Boolean).join(' ').trim();
    };
    const toRol = (emp) => emp?.rol ?? emp?.empleado?.rol ?? 'TÉCNICO';
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
    // Construcción de HTML mejorado
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
  /* Cierre */
  .cierre { display: grid; grid-template-columns: 1fr 40mm; gap: 2.5mm; margin-top: 4mm; }
  .fecha-cierre { border: 0.5pt solid #000; padding: 2mm; position: relative; min-height: 12mm; }
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
      <div style="margin-top: 8mm; border-top: 0.5pt solid #000; text-align: center; padding-top: 1mm;">
        Firma
      </div>
    </div>
  </div>
</div>
<div class="discrepancias">
  <div class="discrepancias-label">6 Discrepancias encontradas</div>
  <div class="mono" style="margin-top: 1mm;">${escapeHTML(discrepanciaTexto)}</div>
</div>
<div class="autorizacion">Autorizo a la OMA, la realización en la aeronave o componente de los trabajos detallados en la siguiente orden</div>
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
${accionesCertificador.length > 0 ? `
<div class="seccion page-break">
  <div class="seccion-label">3 Trabajo realizado (certificador)</div>
  <div class="lista-acciones">
    ${accionesCertificador.map((accion) => `
      <div class="accion-item">
        <div class="accion-desc">${escapeHTML(accion.descripcion)}</div>
        <div class="accion-datos">
          <div class="dato-box">${escapeHTML(accion.rol)}</div>
          <div class="dato-box">${escapeHTML(accion.empleado)}</div>
          <div class="dato-box">H.H: ${escapeHTML(accion.horas)}</div>
        </div>
      </div>
    `).join('')}
  </div>
</div>
` : ''}
<div class="cierre">
  <div></div>
  <div class="fecha-cierre">
    <div class="field-label">${accionesCertificador.length > 0 ? '4' : '3'} Fecha de cierre</div>
    <div class="mono bold" style="margin-top: 1mm; text-align: center;">${escapeHTML(fechaCierreTexto || '')}</div>
  </div>
</div>
<div class="footer">
  <div>Manual de la Organización de Mantenimiento – MOM</div>
  <div>Aprobado por: CELCOL AVIATION</div>
</div>
</body>
</html>`;
    // Renderizar con Puppeteer
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' } });
    await page.close();
    await browser.close();
    const baseName = `OT-${orden.numero ?? orden.id}`;
    const filename = `${baseName}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    return res.send(pdf);
  } catch (error) {
    console.error('Error al generar PDF de OT (Puppeteer):', error);
    if (!res.headersSent) return res.status(500).json({ error: 'Error al generar el PDF' });
  }
};
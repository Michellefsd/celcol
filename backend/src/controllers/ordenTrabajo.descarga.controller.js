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
    const fechaSolicitud = fmtUY(orden.fechaApertura); // usar apertura
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
    const tecnicos = (orden.empleadosAsignados || [])
      .filter(e => (e?.rol || '').toUpperCase() === 'TECNICO')
      .map(toNombre);
    const certificadores = (orden.empleadosAsignados || [])
      .filter(e => (e?.rol || '').toUpperCase() === 'CERTIFICADOR')
      .map(toNombre);

    // Filas 1–4
    const regs = Array.isArray(orden.registrosTrabajo) ? orden.registrosTrabajo : [];
    const filas = [];
    for (let i = 0; i < Math.min(4, regs.length); i++) {
      const r = regs[i];
      const nombre = [r?.empleado?.nombre, r?.empleado?.apellido].filter(Boolean).join(' ').trim();
      const rep = r?.trabajoRealizado || r?.detalle || r?.descripcion || '';
      const hh  = String(r?.horas ?? r?.cantidadHoras ?? '');
      filas.push({
        num: i + 1,
        // Acción Tomada = trabajo realizado
        reporte: rep,
        accion:  rep,
        tecnico: nombre || (tecnicos[0] || ''),
        certificador: certificadores[0] || '',
        hh
      });
    }
    for (let i = 0; i < 4; i++) {
      if (!filas[i]) filas[i] = { num: i + 1, reporte: '', accion: '', tecnico: '', certificador: '', hh: '' };
      if (isEmpty(filas[i].reporte) && solicitudBullets[i]) {
        const b = solicitudBullets[i];
        filas[i].reporte = b;
        filas[i].accion  = b;
      }
      // Escapar
      filas[i].reporte = escapeHTML(filas[i].reporte);
      filas[i].accion  = escapeHTML(filas[i].accion);
      filas[i].tecnico = escapeHTML(filas[i].tecnico);
      filas[i].certificador = escapeHTML(filas[i].certificador);
      filas[i].hh = escapeHTML(filas[i].hh);
    }

    // A/B (Discrepancias)
    const A = Object.assign({ texto: '', accion: '', tecnico: '', certificador: '', hh: '' }, discrep?.A || {});
    const B = Object.assign({ texto: '', accion: '', tecnico: '', certificador: '', hh: '' }, discrep?.B || {});
    if (isEmpty(A.texto) && observBullets[0]) A.texto = observBullets[0];
    if (isEmpty(B.texto) && observBullets[1]) B.texto = observBullets[1];
    ['texto','accion','tecnico','certificador','hh'].forEach(k => { A[k] = escapeHTML(A[k] || ''); B[k] = escapeHTML(B[k] || ''); });

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

    // HTML/CSS
    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>CA-29 OT ${escapeHTML(otNro)}</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; color: #000; }

  .row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 3mm; }
  .box { border: 0.35pt solid #000; padding: 2mm; position: relative; }
  .label { position:absolute; top: -3mm; left: 2mm; background:#fff; padding: 0 1mm; font-size: 8pt; font-weight: 700; }
  .half .label { top: -1.4mm; }

  // Header //
  .hdr { position:relative; height: 23mm; margin-bottom: 2mm; }
  .logo { position:absolute; left:0; top:1mm; width:30mm; }
  .meta { position: absolute; top: 0; right: 0; width: 55mm; height: 18mm; border: 0.35pt solid #000; padding: 2mm; font-size: 8.5pt; }
  .meta .ca { position: absolute; top: 2mm; right: 3mm; font-weight: 700; }
  .h1 { position:absolute; top: 6mm; left: 34mm; right: 58mm; font-weight: 700; font-size: 13.5pt; line-height: 1.05; margin: 0; }

  .topline { border-top: 0.35pt solid #000; margin-top: 3mm; }
  .mono { white-space: pre-wrap; }

// ======= ESTRUCTURA UNIFICADA PARA TODAS LAS FILAS ======= //
.items { margin-top: 5mm; }
.item { 
  display: grid; 
  grid-template-columns: 12mm 1fr; 
  gap: 2mm; 
  height: 26mm; 
  margin-bottom: 2mm; 
}
.item .num { 
  border: 0.35pt solid #000; 
  display:flex; 
  align-items:center; 
  justify-content:center; 
  font-weight:700; 
}

.half-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  height: 100%;
}

.half { 
  border: 0.35pt solid #000;
  position: relative; 
  padding: 3mm 2mm 8.5mm 2mm;
}
.half:first-child { 
  border-right: none; 
}

.half .label { 
  position:absolute; 
  top: -3mm; 
  left: 2mm; 
  background:#fff; 
  padding: 0 1mm; 
  font-size: 8pt; 
  font-weight: 700; 
}

.mini-wrap { 
  position:absolute; 
  right: 2mm; 
  bottom: 2mm; 
  display:flex; 
  gap: 2mm; 
}
.mini { 
  border: 0.35pt solid #000; 
  padding: 1mm 2.6mm; 
  font-size: 7.4pt; 
  height: 7.2mm; 
  line-height: 1; 
  display:inline-block; 
}
.mini .val { 
  display:block; 
  font-size: 7.2pt; 
  margin-top: 0.4mm; 
  white-space: nowrap; 
  overflow: hidden; 
  text-overflow: ellipsis; 
}
.mini-tech { min-width: 34mm; }
.mini-cert { min-width: 30mm; }
.mini-hh   { min-width: 22mm; text-align: right; }

.half.empty { border-width: 0.25pt; opacity: 0.9; }
.mini.empty { border-width: 0.25pt; opacity: 0.9; }

// ======= SECCIÓN A / B ======= //
.ab { 
  display: grid; 
  grid-template-columns: 12mm 1fr; 
  gap: 2mm; 
  height: 23mm; 
  margin: 2mm 0; 
}
.ab .half-container {
  height: 100%;
}

  // Fecha de cierre (aire suficiente) //
  .close-row { grid-template-columns: 1fr 55mm 0; margin-top: 6mm; }

  // Firma //
  .sig { height: 100%; display: flex; flex-direction: column; }
  .sig .line { margin-top: auto; border-top: 0.35pt solid #000; text-align: center; font-size: 7.5pt; padding-top: 1mm; }

  .footer { margin-top: 6mm; display:flex; justify-content: space-between; font-size:8.8pt; }
</style>

</head>
<body>

<div class="hdr">
  ${logoData ? `<img class="logo" src="${logoData}">` : ''}
  <div class="meta">
    <div>Capítulo: 9</div>
    <div>Fecha: ${escapeHTML(fmtUY(new Date()))}</div>
    <div class="ca">CA-29</div>
  </div>
  <div class="h1">SOLICITUD - ORDEN DE TRABAJO&nbsp;&nbsp;DISCREPANCIAS</div>
</div>

<div class="topline"></div>

<!-- 1-3 -->
<div class="row" style="margin-top: 3mm;">
  <div class="box"><div class="label">1 Matrícula</div><div class="mono">${escapeHTML(matricula || '-')}</div></div>
  <div class="box"><div class="label">2 Fecha solicitud</div><div class="mono">${escapeHTML(fechaSolicitud || '-')}</div></div>
  <div class="box"><div class="label">3 O/T Nro.</div><div class="mono">${escapeHTML(otNro)}</div></div>
</div>

<!-- 4-5 -->
<div class="row" style="margin-top: 3mm; grid-template-columns: 1fr 55mm 0; gap: 3mm;">
  <div class="box" style="height: 22mm;"><div class="label">4 Solicitud (descripción del trabajo)</div>
    <div class="mono" style="line-height: 1.2;">${escapeHTML(solicitudBruta)}</div></div>
  <div class="box" style="height: 26mm;">
    <div class="label">5 Firma o email</div>
    <div class="sig">
      <div><b>Solicitó:</b> ${escapeHTML(propName || '-')}</div>
      <div>${escapeHTML(propEmail || '')}</div>
      <div class="line">Firma</div>
    </div>
  </div>
</div>

<!-- Texto intermedio -->
<div style="margin: 4mm 0 3mm 0; font-size: 9pt; line-height:1.15;">
  Autorizo a la OMA, la realización en la aeronave o componente de los trabajos detallados en la siguiente orden
</div>

<!-- 1-4 items -->
<div class="items">
  ${filas.map(f => {
    const empty6 = isEmpty(f.reporte);
    const empty7 = isEmpty(f.accion);
    const empty8 = isEmpty(f.tecnico);
    const empty9 = isEmpty(f.certificador);
    const empty10 = isEmpty(f.hh);
    return `
    <div class="item">
      <div class="num">${f.num}</div>
      <div class="half-container">
        <div class="half ${empty6 ? 'empty' : ''}">
          <div class="label">6 Reporte</div>
          <div class="mono" style="line-height:1.2;">${f.reporte}</div>
          <div class="mini-wrap">
            <div class="mini mini-tech ${empty8 ? 'empty' : ''}">8 Técnico<span class="val">${f.tecnico}</span></div>
          </div>
        </div>
        <div class="half ${empty7 ? 'empty' : ''}">
          <div class="label">7 Acción Tomada</div>
          <div class="mono" style="line-height:1.2;">${f.accion}</div>
          <div class="mini-wrap">
            <div class="mini mini-cert ${empty9 ? 'empty' : ''}">9 Certific.<span class="val">${f.certificador}</span></div>
            <div class="mini mini-hh ${empty10 ? 'empty' : ''}">10 H.H<span class="val">${f.hh}</span></div>
          </div>
        </div>
      </div>
    </div>`;
  }).join('')}
</div>

<!-- A/B -->
${[['A', A], ['B', B]].map(([tag, r], idx) => {
  const empty11 = isEmpty(r?.texto);
  const empty12 = isEmpty(r?.accion);
  const empty8  = isEmpty(r?.tecnico);
  const empty9  = isEmpty(r?.certificador);
  const empty10 = isEmpty(r?.hh);
  return `
  <div class="ab">
    <div class="num">${tag}</div>
    <div class="half-container">
      <div class="half ${empty11 ? 'empty' : ''}">
        <div class="label">11 Discrepancias encontradas</div>
        <div class="mono" style="line-height:1.2;">${r?.texto || ''}</div>
        <div class="mini-wrap">
          <div class="mini mini-tech ${empty8 ? 'empty' : ''}">8 Técnico<span class="val">${r?.tecnico || ''}</span></div>
        </div>
      </div>
      <div class="half ${empty12 ? 'empty' : ''}">
        <div class="label">12 Acción Tomada</div>
        <div class="mono" style="line-height:1.2;">${r?.accion || ''}</div>
        <div class="mini-wrap">
          <div class="mini mini-cert ${empty9 ? 'empty' : ''}">9 Certific.<span class="val">${r?.certificador || ''}</span></div>
          <div class="mini mini-hh ${empty10 ? 'empty' : ''}">10 H.H<span class="val">${r?.hh || ''}</span></div>
        </div>
      </div>
    </div>
  </div>`;
}).join('')}

<!-- 13 Fecha de cierre (con margen extra) -->
<div class="row close-row">
  <div></div>
  <div class="box" style="height: 12mm;">
    <div class="label">13 Fecha de cierre</div>
    <div class="mono" style="font-weight:700;">${escapeHTML(fechaCierreTexto || '')}</div>
  </div>
</div>

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
























// src/controllers/ordenTrabajo.descarga.controller.js (ESM)
import { PrismaClient } from '@prisma/client';
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

    const tecnicos = (orden.empleadosAsignados || [])
      .filter(e => (e?.rol || '').toUpperCase() === 'TECNICO')
      .map(toNombre);
    const certificadores = (orden.empleadosAsignados || [])
      .filter(e => (e?.rol || '').toUpperCase() === 'CERTIFICADOR')
      .map(toNombre);

    // Obtener acciones tomadas de registros de trabajo
    const regs = Array.isArray(orden.registrosTrabajo) ? orden.registrosTrabajo : [];
    const accionesTomadas = [];
    
    for (let i = 0; i < Math.min(4, regs.length); i++) {
      const r = regs[i];
      const accion = r?.trabajoRealizado || r?.detalle || r?.descripcion || '';
      const tecnicoNombre = [r?.empleado?.nombre, r?.empleado?.apellido].filter(Boolean).join(' ').trim();
      const rolEmpleado = r?.empleado?.rol || 'TÉCNICO';
      const hh = String(r?.horas ?? r?.cantidadHoras ?? '');
      
      if (accion) {
        accionesTomadas.push({
          descripcion: accion,
          tecnico: tecnicoNombre || (tecnicos[0] || ''),
          rol: rolEmpleado,
          certificador: certificadores[0] || '',
          horas: hh
        });
      }
    }

    // Si no hay registros, usar datos de solicitud
    if (accionesTomadas.length === 0 && solicitudBullets.length > 0) {
      solicitudBullets.forEach((bullet, index) => {
        if (index < 4) {
          accionesTomadas.push({
            descripcion: bullet,
            tecnico: tecnicos[0] || '',
            rol: 'TÉCNICO',
            certificador: certificadores[0] || '',
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
         position: relative; min-height: 297mm; padding-bottom: 20mm; }

  /* Header */
  .header { text-align: center; margin-bottom: 4mm; }
  .header h1 { font-size: 14pt; font-weight: bold; margin-bottom: 2mm; }
  .header .fecha { font-size: 10pt; margin-bottom: 4mm; }

  /* Grid principal */
  .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 3mm; margin-bottom: 3mm; }
  .field { border: 0.5pt solid #000; padding: 2mm; position: relative; min-height: 12mm; }
  .field-label { position: absolute; top: -3mm; left: 2mm; background: white; padding: 0 2mm; font-size: 8pt; font-weight: bold; }

  /* Sección 4-5 */
  .section-45 { display: grid; grid-template-columns: 1fr 40mm; gap: 3mm; margin-bottom: 3mm; }
  .solicitud { border: 0.5pt solid #000; padding: 2mm; position: relative; min-height: 25mm; }
  .firma { border: 0.5pt solid #000; padding: 2mm; position: relative; min-height: 25mm; }

  /* Discrepancias */
  .discrepancias { border: 0.5pt solid #000; padding: 2mm; margin-bottom: 3mm; position: relative; min-height: 15mm; }
  .discrepancias-label { position: absolute; top: -3mm; left: 2mm; background: white; padding: 0 2mm; font-size: 8pt; font-weight: bold; }

  /* Autorización */
  .autorizacion { text-align: center; font-size: 9pt; margin: 4mm 0; padding: 0 5mm; }

  /* Sección 1 - Reporte */
  .seccion-reporte { border: 0.5pt solid #000; padding: 2mm; margin-bottom: 3mm; position: relative; min-height: 25mm; }
  .seccion-label { position: absolute; top: -3mm; left: 2mm; background: white; padding: 0 2mm; font-size: 8pt; font-weight: bold; }

  /* Sección 2 - Acciones Tomadas */
  .seccion-acciones { border: 0.5pt solid #000; padding: 2mm; margin-bottom: 3mm; position: relative; min-height: 35mm; }
  
  /* Lista de acciones */
  .lista-acciones { margin-top: 2mm; }
  .accion-item { margin-bottom: 3mm; padding-bottom: 2mm; border-bottom: 0.5pt solid #ccc; }
  .accion-desc { margin-bottom: 2mm; }
  .accion-datos { display: flex; gap: 3mm; font-size: 8pt; }
  .dato-box { border: 0.5pt solid #000; padding: 1mm 2mm; min-width: 25mm; }

  /* Fecha cierre */
  .cierre { display: grid; grid-template-columns: 1fr 40mm; gap: 3mm; margin-top: 5mm; }
  .fecha-cierre { border: 0.5pt solid #000; padding: 2mm; position: relative; min-height: 12mm; }

  /* Footer - POSICIÓN FIJA */
  .footer { position: absolute; bottom: 0; left: 0; right: 0; 
            display: flex; justify-content: space-between; 
            font-size: 8pt; margin-top: 15mm; }

  .mono { white-space: pre-wrap; font-family: monospace; }
  .bold { font-weight: bold; }
</style>
</head>
<body>

<div class="header">
  ${logoData ? `<img src="${logoData}" style="height: 15mm; margin-bottom: 2mm;">` : ''}
  <h1>SOLICITUD - ORDEN DE TRABAJO DISCREPANCIAS</h1>
  <div class="fecha">Fecha: ${escapeHTML(fmtUY(new Date()))}</div>
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
  <div class="seccion-label">2 Acciones Tomadas</div>
  <div class="lista-acciones">
    ${accionesTomadas.map((accion, index) => `
      <div class="accion-item">
        <div class="accion-desc">${escapeHTML(accion.descripcion)}</div>
        <div class="accion-datos">
          <div class="dato-box">${escapeHTML(accion.rol)}: ${escapeHTML(accion.tecnico)}</div>
          <div class="dato-box">Certific.: ${escapeHTML(accion.certificador)}</div>
          <div class="dato-box">H.H: ${escapeHTML(accion.horas)}</div>
        </div>
      </div>
    `).join('')}
    ${accionesTomadas.length === 0 ? `
      <div class="accion-item">
        <div class="accion-desc"></div>
        <div class="accion-datos">
          <div class="dato-box">TÉCNICO:</div>
          <div class="dato-box">Certific.:</div>
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

<!-- Footer - POSICIÓN FIJA -->
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
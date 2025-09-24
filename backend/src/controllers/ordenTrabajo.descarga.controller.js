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

  // Partir texto por viñetas/saltos de línea y limpiar
  const splitBullets = (txt) => {
    if (!txt) return [];
    const s = String(txt).replace(/\r/g, '\n');
    // separa por líneas que empiecen con *, •, -, o por saltos dobles
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

    // snapshots
    const avSnap   = normalizeSnap(orden.datosAvionSnapshot);
    const compSnap = normalizeSnap(orden.datosComponenteSnapshot);
    const propSnap = normalizeSnap(orden.datosPropietarioSnapshot);
    const discrep  = normalizeSnap(orden.discrepanciasSnapshot) || {};

    // cabecera
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

    const firmaTexto = [escapeHTML(propName), escapeHTML(propEmail)].filter(Boolean).join('<br/>');

    // texto base (solicitud y observaciones)
    const solicitudBruta = orden.OTsolicitud || orden.solicitud || orden.descripcionTrabajo || orden.descripcion || '';
    const solicitudBullets = splitBullets(solicitudBruta);
    const observBullets = splitBullets(orden.observaciones || '');

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

    // filas 1-4 (una tarea por fila)
    const regs = Array.isArray(orden.registrosTrabajo) ? orden.registrosTrabajo : [];
    const filas = [];

    for (let i = 0; i < Math.min(4, regs.length); i++) {
      const r = regs[i];
      const nombre = [r?.empleado?.nombre, r?.empleado?.apellido].filter(Boolean).join(' ').trim();
      filas.push({
        num: i + 1,
        reporte: escapeHTML(r?.trabajoRealizado || r?.detalle || r?.descripcion || ''),
        accion: escapeHTML(r?.accionTomada || orden?.accionTomada || ''),
        tecnico: escapeHTML(nombre || (tecnicos[0] || '')),
        certificador: escapeHTML(certificadores[0] || ''),
        hh: escapeHTML(String(r?.horas ?? r?.cantidadHoras ?? ''))
      });
    }
    // Completar con viñetas de solicitud (una por fila) si faltan filas o reportes vacíos
    for (let i = 0; i < 4; i++) {
      if (!filas[i]) filas[i] = { num: i + 1, reporte: '', accion: '', tecnico: '', certificador: '', hh: '' };
      if (!filas[i].reporte && solicitudBullets[i]) filas[i].reporte = escapeHTML(solicitudBullets[i]);
    }

    // A/B: discrepancias = observaciones si no hay snapshot
    const A = Object.assign({ texto: '', accion: '', tecnico: '', certificador: '', hh: '' }, discrep?.A || {});
    const B = Object.assign({ texto: '', accion: '', tecnico: '', certificador: '', hh: '' }, discrep?.B || {});
    if (!A.texto && observBullets[0]) A.texto = escapeHTML(observBullets[0]);
    if (!B.texto && observBullets[1]) B.texto = escapeHTML(observBullets[1]);

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
  body { font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; color: #000; }

  .row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 3mm; }
  .box { border: 0.35pt solid #000; padding: 2mm; position: relative; }
  .label { position:absolute; top: -3mm; left: 2mm; background:#fff; padding: 0 1mm; font-size: 8pt; font-weight: 700; }
  .half .label { top: -1.4mm; }

  /* Header más alto y H1 más abajo para despegar del logo */
  .hdr { position:relative; height: 24mm; margin-bottom: 2mm; }
  .logo { position:absolute; left:0; top:1mm; width:30mm; }
  .meta { position: absolute; top: 0; right: 0; width: 55mm; height: 18mm; border: 0.35pt solid #000; padding: 2mm; font-size: 8.5pt; }
  .meta .ca { position: absolute; top: 2mm; right: 3mm; font-weight: 700; }
  .h1 { position:absolute; top: 6mm; left: 34mm; right: 58mm; font-weight: 700; font-size: 13.5pt; line-height: 1.05; margin: 0; }

  .topline { border-top: 0.35pt solid #000; margin-top: 3mm; }
  .mono { white-space: pre-wrap; }

  /* Items 1–4 (más altos y con anti "doble línea") */
  .items { margin-top: 5mm; } /* baja el bloque para que se vea el texto previo completo */
  .item { display: grid; grid-template-columns: 12mm 1fr; gap: 2mm; height: 28mm; margin-bottom: 2.2mm; }
  .item .num { border: 0.35pt solid #000; display:flex; align-items:center; justify-content:center; font-weight:700; }
  .half { border-left: 0.35pt solid #000; border-right: 0.35pt solid #000; position: relative; padding: 3mm 2mm 10mm 2mm; }
  .half:first-child { border-top: 0.35pt solid #000; }
  .half:last-child { border-bottom: 0.35pt solid #000; margin-top: 1mm; }
  /* Evita doble línea entre items: el primer half del siguiente item no dibuja top */
  .items .item + .item .half:first-child { border-top-width: 0; }

  /* Mini-cajas más grandes y texto más arriba para no superponer bordes */
  .mini-wrap { position:absolute; right: 2mm; bottom: -9mm; display:flex; gap: 2mm; }
  .mini { border: 0.35pt solid #000; padding: 1.2mm 3mm; font-size: 7.6pt; height: 8.5mm; line-height: 1; display:inline-block; }
  .mini .val { display:block; font-size: 7.3pt; margin-top: 0.6mm; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .mini-tech { min-width: 36mm; }
  .mini-cert { min-width: 32mm; }
  .mini-hh   { min-width: 24mm; text-align: right; }

  /* Sección A/B (ligeramente más alta y sin doble línea entre A y B) */
  .ab { display: grid; grid-template-columns: 12mm 1fr; gap: 2mm; height: 24mm; margin-bottom: 2.2mm; }
  .ab .half { border-left: 0.35pt solid #000; border-right: 0.35pt solid #000; position: relative; padding: 3mm 2mm 10mm 2mm; }
  .ab .half:first-child { border-top: 0.35pt solid #000; }
  .ab .half:last-child { border-bottom: 0.35pt solid #000; margin-top: 1mm; }
  .ab + .ab .half:first-child { border-top-width: 0; } /* evita doble línea entre A y B */

  .footer { margin-top: 4mm; display:flex; justify-content: space-between; font-size:8.8pt; }
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
  <div class="box" style="height: 22mm;"><div class="label">5 Firma o email</div>
    <div class="mono" style="line-height: 1.2;">${firmaTexto}</div></div>
</div>

<!-- Texto intermedio (con más margen abajo) -->
<div style="margin: 4mm 0 3mm 0; font-size: 9pt; line-height:1.15;">
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
          <div class="mono" style="line-height:1.2;">${f.reporte}</div>
          <div class="mini-wrap">
            <div class="mini mini-tech">8 Técnico<span class="val">${f.tecnico}</span></div>
          </div>
        </div>
        <div class="half">
          <div class="label">7 Acción Tomada</div>
          <div class="mono" style="line-height:1.2;">${f.accion}</div>
          <div class="mini-wrap">
            <div class="mini mini-cert">9 Certific.<span class="val">${f.certificador}</span></div>
            <div class="mini mini-hh">10 H.H<span class="val">${f.hh}</span></div>
          </div>
        </div>
      </div>
    </div>
  `).join('')}
</div>

<!-- A/B -->
${[['A', A], ['B', B]].map(([tag, r]) => `
  <div class="ab">
    <div class="num" style="border:0.35pt solid #000; display:flex; align-items:center; justify-content:center; font-weight:700;">${tag}</div>
    <div>
      <div class="half">
        <div class="label">11 Discrepancias encontradas</div>
        <div class="mono" style="line-height:1.2;">${escapeHTML(r?.texto || '')}</div>
        <div class="mini-wrap"><div class="mini mini-tech">8 Técnico<span class="val">${escapeHTML(r?.tecnico || '')}</span></div></div>
      </div>
      <div class="half">
        <div class="label">12 Acción Tomada</div>
        <div class="mono" style="line-height:1.2;">${escapeHTML(r?.accion || '')}</div>
        <div class="mini-wrap">
          <div class="mini mini-cert">9 Certific.<span class="val">${escapeHTML(r?.certificador || '')}</span></div>
          <div class="mini mini-hh">10 H.H<span class="val">${escapeHTML(String(r?.hh ?? ''))}</span></div>
        </div>
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

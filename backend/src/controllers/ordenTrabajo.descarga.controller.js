// src/controllers/ordenTrabajo.descarga.controller.js (ESM)
import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

export const descargarOrdenPDF = async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);

  // Helpers basicos
  const drawLine = (doc) => {
    doc.moveTo(doc.x, doc.y + 5)
      .lineTo(550, doc.y + 5)
      .strokeColor('#e2e8f0')
      .stroke()
      .fillColor('#000')
      .moveDown(0.6);
  };

  const fmtLocal = (d) => {
    if (!d) return '-';
    const dt = new Date(d);
    if (isNaN(dt)) return '-';
    return dt.toLocaleDateString('es-UY');
  };

  const fmtISO = (d) => {
    if (!d) return '-';
    const dd = new Date(d);
    if (isNaN(dd)) return '-';
    const y = dd.getUTCFullYear();
    const m = String(dd.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dd.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Normaliza posibles snapshots guardados como string JSON
  const normalizeSnap = (val) => {
    if (!val) return null;
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        return parsed ?? null;
      } catch {
        return null;
      }
    }
    return val;
  };

  const nombrePropietario = (p) => {
    if (!p) return '-';
    const tipo = (p.tipoPropietario || '').toUpperCase();
    if (tipo === 'INSTITUCION') {
      return p.nombreEmpresa || '-';
    }
    const full = [p.nombre, p.apellido].filter(Boolean).join(' ').trim();
    return full || '-';
  };

  // Acepta array de objetos pivot { propietario: {...} }, array directo, o strings
  const propietariosTexto = (lista) => {
    if (!Array.isArray(lista) || !lista.length) return '-';
    return lista
      .map((x) => {
        if (typeof x === 'string') {
          // Si el item viene serializado, intento parsear
          const maybe = normalizeSnap(x);
          if (maybe) return nombrePropietario(maybe);
          return x;
        }
        const p = x?.propietario ?? x;
        return nombrePropietario(p);
      })
      .filter(Boolean)
      .join(', ');
  };

  const toolLabel = (h) => {
    const nombre = h?.nombre ?? '-';
    const marca = (h?.marca || '').trim();
    const modelo = (h?.modelo || '').trim();
    let dentro = '';
    if (marca && modelo) dentro = `${marca} ${modelo}`;
    else if (modelo) dentro = modelo;
    return dentro ? `${nombre} (${dentro})` : nombre;
  };

  const pintarPropietario = (doc, p) => {
    if (!p) {
      doc.fillColor('#666').text('Sin datos de propietario').fillColor('#000');
      return;
    }
    const tipo = (p.tipoPropietario || '').toUpperCase();
    if (tipo === 'INSTITUCION') {
      doc.text(`Razon Social / Empresa: ${p.nombreEmpresa || '-'}`);
    } else {
      doc.text(`Nombre: ${[p.nombre, p.apellido].filter(Boolean).join(' ') || '-'}`);
    }
    if (p.rut || p.cedula) doc.text(`RUT/Cedula: ${p.rut ?? p.cedula}`);
    if (p.email) doc.text(`Email: ${p.email}`);
    if (p.telefono) doc.text(`Telefono: ${p.telefono}`);
  };

  try {
    if (!id) return res.status(400).json({ error: 'ID invalido' });

    const orden = await prisma.ordenTrabajo.findUnique({
      where: { id },
      include: {
        stockAsignado:     { include: { stock: true } },
        herramientas:      { include: { herramienta: true } },
        empleadosAsignados:{ include: { empleado: true } },
        registrosTrabajo:  { orderBy: { fecha: 'asc' }, include: { empleado: true } },
        avion: {
          include: {
            ComponenteAvion: true,
            propietarios: { include: { propietario: true } }
          }
        },
        componente: { include: { propietario: true } }
      }
    });

    if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });

    // Solo permitir CERRADA o CANCELADA (puede estar archivada como booleano aparte)
    const estado = orden.estadoOrden || '';
    if (!['CERRADA', 'CANCELADA'].includes(estado)) {
      return res.status(400).json({ error: 'La descarga solo esta disponible para ordenes CERRADAS o CANCELADAS' });
    }

    // Preferencia por snapshots (normalizados por si llegan como texto)
    const avSnap        = normalizeSnap(orden.datosAvionSnapshot);
    const compSnap      = normalizeSnap(orden.datosComponenteSnapshot);
    const propSnap      = normalizeSnap(orden.datosPropietarioSnapshot);
    const herramientasSnap = normalizeSnap(orden.datosHerramientasSnapshot);
    const stockSnap        = normalizeSnap(orden.datosStockSnapshot);
    const personalSnap     = normalizeSnap(orden.datosPersonalSnapshot);

    const trabajoEnAvion = !!avSnap || !!orden.avionId;

    // PDF
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const filename = `orden-${id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    doc.pipe(res);

    // Logo (opcional)
    try {
      const logoPath = path.join(process.cwd(), 'public', 'celcol-logo.jpeg');
      if (fs.existsSync(logoPath)) doc.image(logoPath, 40, 30, { width: 80 });
    } catch {}

    // Header
    doc.fontSize(18).text('Celcol | Orden de Trabajo', 130, 40);
    doc.moveDown(2);

    doc.fontSize(16).text(`OT Nro ${orden.numero ?? orden.id}`, { underline: true });
    doc.fontSize(12).moveDown(0.5);
    doc.text(`Estado: ${estado}`);
    doc.text(`Fecha de apertura: ${fmtLocal(orden.fechaApertura)}`);
    if (estado === 'CERRADA') {
      doc.text(`Fecha de cierre: ${fmtLocal(orden.fechaCierre)}`);
    } else {
      doc.text(`Fecha de cancelacion: ${fmtLocal(orden.fechaCancelacion)}`);
    }
    if (orden.archivada === true) {
      doc.text('Archivada: Si');
    }
    doc.moveDown();

    // Entidad (sin propietario si es avion)
    if (trabajoEnAvion) {
      doc.fontSize(14).text('Datos del avion (snapshot)');
      drawLine(doc);
      doc.fontSize(12);

      const av = avSnap;
      if (av) {
        doc.text(`Matricula: ${av.matricula ?? '-'}`);
        doc.text(`Marca / Modelo: ${av.marca ?? '-'} ${av.modelo ?? ''}`);
        if (av.numeroSerie) doc.text(`Nro de serie: ${av.numeroSerie}`);
        if (av.TSN != null) doc.text(`TSN: ${av.TSN}`);
      } else if (orden.avion) {
        const a = orden.avion;
        doc.text(`Matricula: ${a.matricula ?? '-'}`);
        doc.text(`Marca / Modelo: ${a.marca ?? '-'} ${a.modelo ?? ''}`);
      } else {
        doc.fillColor('#666').text('Sin snapshot disponible').fillColor('#000');
      }
      doc.moveDown();
    } else {
      doc.fontSize(14).text('Componente externo (snapshot)');
      drawLine(doc);
      doc.fontSize(12);

      const comp = compSnap || orden.componente || null;
      if (comp) {
        doc.text(`Tipo: ${comp.tipo ?? '-'}`);
        doc.text(`Marca / Modelo: ${comp.marca ?? '-'} ${comp.modelo ?? ''}`);
        const serie = comp.numeroSerie ?? '-';
        const parte = comp.numeroParte ?? '-';
        doc.text(`Nro de serie / parte: ${serie} / ${parte}`);
        if (comp.TSN != null) doc.text(`TSN: ${comp.TSN}`);
      } else {
        doc.fillColor('#666').text('Sin snapshot disponible').fillColor('#000');
      }
      doc.moveDown();

      // Propietario (solo para componente externo)
      doc.fontSize(14).text('Propietario (al cierre)');
      drawLine(doc);
      doc.fontSize(12);

      if (propSnap) {
        if (Array.isArray(propSnap)) {
          doc.text(`Propietario(s): ${propietariosTexto(propSnap)}`);
        } else {
          pintarPropietario(doc, propSnap);
        }
      } else if (orden.componente?.propietario) {
        pintarPropietario(doc, orden.componente.propietario);
      } else {
        doc.fillColor('#666').text('Sin datos de propietario').fillColor('#000');
      }
      doc.moveDown();
    }

    // Datos de solicitud (sin archivo ni firma)
    doc.fontSize(14).text('Datos de solicitud');
    drawLine(doc);
    doc.fontSize(12);
    doc.text(`Solicitado por: ${orden.solicitadoPor ?? '-'}`);
    doc.text(`Descripcion del trabajo solicitado: ${orden.solicitud ?? orden.descripcionTrabajo ?? '-'}`);
    const flag = !!orden.inspeccionRecibida;
    doc.text(`Inspeccion recibida: ${flag ? 'Si' : 'No'}`);
    if (orden.danosPrevios) doc.text(`Danos previos: ${orden.danosPrevios}`);
    if (orden.accionTomada) doc.text(`Accion tomada: ${orden.accionTomada}`);
    if (orden.observaciones) doc.text(`Observaciones: ${orden.observaciones}`);
    doc.moveDown();

    // Herramientas (snapshot primero)
    doc.fontSize(14).text('Herramientas asignadas');
    drawLine(doc);
    doc.fontSize(12);
    const herramientasLista = Array.isArray(herramientasSnap) ? herramientasSnap : (orden.herramientas || []);
    if (herramientasLista.length) {
      herramientasLista.forEach((h) => {
        const base = h?.herramienta ?? h;
        const label = toolLabel(base);
        const fv = base?.fechaVencimiento || base?.vencimiento || base?.fechaCalibracion || null;
        const venc = fv ? `  Vence: ${fmtISO(fv)}` : '';
        doc.text(`- ${label}${venc}`);
      });
    } else {
      doc.fillColor('#666').text('-').fillColor('#000');
    }
    doc.moveDown();

    // Stock (snapshot primero)
    doc.fontSize(14).text('Stock utilizado');
    drawLine(doc);
    doc.fontSize(12);
    const stockLista = Array.isArray(stockSnap) ? stockSnap : (orden.stockAsignado || []);
    if (stockLista.length) {
      stockLista.forEach((s) => {
        const nombre = s?.nombre ?? s?.codigo ?? s?.stock?.nombre ?? s?.stock?.codigo ?? 'Item';
        const cant = s?.cantidadUtilizada ?? s?.cantidad ?? '-';
        doc.text(`- ${nombre}  Cantidad: ${cant}`);
      });
    } else {
      doc.fillColor('#666').text('-').fillColor('#000');
    }
    doc.moveDown();

    // Personal (snapshot primero)
    doc.fontSize(14).text('Personal asignado');
    drawLine(doc);
    doc.fontSize(12);
    const personalLista = Array.isArray(personalSnap) ? personalSnap : (orden.empleadosAsignados || []);
    if (personalLista.length) {
      const toNombre = (item) => {
        const n = item?.nombre ?? item?.empleado?.nombre;
        const a = item?.apellido ?? item?.empleado?.apellido;
        const full = [n, a].filter(Boolean).join(' ').trim();
        return full || '-';
      };
      const rolOf = (it) => (it?.rol || '').toUpperCase();

      const tecnicos = personalLista.filter((a) => rolOf(a) === 'TECNICO').map(toNombre).filter(Boolean);
      const certificadores = personalLista.filter((a) => rolOf(a) === 'CERTIFICADOR').map(toNombre).filter(Boolean);

      doc.text(`Tecnicos: ${tecnicos.length ? tecnicos.join(', ') : '-'}`);
      doc.text(`Certificadores: ${certificadores.length ? certificadores.join(', ') : '-'}`);
    } else {
      doc.fillColor('#666').text('-').fillColor('#000');
    }
    doc.moveDown();

    // Registros de trabajo
    if (Array.isArray(orden.registrosTrabajo) && orden.registrosTrabajo.length) {
      doc.fontSize(14).text('Registros de trabajo');
      drawLine(doc);
      doc.fontSize(12);
      orden.registrosTrabajo.forEach((r) => {
        const nombre = [r?.empleado?.nombre, r?.empleado?.apellido].filter(Boolean).join(' ').trim() || '-';
        const rol = r?.rol || '-';
        const horas = r?.horas ?? r?.cantidadHoras ?? '-';
        const desc = r?.trabajoRealizado || r?.detalle || r?.descripcion || '-';
        doc.text(`- ${fmtISO(r?.fecha)}  ${nombre} (${rol})  Horas: ${horas}  ${desc}`);
      });
      doc.moveDown();
    }

    doc.end();
  } catch (error) {
    console.error('Error al generar PDF de OT:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Error al generar el PDF' });
  }
};

// src/controllers/stock.controller.js (ESM)
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { subirArchivoGenerico } from '../utils/archivoupload.js';
import { stockEnOtAbierta } from '../services/archiveGuards.js';
import { archivoStorage } from '../services/archivo.service.js';
import { createHash } from 'node:crypto';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Helper para crear/actualizar aviso de stock bajo (upsert)
async function upsertAvisoStockBajo(prisma, stockId, nombre, cantidad) {
  const mensaje = `El producto "${nombre}" alcanzó el stock mínimo (${cantidad} unidades)`;
  // Requiere @@unique([tipo, stockId], name: "tipo_stockId") en el modelo Aviso
  await prisma.aviso.upsert({
    where: { tipo_stockId: { tipo: 'stock', stockId } },
    create: { tipo: 'stock', stockId, mensaje, leido: false },
    update: { mensaje, creadoEn: new Date(), leido: false },
  });
}


// ========== Subida genérica de archivo ==========
export const subirArchivoStock = (req, res) =>
  subirArchivoGenerico({
    req,
    res,
    modeloPrisma: prisma.stock,
    campoArchivo: 'archivo',
    nombreRecurso: 'Stock',
  });

// ========== CREATE ==========
export const crearStock = async (req, res) => {
  try {
    console.log('🔵 Crear producto de stock – Datos recibidos:', req.body);
    const {
      nombre, tipoProducto, codigoBarras, notasInternas,
      marca, modelo, numeroSerie,
      puedeSerVendido, puedeSerComprado,
      precioVenta, coste,
      unidadMedida, cantidad, stockMinimo, fechaIngreso
    } = req.body;

    if (!nombre || !cantidad || !stockMinimo) {
      console.warn('⚠️ Faltan campos obligatorios');
      return res.status(400).json({ error: 'Faltan campos obligatorios: nombre, cantidad o stockMinimo' });
    }

    // Construimos SOLO con campos válidos del modelo Stock
    const data = {
      nombre,
      tipoProducto: tipoProducto || null,
      codigoBarras: codigoBarras || null,
      notasInternas: notasInternas || null,
      marca: marca || null,
      modelo: modelo || null,
      numeroSerie: numeroSerie || null,
      puedeSerVendido: puedeSerVendido === 'true' || puedeSerVendido === true,
      puedeSerComprado: puedeSerComprado === 'true' || puedeSerComprado === true,
      precioVenta: parseFloat(precioVenta) || 0,
      coste: parseFloat(coste) || 0,
      unidadMedida: unidadMedida || null,
      cantidad: parseInt(cantidad, 10),
      stockMinimo: parseInt(stockMinimo, 10),
      // archivado: false, // opcional, ya tenés default(false) si lo pusiste en el schema
      // imagenId y archivoId NO se setean acá (no subimos archivos en create)
    };

    // Solo incluir fechaIngreso si viene definida (Prisma tiene @default(now()))
    if (fechaIngreso) {
      const f = new Date(fechaIngreso);
      if (!isNaN(f)) data.fechaIngreso = f;
    }

    const producto = await prisma.stock.create({ data });
    console.log('✅ Producto creado:', producto);

    // Aviso si stock bajo al crear (upsert) o limpiar si no aplica
    if (producto.cantidad <= producto.stockMinimo) {
      await upsertAvisoStockBajo(prisma, producto.id, producto.nombre, producto.cantidad);
      console.log('📣 Aviso de stock bajo (creación)');
    } else {
      await prisma.aviso.deleteMany({ where: { tipo: 'stock', stockId: producto.id } });
    }

    res.status(201).json(producto);
  } catch (error) {
    console.error('❌ Error al crear producto de stock:', error);
    res.status(500).json({ error: 'Error al crear producto de stock' });
  }
};

// ========== READ ALL ==========
export const listarStock = async (_req, res) => {
  try {
    console.log('🔍 Listando todos los productos de stock...');
    const items = await prisma.stock.findMany({ where: { archivado: false } });
    console.log(`✅ Se encontraron ${items.length} productos.`);
    res.json(items);
  } catch (error) {
    console.error('❌ Error al listar stock:', error);
    res.status(500).json({ error: 'Error al obtener productos del stock' });
  }
};

// GET /stock/:id?includeArchived=1
export const obtenerStock = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });

    const includeArchived = ['1', 'true', 'yes'].includes(String(req.query.includeArchived || '').toLowerCase());
    const where = includeArchived ? { id } : { id, archivado: false };

    const item = await prisma.stock.findFirst({
      where,
      include: {
        imagen: {
          select: { id: true, storageKey: true, mime: true, originalName: true, sizeAlmacen: true }
        },
        archivo: {
          select: { id: true, storageKey: true, mime: true, originalName: true, sizeAlmacen: true }
        },
        facturas: {
          include: {
            archivoRef: {
              select: { id: true, storageKey: true, mime: true, originalName: true, sizeAlmacen: true }
            }
          },
          orderBy: [{ fecha: 'desc' }, { creadoEn: 'desc' }],
        },
      },
    });

    if (!item) return res.status(404).json({ error: 'Producto no encontrado' });

    // Normalizamos facturas a un shape plano (archivo: ArchivoRef)
    const facturas = item.facturas.map(f => ({
      id: f.id,
      stockId: f.stockId,
      numero: f.numero,
      proveedor: f.proveedor,
      fecha: f.fecha,
      monto: f.monto,
      moneda: f.moneda,
      creadoEn: f.creadoEn,
      archivo: f.archivoRef ? {
        id: f.archivoRef.id,
        storageKey: f.archivoRef.storageKey,
        mime: f.archivoRef.mime,
        originalName: f.archivoRef.originalName,
        sizeAlmacen: f.archivoRef.sizeAlmacen,
      } : null,
    }));

    // Enviamos el stock con imagen/archivo (1:1) y facturas normalizadas
    res.json({
      ...item,
      facturas,
    });
  } catch (error) {
    console.error('❌ Error al obtener producto de stock:', error);
    return res.status(500).json({ error: 'Error al obtener el producto' });
  }
};


// ========== UPDATE ==========
export const actualizarStock = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    console.log(`🔄 Actualizando producto con ID: ${id}`);
    const {
      nombre, tipoProducto, codigoBarras, notasInternas,
      marca, modelo, numeroSerie,
      puedeSerVendido, puedeSerComprado,
      precioVenta, coste,
      unidadMedida, cantidad, stockMinimo, fechaIngreso
    } = req.body;

    const archivos = req.files || {};

    const productoActual = await prisma.stock.findUnique({ where: { id } });
    if (!productoActual) {
      console.warn('⚠️ Producto no encontrado para actualizar');
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    if (productoActual.archivado) {
      return res.status(400).json({ error: 'No se puede modificar un producto archivado' });
    }

    const nuevaImagen = archivos.imagen?.[0]?.path;
    const nuevoArchivo = archivos.archivo?.[0]?.path;

    if (nuevaImagen && productoActual.imagen && fs.existsSync(productoActual.imagen)) {
      fs.unlinkSync(productoActual.imagen);
    }
    if (nuevoArchivo && productoActual.archivo && fs.existsSync(productoActual.archivo)) {
      fs.unlinkSync(productoActual.archivo);
    }

    const cantidadNum = parseInt(cantidad);
    const stockMinimoNum = parseInt(stockMinimo);

   // Aviso si quedó en mínimo o por debajo; limpiar si ya superó el mínimo
if (cantidadNum <= (stockMinimoNum || 0)) {
  await upsertAvisoStockBajo(prisma, id, nombre, cantidadNum);
  console.log('📣 Aviso de stock bajo (actualización)');
} else {
  await prisma.aviso.deleteMany({ where: { tipo: 'stock', stockId: id } });
}


    const producto = await prisma.stock.update({
      where: { id },
      data: {
        nombre,
        tipoProducto: tipoProducto || null,
        codigoBarras: codigoBarras || null,
        notasInternas: notasInternas || null,
        marca: marca || null,
        modelo: modelo || null,
        numeroSerie: numeroSerie || null,
        puedeSerVendido: puedeSerVendido === 'true',
        puedeSerComprado: puedeSerComprado === 'true',
        precioVenta: parseFloat(precioVenta) || 0,
        coste: parseFloat(coste) || 0,
        unidadMedida: unidadMedida || null,
        cantidad: cantidadNum,
        stockMinimo: stockMinimoNum,
        fechaIngreso: fechaIngreso ? new Date(fechaIngreso) : undefined,
        ...(nuevaImagen && { imagen: nuevaImagen }),
        ...(nuevoArchivo && { archivo: nuevoArchivo }),
      },
    });

    console.log('✅ Producto actualizado:', producto);
    res.json(producto);
  } catch (error) {
    console.error('❌ Error al actualizar producto de stock:', error);
    res.status(500).json({ error: 'Error al actualizar el producto' });
  }
};

// ARCHIVAR STOCK (bloquea si está en OT abierta)
export const archivarStock = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const existe = await prisma.stock.findUnique({ where: { id }, select: { id: true } });
    if (!existe) return res.status(404).json({ error: 'Producto no encontrado' });

    const ot = await prisma.ordenStock.findFirst({
      where: { stockId: id, orden: { is: { estadoOrden: 'ABIERTA' } } },
      select: { ordenId: true },
    });
    if (ot) {
      return res.status(409).json({
        error: `No se puede archivar: este stock está consumido en una OT ABIERTA (OT ${ot.ordenId}).`,
      });
    }

    const out = await prisma.stock.update({
      where: { id },
      data: { archivado: true },
    });
    return res.json({ mensaje: 'Producto archivado correctamente', stock: out });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Producto no encontrado' });
    console.error('❌ Error al archivar stock:', error);
    return res.status(500).json({ error: 'Error al archivar el producto' });
  }
};




// POST /stock/:id/imagen
export const subirImagenStock = (req, res) =>
  subirArchivoGenerico({
    req,
    res,
    modeloPrisma: prisma.stock,
    campoArchivo: 'imagen',   // 👈 relación en Prisma
    nombreRecurso: 'Stock',
    borrarAnterior: true,     // reemplaza la imagen anterior
    prefix: 'stock',          // prefijo en la key
    campoParam: 'id',         // saca el id de req.params.id
  });



// ========== FACTURAS de STOCK ==========


function sha256Hex(buf) {
  return createHash('sha256').update(buf).digest('hex');
}


function safeFilename(name) {
  const base = String(name || 'factura').trim();
  const cleaned = base
    .replace(/\s+/g, '-')                // espacios por guiones
    .replace(/[^a-zA-Z0-9.\-_]/g, '');   // solo seguro
  // Evita quedar vacío
  return cleaned || `factura-${Date.now()}.bin`;
}





// Listar factura stock (GET /stock/:id/facturas)
export const listarPorStock = async (req, res) => {
  try {
    const stockId = Number(req.params.id);
    if (!Number.isFinite(stockId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    // 1) Traer facturas (1:N) con su Archivo relacionado
    const facturas = await prisma.facturaStock.findMany({
      where: { stockId },
      orderBy: [{ fecha: 'desc' }, { creadoEn: 'desc' }],
      include: {
        archivoRef: {
          select: {
            id: true,
            storageKey: true,
            mime: true,
            originalName: true,
            sizeAlmacen: true,
          },
        },
      },
    });

    // 2) Normalizar al shape usado por el front (archivo: ArchivoRef|null)
    const out = facturas.map((f) => ({
      id: f.id,
      stockId: f.stockId,
      numero: f.numero,
      proveedor: f.proveedor,
      fecha: f.fecha,
      monto: f.monto, // si es Decimal en Prisma vendrá como string
      moneda: f.moneda,
      creadoEn: f.creadoEn,
      archivo: f.archivoRef
        ? {
            id: f.archivoRef.id,
            storageKey: f.archivoRef.storageKey,
            mime: f.archivoRef.mime,
            originalName: f.archivoRef.originalName,
            sizeAlmacen: f.archivoRef.sizeAlmacen,
          }
        : null,
    }));

    // 3) Compatibilidad: si Stock aún tiene un archivo 1:1 (legacy), lo agregamos primero
    const stock = await prisma.stock.findUnique({
      where: { id: stockId },
      select: {
        fechaIngreso: true,
        archivo: {
          select: {
            id: true,
            storageKey: true,
            mime: true,
            originalName: true,
            sizeAlmacen: true,
          },
        },
      },
    });

    if (stock?.archivo) {
      out.unshift({
        id: `legacy-${stockId}`,
        stockId,
        numero: null,
        proveedor: null,
        fecha: stock.fechaIngreso ?? null,
        monto: null,
        moneda: null,
        creadoEn: stock.fechaIngreso ?? new Date(),
        archivo: {
          id: stock.archivo.id,
          storageKey: stock.archivo.storageKey,
          mime: stock.archivo.mime,
          originalName: stock.archivo.originalName,
          sizeAlmacen: stock.archivo.sizeAlmacen,
        },
        legacy: true,
      });
    }

    return res.json(out);
  } catch (e) {
    console.error('Error listando facturas de stock:', e);
    return res.status(500).json({ error: 'No se pudieron obtener las facturas' });
  }
};

// POST /stock/:id/facturas  (middleware: uploadUnico.single('archivo'))
export const crear = async (req, res) => {
  try {
    const stockId = Number(req.params.id);
    if (!Number.isFinite(stockId)) {
      return res.status(400).json({ error: 'ID de stock inválido' });
    }
    if (!req.file) return res.status(400).json({ error: 'Debe adjuntar un archivo' });

    const existe = await prisma.stock.findUnique({ where: { id: stockId } });
    if (!existe) return res.status(404).json({ error: 'Stock no encontrado' });

    // 1) crear Archivo (reutilizamos toda la robustez)
    const archivo = await crearArchivoDesdeFile({
      file: req.file,
      keyPrefix: 'stock/factura',
      keySuffix: `${stockId}`,     // queda: stock/factura/<stockId>/<ts>-<safeName>
      allow: ['application/pdf', 'image/*'], // ajustá si querés
      blockSvg: true,
      maxSizeMB: 20,
    });

    // 2) crear FacturaStock
    const { numero, proveedor, fecha, moneda } = req.body;
    const monto =
      req.body.monto !== undefined && req.body.monto !== '' && req.body.monto !== null
        ? String(req.body.monto)
        : null;

    const nuevo = await prisma.facturaStock.create({
      data: {
        stockId,
        numero: numero || null,
        proveedor: proveedor || null,
        fecha: fecha ? new Date(fecha) : null,
        monto,
        moneda: moneda || null,
        archivoId: archivo.id,
      },
      include: {
        archivoRef: {
          select: { id: true, storageKey: true, mime: true, originalName: true, sizeAlmacen: true, urlPublica: true },
        },
      },
    });

    return res.status(201).json(nuevo);
  } catch (e) {
    console.error('Error creando factura de stock:', e);
    return res.status(500).json({ error: 'No se pudo crear la factura' });
  }
};


// ELIMINAR Factura stock
export const eliminar = async (req, res) => {
  try {
    const facturaId = String(req.params.facturaId);

    // Soporte “legacy-<stockId>” (si lo seguís usando)
    if (facturaId.startsWith('legacy-')) {
      const stockId = Number(facturaId.slice('legacy-'.length));
      const stock = await prisma.stock.findUnique({
        where: { id: stockId },
        select: {
          archivoId: true,
          archivo: { select: { id: true, storageKey: true } }, // si en Stock aún tenés una 1:1 legacy
        },
      });
      if (!stock) return res.status(404).json({ error: 'Factura legacy no encontrada' });

      if (stock.archivo) {
        try {
          if (stock.archivo.storageKey) await archivoStorage.remove(stock.archivo.storageKey).catch(() => {});
          if (stock.archivoId) await prisma.archivo.delete({ where: { id: stock.archivoId } }).catch(() => {});
        } catch {}
        await prisma.stock.update({ where: { id: stockId }, data: { archivoId: null } });
        return res.json({ mensaje: 'Factura legacy eliminada (Archivo FK en Stock)' });
      }
      return res.status(404).json({ error: 'Factura legacy no encontrada' });
    }

    // Normal
    const id = Number(facturaId);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID de factura inválido' });

    const factura = await prisma.facturaStock.findUnique({
      where: { id },
      include: {
        archivoRef: { select: { id: true, storageKey: true } }, // 👈 relación correcta
      },
    });
    if (!factura) return res.status(404).json({ error: 'Factura no encontrada' });

    // Borrar archivo físico + fila Archivo
    if (factura.archivoRef) {
      try {
        if (factura.archivoRef.storageKey) {
          await archivoStorage.remove(factura.archivoRef.storageKey).catch(() => {});
        }
        await prisma.archivo.delete({ where: { id: factura.archivoId } }).catch(() => {});
      } catch {}
    }

    await prisma.facturaStock.delete({ where: { id } });
    return res.json({ mensaje: 'Factura eliminada' });
  } catch (e) {
    console.error('Error eliminando factura de stock:', e);
    return res.status(500).json({ error: 'No se pudo eliminar la factura' });
  }
};

// ACTUALIZAR Factura Stock
export const actualizar = async (req, res) => {
  try {
    const id = Number(req.params.facturaId);
    const { numero, proveedor, fecha, monto, moneda } = req.body;
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID de factura inválido' });

    const existe = await prisma.facturaStock.findUnique({ where: { id } });
    if (!existe) return res.status(404).json({ error: 'Factura no encontrada' });

    const actualizado = await prisma.facturaStock.update({
      where: { id },
      data: {
        numero: numero ?? null,
        proveedor: proveedor ?? null,
        fecha: fecha ? new Date(fecha) : null,
        monto: (monto !== undefined && monto !== '' && monto !== null) ? String(monto) : null,
        moneda: moneda ?? null,
      },
    });

    return res.json(actualizado);
  } catch (e) {
    console.error('Error actualizando factura de stock:', e);
    return res.status(500).json({ error: 'No se pudo actualizar la factura' });
  }
};


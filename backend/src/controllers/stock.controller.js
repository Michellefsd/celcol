// src/controllers/stock.controller.js (ESM)
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { PrismaClient } from '@prisma/client';
import { subirArchivoGenerico } from '../utils/archivoupload.js';
import { stockEnOtAbierta } from '../services/archiveGuards.js';

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

// ========== READ ONE (includeArchived + normalizar URLs) ==========
export const obtenerStock = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const includeArchived = ['1', 'true', 'yes'].includes(
      String(req.query.includeArchived || '').toLowerCase()
    );

    console.log(`🔍 Buscando producto con ID: ${id} (includeArchived=${includeArchived})`);

    const item = await prisma.stock.findUnique({ where: { id } });
    if (!item) {
      console.warn('⚠️ Producto no encontrado');
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    if (!includeArchived && item.archivado) {
      console.warn('⚠️ Producto archivado (no se muestra sin includeArchived)');
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const toAbs = (p) => {
      if (!p || typeof p !== 'string') return p;
      if (/^https?:\/\//i.test(p)) return p;
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const normalized = p.replace(/\\/g, '/').replace(/^\/+/, '');
      return `${baseUrl}/${normalized}`;
    };

    const out = {
      ...item,
      imagen: toAbs(item.imagen),
      archivo: toAbs(item.archivo),
    };

    console.log('✅ Producto encontrado:', { id: item.id, archivado: item.archivado });
    return res.json(out);
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

// ========== ARCHIVAR (bloquea si está en OT abierta) ==========
export const archivarStock = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const existe = await prisma.stock.findUnique({ where: { id } });
    if (!existe) return res.status(404).json({ error: 'Producto no encontrado' });

    if (await stockEnOtAbierta(id)) {
      return res.status(409).json({ error: 'No se puede archivar: este stock está consumido en OT abiertas' });
    }

    const out = await prisma.stock.update({
      where: { id },
      data: { archivado: true, archivedAt: new Date(), archivedBy: req.user?.sub || null },
    });
    res.json(out);
  } catch (error) {
    console.error('❌ Error al archivar stock:', error);
    res.status(500).json({ error: 'Error al archivar el producto' });
  }
};

export const subirImagenStock = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const file = req?.files?.imagen?.[0] ?? req?.file; // soporta fields o single
    if (!id || !file) return res.status(400).json({ error: 'Falta imagen o ID' });

    const stock = await prisma.stock.findUnique({
      where: { id },
      select: { imagenId: true, imagen: { select: { id: true, key: true } } },
    });
    if (!stock) return res.status(404).json({ error: 'Producto no encontrado' });

    // Obtener buffer (memoryStorage o diskStorage)
    const inputBuffer = file.buffer || await fs.readFile(file.path);

    // Optimizar a webp 420px
    const optimized = await sharp(inputBuffer)
      .resize({ width: 420 })
      .webp({ quality: 40 })
      .toBuffer();

    // Subir al storage (local/S3/R2 según archivoStorage)
    const safeName = (file.originalname || 'imagen.webp').replace(/\s+/g, '-').replace(/\.[^.]+$/, '') + '.webp';
    const put = await archivoStorage.put({
      buffer: optimized,
      contentType: 'image/webp',
      originalName: safeName,
      keyHint: `stock/imagen/${Date.now()}-${safeName}`,
    });

    // Crear registro Archivo
    const nuevo = await prisma.archivo.create({
      data: { key: put.key, url: put.url, mimeType: 'image/webp', size: optimized.length },
      select: { id: true },
    });

    // Limpiar anterior (si existía)
    if (stock.imagen) {
      try {
        if (stock.imagen.key) await archivoStorage.remove(stock.imagen.key).catch(() => {});
        await prisma.archivo.delete({ where: { id: stock.imagenId } }).catch(() => {});
      } catch {}
    }

    // Setear FK
    const actualizado = await prisma.stock.update({
      where: { id },
      data: { imagenId: nuevo.id },
      include: { imagen: true },
    });

    return res.json({ mensaje: 'Imagen subida y optimizada correctamente', producto: actualizado });
  } catch (error) {
    console.error('Error al subir imagen de stock:', error);
    return res.status(500).json({ error: 'Error al subir la imagen de stock' });
  }
};

// ========== FACTURAS de STOCK ==========

// Listar factura stock
export const listarPorStock = async (req, res) => {
  try {
    const stockId = Number(req.params.id);

    // 1) Traigo facturas; si ya migraste a archivoId, incluyo relación
    let facturas = await prisma.facturaStock.findMany({
      where: { stockId },
      orderBy: { creadoEn: 'desc' },
      include: { archivo: true }, // si todavía no existe esta relación, cae al catch
    }).catch(() =>
      prisma.facturaStock.findMany({
        where: { stockId },
        orderBy: { creadoEn: 'desc' },
      })
    );

    // 2) Normalizo para que SIEMPRE haya un campo 'archivo' STRING (URL o path legacy)
    facturas = facturas.map(f => ({
      id: f.id,
      stockId: f.stockId,
      numero: f.numero,
      proveedor: f.proveedor,
      fecha: f.fecha,
      monto: f.monto,
      moneda: f.moneda,
      creadoEn: f.creadoEn,
      archivo: f.archivo?.url ?? f.archivo ?? null, // ← URL si hay relación, sino string legacy
    }));

    // 3) Compat: si Stock tiene “factura” legacy, la pongo primera
    const stock = await prisma.stock.findUnique({
      where: { id: stockId },
      select: {
        fechaIngreso: true,
        // nuevo
        archivo: { select: { url: true } },
        // MUY legacy (string en columna vieja) → descomentar si aún existe en tu schema:
        // archivo: true,
      },
    });

    if (stock?.archivo) {
      facturas.unshift({
        id: `legacy-${stockId}`,
        stockId,
        numero: null,
        proveedor: null,
        fecha: stock.fechaIngreso ?? null,
        monto: null,
        moneda: null,
        creadoEn: stock.fechaIngreso ?? new Date(),
        archivo: stock.archivo.url ?? stock.archivo ?? null,
        legacy: true,
      });
    }

    res.json(facturas);
  } catch (e) {
    console.error('Error listando facturas de stock:', e);
    res.status(500).json({ error: 'No se pudieron obtener las facturas' });
  }
};


// crear factura stock
export const crear = async (req, res) => {
  try {
    const stockId = Number(req.params.id);
    const file = req.file; // uploadUnico.single('archivo')
    const { numero, proveedor, fecha, monto, moneda } = req.body;

    if (!file) return res.status(400).json({ error: 'Debe adjuntar un archivo' });

    const existe = await prisma.stock.findUnique({ where: { id: stockId } });
    if (!existe) return res.status(404).json({ error: 'Stock no encontrado' });

    const buffer = file.buffer || await fs.readFile(file.path);

    const put = await archivoStorage.put({
      buffer,
      contentType: file.mimetype,
      originalName: file.originalname,
      keyHint: `stock/factura/${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`,
    });

    const arch = await prisma.archivo.create({
      data: { key: put.key, url: put.url, mimeType: file.mimetype, size: buffer.length },
      select: { id: true },
    });

    const nuevo = await prisma.facturaStock.create({
      data: {
        stockId,
        numero: numero || null,
        proveedor: proveedor || null,
        fecha: fecha ? new Date(fecha) : null,
        monto: (monto !== undefined && monto !== '' && monto !== null) ? String(monto) : null, // si es Decimal
        moneda: moneda || null,
        archivoId: arch.id, // ⬅️ FK al Archivo (nuevo esquema)
      },
      include: { archivo: true },
    });

    return res.status(201).json(nuevo);
  } catch (e) {
    console.error('Error creando factura de stock:', e);
    return res.status(500).json({ error: 'No se pudo crear la factura' });
  }
};

// eliminar factura stock
export const eliminar = async (req, res) => {
  try {
    const facturaId = String(req.params.facturaId);

    // Legacy directo desde Stock (si agregaste esa fila "legacy" al listar)
    if (facturaId.startsWith('legacy-')) {
      const stockId = Number(facturaId.slice('legacy-'.length));
      const stock = await prisma.stock.findUnique({
        where: { id: stockId },
        select: {
          // nuevo:
          archivoId: true,
          archivo: { select: { id: true, key: true } },
          // muy legacy string:
          // archivo: true,
        },
      });
      if (!stock) return res.status(404).json({ error: 'Factura legacy no encontrada' });

      // Nuevo (Archivo relacionado)
      if (stock.archivo) {
        try {
          if (stock.archivo.key) await archivoStorage.remove(stock.archivo.key).catch(() => {});
          await prisma.archivo.delete({ where: { id: stock.archivoId } }).catch(() => {});
        } catch {}
        await prisma.stock.update({ where: { id: stockId }, data: { archivoId: null } });
        return res.json({ mensaje: 'Factura legacy eliminada (Archivo FK)' });
      }

      // Muy legacy (string en columna vieja)
      // if (stock.archivo) {
      //   const absPath = path.join(process.cwd(), stock.archivo);
      //   if (fs.existsSync(absPath)) fs.unlinkSync(absPath);
      //   await prisma.stock.update({ where: { id: stockId }, data: { archivo: null } });
      //   return res.json({ mensaje: 'Factura legacy eliminada (path string)' });
      // }

      return res.status(404).json({ error: 'Factura legacy no encontrada' });
    }

    // Normal
    const id = Number(facturaId);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID de factura inválido' });

    const factura = await prisma.facturaStock.findUnique({
      where: { id },
      include: { archivo: true }, // si ya migraste a archivoId
    });

    if (!factura) return res.status(404).json({ error: 'Factura no encontrada' });

    // Borrar archivo de storage + fila Archivo (si aplica)
    if (factura.archivo) {
      try {
        if (factura.archivo.key) await archivoStorage.remove(factura.archivo.key).catch(() => {});
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

// actualizar factura stock
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

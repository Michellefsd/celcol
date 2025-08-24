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

    const archivos = req.files;

    if (!nombre || !cantidad || !stockMinimo) {
      console.warn('⚠️ Faltan campos obligatorios');
      return res.status(400).json({ error: 'Faltan campos obligatorios: nombre, cantidad o stockMinimo' });
    }

    const producto = await prisma.stock.create({
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
        cantidad: parseInt(cantidad),
        stockMinimo: parseInt(stockMinimo),
        fechaIngreso: fechaIngreso ? new Date(fechaIngreso) : undefined,
        imagen: archivos?.imagen?.[0]?.path ?? null,
        archivo: archivos?.archivo?.[0]?.path ?? null,
      },
    });

    console.log('✅ Producto creado:', producto);

    // Aviso si stock bajo al crear
    if (producto.cantidad <= producto.stockMinimo) {
      const existeAviso = await prisma.aviso.findFirst({
        where: { stockId: producto.id, tipo: 'stock' },
      });

      if (!existeAviso) {
        await prisma.aviso.create({
          data: {
            mensaje: `El producto "${producto.nombre}" fue creado con stock mínimo (${producto.cantidad} unidades)`,
            leido: false,
            tipo: 'stock',
            stockId: producto.id,
          },
        });
        console.log('📣 Aviso creado por stock bajo al crear');
      } else {
        console.log('ℹ️ Aviso ya existente por stock bajo');
      }
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

    // Aviso stock bajo
    if (cantidadNum <= (stockMinimoNum || 0)) {
      const existeAviso = await prisma.aviso.findFirst({
        where: { stockId: id, tipo: 'stock' },
      });
      if (!existeAviso) {
        await prisma.aviso.create({
          data: {
            mensaje: `El producto "${nombre}" alcanzó el stock mínimo (${cantidadNum} unidades)`,
            leido: false,
            tipo: 'stock',
            stockId: id,
          },
        });
        console.log('📣 Aviso creado por stock bajo');
      } else {
        console.log('ℹ️ Aviso ya existente por stock bajo');
      }
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

// ========== Subir/optimizar IMAGEN ==========
export const subirImagenStock = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const archivoOriginal = req.files?.imagen?.[0];

  if (!archivoOriginal) {
    return res.status(400).json({ error: 'No se proporcionó ninguna imagen' });
  }

  try {
    const producto = await prisma.stock.findUnique({ where: { id } });
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    if (producto.imagen && fs.existsSync(producto.imagen)) {
      fs.unlinkSync(producto.imagen);
    }

    const nombreFinal = `uploads/img-${Date.now()}.webp`;

    await sharp(archivoOriginal.path)
      .resize({ width: 420 })
      .webp({ quality: 40 })
      .toFile(nombreFinal);

    fs.unlinkSync(archivoOriginal.path);

    const actualizado = await prisma.stock.update({
      where: { id },
      data: { imagen: nombreFinal },
    });

    res.json({ mensaje: 'Imagen subida y optimizada correctamente', producto: actualizado });
  } catch (error) {
    console.error('Error al subir imagen de stock:', error);
    res.status(500).json({ error: 'Error al subir la imagen de stock' });
  }
};

// ========== FACTURAS de STOCK ==========

// Listar facturas por item de stock (compat “legacy”)
export const listarPorStock = async (req, res) => {
  const stockId = parseInt(req.params.id, 10);
  try {
    const [stock, facturas] = await Promise.all([
      prisma.stock.findUnique({ where: { id: stockId } }),
      prisma.facturaStock.findMany({
        where: { stockId },
        orderBy: { creadoEn: 'desc' },
      }),
    ]);

    if (stock?.archivo) {
      facturas.unshift({
        id: `legacy-${stockId}`,
        stockId,
        numero: null,
        proveedor: null,
        fecha: stock.fechaIngreso ?? null,
        monto: null,
        moneda: null,
        archivo: stock.archivo,
        creadoEn: stock.fechaIngreso ?? new Date(),
        legacy: true,
      });
    }

    res.json(facturas);
  } catch (e) {
    console.error('Error listando facturas de stock:', e);
    res.status(500).json({ error: 'No se pudieron obtener las facturas' });
  }
};

// Crear factura (uploadUnico.single('archivo'))
export const crear = async (req, res) => {
  const stockId = parseInt(req.params.id, 10);
  const file = req.file;
  const { numero, proveedor, fecha, monto, moneda } = req.body;

  if (!file) return res.status(400).json({ error: 'Debe adjuntar un archivo' });

  try {
    const existe = await prisma.stock.findUnique({ where: { id: stockId } });
    if (!existe) return res.status(404).json({ error: 'Stock no encontrado' });

    const nuevo = await prisma.facturaStock.create({
      data: {
        stockId,
        numero: numero || null,
        proveedor: proveedor || null,
        fecha: fecha ? new Date(fecha) : null,
        monto: monto ? Number(monto) : null,
        moneda: moneda || null,
        archivo: `uploads/${file.filename}`,
      },
    });

    res.status(201).json(nuevo);
  } catch (e) {
    console.error('Error creando factura de stock:', e);
    res.status(500).json({ error: 'No se pudo crear la factura' });
  }
};

// Eliminar factura (soporta legacy)
export const eliminar = async (req, res) => {
  const facturaId = req.params.facturaId;

  try {
    // Legacy
    if (String(facturaId).startsWith('legacy-')) {
      const stockId = parseInt(String(facturaId).split('legacy-')[1], 10);
      const stock = await prisma.stock.findUnique({ where: { id: stockId } });
      if (!stock || !stock.archivo) return res.status(404).json({ error: 'Factura legacy no encontrada' });

      const absPath = path.join(process.cwd(), stock.archivo);
      if (fs.existsSync(absPath)) fs.unlinkSync(absPath);

      await prisma.stock.update({ where: { id: stockId }, data: { archivo: null } });
      return res.json({ mensaje: 'Factura legacy eliminada' });
    }

    // Normal
    const id = parseInt(facturaId, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID de factura inválido' });

    const factura = await prisma.facturaStock.findUnique({ where: { id } });
    if (!factura) return res.status(404).json({ error: 'Factura no encontrada' });

    const absPath = path.join(process.cwd(), factura.archivo);
    if (fs.existsSync(absPath)) fs.unlinkSync(absPath);

    await prisma.facturaStock.delete({ where: { id } });
    res.json({ mensaje: 'Factura eliminada' });
  } catch (e) {
    console.error('Error eliminando factura de stock:', e);
    res.status(500).json({ error: 'No se pudo eliminar la factura' });
  }
};

// Actualizar factura
export const actualizar = async (req, res) => {
  const id = parseInt(req.params.facturaId, 10);
  const { numero, proveedor, fecha, monto, moneda } = req.body;

  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'ID de factura inválido' });
  }

  try {
    const existe = await prisma.facturaStock.findUnique({ where: { id } });
    if (!existe) return res.status(404).json({ error: 'Factura no encontrada' });

    const actualizado = await prisma.facturaStock.update({
      where: { id },
      data: {
        numero: numero ?? null,
        proveedor: proveedor ?? null,
        fecha: fecha ? new Date(fecha) : null,
        // Para Decimal en Prisma, usar string o null es lo más seguro
        monto: (monto !== undefined && monto !== '' && monto !== null) ? String(monto) : null,
        moneda: moneda ?? null,
      },
    });

    res.json(actualizado);
  } catch (e) {
    console.error('Error actualizando factura de stock:', e);
    res.status(500).json({ error: 'No se pudo actualizar la factura' });
  }
};

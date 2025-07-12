const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

// Prisma con logs detallados
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// CREATE
exports.crearStock = async (req, res) => {
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
    res.status(201).json(producto);
  } catch (error) {
    console.error('❌ Error al crear producto de stock:', error);
    res.status(500).json({ error: 'Error al crear producto de stock' });
  }
};

// READ ALL
exports.listarStock = async (req, res) => {
  try {
    console.log('🔍 Listando todos los productos de stock...');
    const items = await prisma.stock.findMany();
    console.log(`✅ Se encontraron ${items.length} productos.`);
    res.json(items);
  } catch (error) {
    console.error('❌ Error al listar stock:', error);
    res.status(500).json({ error: 'Error al obtener productos del stock' });
  }
};

// READ ONE
exports.obtenerStock = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    console.log(`🔍 Buscando producto con ID: ${id}`);
    const item = await prisma.stock.findUnique({ where: { id } });

    if (!item) {
      console.warn('⚠️ Producto no encontrado');
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const imagen = item.imagen ? `/uploads/${item.imagen.split('/').pop()}` : null;
    const archivo = item.archivo ? `/uploads/${item.archivo.split('/').pop()}` : null;

    console.log('✅ Producto encontrado:', item);
    res.json({ ...item, imagen, archivo });
  } catch (error) {
    console.error('❌ Error al obtener producto de stock:', error);
    res.status(500).json({ error: 'Error al obtener el producto' });
  }
};

// UPDATE
exports.actualizarStock = async (req, res) => {
  const id = parseInt(req.params.id);
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

    const nuevaImagen = archivos.imagen?.[0]?.path;
    const nuevoArchivo = archivos.archivo?.[0]?.path;

    if (nuevaImagen && productoActual.imagen && fs.existsSync(productoActual.imagen)) {
      fs.unlinkSync(productoActual.imagen);
    }

    if (nuevoArchivo && productoActual.archivo && fs.existsSync(productoActual.archivo)) {
      fs.unlinkSync(productoActual.archivo);
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
        cantidad: parseInt(cantidad),
        stockMinimo: parseInt(stockMinimo),
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

// DELETE
exports.eliminarStock = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    console.log(`🗑️ Eliminando producto con ID: ${id}`);
    await prisma.stock.delete({ where: { id } });
    console.log('✅ Producto eliminado');
    res.json({ mensaje: 'Producto eliminado del stock' });
  } catch (error) {
    console.error('❌ Error al eliminar producto:', error);
    res.status(500).json({ error: 'Error al eliminar el producto del stock' });
  }
};

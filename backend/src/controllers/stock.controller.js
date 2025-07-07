const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// CREATE
exports.crearStock = async (req, res) => {
  try {
    const {
      nombre, tipoProducto, codigoBarras, notasInternas,
      marca, modelo, numeroSerie,
      puedeSerVendido, puedeSerComprado,
      precioVenta, coste,
      unidadMedida, cantidad, stockMinimo, fechaIngreso
    } = req.body;

    const archivos = req.files;

    if (!nombre || !cantidad || !stockMinimo) {
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
        archivoFactura: archivos?.archivoFactura?.[0]?.path ?? null,
      },
    });

    res.status(201).json(producto);
  } catch (error) {
    console.error('Error al crear producto de stock:', error);
    res.status(500).json({ error: 'Error al crear producto de stock' });
  }
};

// READ ALL
exports.listarStock = async (req, res) => {
  try {
    const items = await prisma.stock.findMany();
    res.json(items);
  } catch (error) {
    console.error('Error al listar stock:', error);
    res.status(500).json({ error: 'Error al obtener productos del stock' });
  }
};

// READ ONE
exports.obtenerStock = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const item = await prisma.stock.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(item);
  } catch (error) {
    console.error('Error al obtener producto de stock:', error);
    res.status(500).json({ error: 'Error al obtener el producto' });
  }
};

// UPDATE
exports.actualizarStock = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const {
      nombre, tipoProducto, codigoBarras, notasInternas,
      marca, modelo, numeroSerie,
      puedeSerVendido, puedeSerComprado,
      precioVenta, coste,
      unidadMedida, cantidad, stockMinimo, fechaIngreso
    } = req.body;

    const archivos = req.files;

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
        ...(archivos?.imagen?.[0] && { imagen: archivos.imagen[0].path }),
        ...(archivos?.archivoFactura?.[0] && { archivoFactura: archivos.archivoFactura[0].path }),
      },
    });

    res.json(producto);
  } catch (error) {
    console.error('Error al actualizar producto de stock:', error);
    res.status(500).json({ error: 'Error al actualizar el producto' });
  }
};

// DELETE
exports.eliminarStock = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.stock.delete({ where: { id } });
    res.json({ mensaje: 'Producto eliminado del stock' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ error: 'Error al eliminar el producto del stock' });
  }
};

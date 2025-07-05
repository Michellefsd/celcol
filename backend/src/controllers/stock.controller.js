const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// CREATE
exports.crearStock = async (req, res) => {
  try {
    const {
      nombre, tipoProducto, informacionGeneral, referenciaInterna,
      codigoBarras, tipoCodigoBarras, notasInternas,
      marca, modelo, numeroSerie,
      puedeSerVendido, puedeSerComprado,
      precioVenta, coste, impuestoCliente,
      unidadMedida, unidadMedidaCompra,
      cantidad, fechaIngreso
    } = req.body;

    const stock = await prisma.stock.create({
      data: {
        nombre,
        tipoProducto,
        informacionGeneral,
        referenciaInterna,
        codigoBarras,
        tipoCodigoBarras,
        notasInternas,
        marca,
        modelo,
        numeroSerie,
        puedeSerVendido: !!puedeSerVendido,
        puedeSerComprado: !!puedeSerComprado,
        precioVenta: parseFloat(precioVenta) || 0,
        coste: parseFloat(coste) || 0,
        impuestoCliente,
        unidadMedida,
        unidadMedidaCompra,
        cantidad: parseInt(cantidad),
        fechaIngreso: fechaIngreso ? new Date(fechaIngreso) : undefined,
      },
    });

    res.status(201).json(stock);
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
      nombre, tipoProducto, informacionGeneral, referenciaInterna,
      codigoBarras, tipoCodigoBarras, notasInternas,
      marca, modelo, numeroSerie,
      puedeSerVendido, puedeSerComprado,
      precioVenta, coste, impuestoCliente,
      unidadMedida, unidadMedidaCompra,
      cantidad, fechaIngreso
    } = req.body;

    const item = await prisma.stock.update({
      where: { id },
      data: {
        nombre,
        tipoProducto,
        informacionGeneral,
        referenciaInterna,
        codigoBarras,
        tipoCodigoBarras,
        notasInternas,
        marca,
        modelo,
        numeroSerie,
        puedeSerVendido: !!puedeSerVendido,
        puedeSerComprado: !!puedeSerComprado,
        precioVenta: parseFloat(precioVenta) || 0,
        coste: parseFloat(coste) || 0,
        impuestoCliente,
        unidadMedida,
        unidadMedidaCompra,
        cantidad: parseInt(cantidad),
        fechaIngreso: fechaIngreso ? new Date(fechaIngreso) : undefined,
      },
    });

    res.json(item);
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

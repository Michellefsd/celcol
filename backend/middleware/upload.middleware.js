const multer = require('multer');
const path = require('path');

// === Almacenamiento ===
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// === Filtros ===

// Solo PDF
const fileFilterPDF = (req, file, cb) => {
  const allowedTypes = ['application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PDF'));
  }
};

// PDF + imágenes
const fileFilterPDFoImagen = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PDF o imágenes'));
  }
};

// === Middlewares por entidad ===

// Herramientas
exports.uploadHerramientas = multer({ storage, fileFilter: fileFilterPDF }).fields([
  { name: 'certificadoCalibracion', maxCount: 1 },
]);

// Stock
exports.uploadStock = multer({ storage, fileFilter: fileFilterPDFoImagen }).fields([
  { name: 'imagen', maxCount: 1 },
  { name: 'archivo', maxCount: 1 },
]);

// Componentes externos
exports.uploadComponenteExterno = multer({ storage, fileFilter: fileFilterPDF }).single('archivo8130');

// Aviones
exports.uploadAvion = multer({ storage, fileFilter: fileFilterPDF }).fields([
  { name: 'certificadoMatricula', maxCount: 1 },
]);

// Personal
exports.uploadPersonal = multer({ storage, fileFilter: fileFilterPDF }).fields([
  { name: 'carneSalud', maxCount: 1 },
]);

// Órdenes de trabajo
exports.uploadOrdenTrabajo = multer({ storage, fileFilter: fileFilterPDFoImagen }).fields([
  { name: 'solicitudFirma', maxCount: 1 },
  { name: 'archivoFactura', maxCount: 1 },
]);

// Middleware genérico
exports.uploadUnico = multer({ storage, fileFilter: fileFilterPDF }).single('archivo');

// Export genérico
exports.upload = multer({ storage });

const multer = require('multer');
const path = require('path');

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Asegurate de que esta carpeta exista
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// Validación por tipo MIME
const fileFilterPDF = (req, file, cb) => {
  const allowedTypes = ['application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PDF'));
  }
};

const upload = multer({ storage });

// === Middlewares personalizados por entidad ===

// Para herramientas: archivo8130 + certificadoCalibracion
exports.uploadHerramientas = multer({ storage, fileFilter: fileFilterPDF }).fields([
  { name: 'archivo8130', maxCount: 1 },
  { name: 'certificadoCalibracion', maxCount: 1 },
]);

// Para stock: imagen + factura (permitiendo cualquier tipo de imagen y PDF)
exports.uploadStock = upload.fields([
  { name: 'imagen', maxCount: 1 },
  { name: 'archivoFactura', maxCount: 1 },
]);

// Para componentes externos: solo archivo8130 (PDF)
exports.uploadComponenteExterno = multer({ storage, fileFilter: fileFilterPDF }).single('archivo8130');

// Para orden de trabajo: solicitud de firma (PDF)
exports.uploadSolicitudFirma = multer({ storage, fileFilter: fileFilterPDF }).single('solicitudFirma');

// Middleware genérico con nombre configurable
exports.uploadUnico = multer({ storage, fileFilter: fileFilterPDF }).single('archivo8130');

// Exportar también la instancia de `upload` si querés usarla directo
exports.upload = upload;

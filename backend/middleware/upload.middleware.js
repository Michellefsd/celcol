/*const multer = require('multer');
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

// Validación por tipo MIME (solo PDF)
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

//  Para herramientas: solo certificadoCalibracion (PDF)
exports.uploadHerramientas = multer({ storage, fileFilter: fileFilterPDF }).fields([
  { name: 'certificadoCalibracion', maxCount: 1 },
]);

//  Para stock: imagen + archivo (PDF o imagen)
exports.uploadStock = upload.fields([
  { name: 'imagen', maxCount: 1 },
  { name: 'archivo', maxCount: 1 },
]);

//  Para componentes externos: solo archivo8130 (PDF)
exports.uploadComponenteExterno = multer({ storage, fileFilter: fileFilterPDF }).single('archivo8130');

//  Para orden de trabajo: solicitud de firma (PDF)
exports.uploadSolicitudFirma = multer({ storage, fileFilter: fileFilterPDF }).single('solicitudFirma');

//  Para avión: certificadoMatricula (PDF)
exports.uploadAvion = multer({ storage, fileFilter: fileFilterPDF }).fields([
  { name: 'certificadoMatricula', maxCount: 1 },
]);

// Middleware genérico con nombre configurable
exports.uploadUnico = multer({ storage, fileFilter: fileFilterPDF }).single('archivo8130');

//  Para personal: carneSalud (PDF)
exports.uploadPersonal = multer({ storage }).fields([
  { name: 'carneSalud', maxCount: 1 },
]);

// Para órdenes de trabajo
exports.uploadOrdenTrabajo = multer({ storage, fileFilter: fileFilterPDF }).single('archivo');



// También exportar instancia genérica si se desea
exports.upload = upload;
*/

const multer = require('multer');
const path = require('path');

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Asegurate de que esta carpeta exista
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// Validación por tipo MIME (solo PDF)
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

// Herramientas: solo certificadoCalibracion (PDF)
exports.uploadHerramientas = multer({ storage, fileFilter: fileFilterPDF }).fields([
  { name: 'certificadoCalibracion', maxCount: 1 },
]);

// Stock: imagen + archivo (PDF o imagen)
exports.uploadStock = upload.fields([
  { name: 'imagen', maxCount: 1 },
  { name: 'archivo', maxCount: 1 },
]);

// Componentes externos: solo archivo8130 (PDF)
exports.uploadComponenteExterno = multer({ storage, fileFilter: fileFilterPDF }).single('archivo8130');

// Aviones: certificadoMatricula (PDF)
exports.uploadAvion = multer({ storage, fileFilter: fileFilterPDF }).fields([
  { name: 'certificadoMatricula', maxCount: 1 },
]);

// Personal: carneSalud (PDF)
exports.uploadPersonal = multer({ storage }).fields([
  { name: 'carneSalud', maxCount: 1 },
]);

// Para órdenes de trabajo: solicitudFirma (PDF)
exports.uploadOrdenTrabajo = multer({ storage, fileFilter: fileFilterPDF }).fields([
  { name: 'solicitudFirma', maxCount: 1 },
]);


// Middleware genérico (ej. para usar con nombre configurable)
exports.uploadUnico = multer({ storage, fileFilter: fileFilterPDF }).single('archivo');

// Exportar también una instancia genérica base
exports.upload = upload;

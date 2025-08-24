// backend/middleware/upload.js
const multer = require('multer');
const path = require('path');

const MAX_FILE_MB = Number(process.env.MAX_FILE_MB || 10);

// Almacén en disco (por ahora). Más adelante se reemplaza por bucket desde el service.
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, 'uploads/'),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${unique}${ext}`);
  }
});

const allowed = new Set([
  'application/pdf',
  'image/jpeg', 'image/jpg',
  'image/png', 'image/webp',
  'image/heic', 'image/heif',
]);

const fileFilterPDFoImagen = (_req, file, cb) => {
  if (allowed.has(file.mimetype)) cb(null, true);
  else cb(new Error('Solo se permiten archivos PDF o imágenes'));
};

// Builder para reusar misma config en "fields"
const makeUpload = (fields) =>
  multer({
    storage,
    fileFilter: fileFilterPDFoImagen,
    limits: { fileSize: MAX_FILE_MB * 1024 * 1024 }
  }).fields(fields);

// Endpoints específicos
const uploadHerramientas      = makeUpload([{ name: 'certificadoCalibracion', maxCount: 1 }]);
const uploadStock             = makeUpload([{ name: 'imagen', maxCount: 1 }, { name: 'archivo', maxCount: 1 }]);
const uploadComponenteExterno = multer({ storage, fileFilter: fileFilterPDFoImagen, limits:{ fileSize: MAX_FILE_MB*1024*1024 }}).single('archivo8130');
const uploadAvion             = makeUpload([{ name: 'certificadoMatricula', maxCount: 1 }]);
const uploadPersonal          = makeUpload([{ name: 'carneSalud', maxCount: 1 }]);
const uploadOrdenTrabajo      = makeUpload([{ name: 'solicitudFirma', maxCount: 1 }, { name: 'archivoFactura', maxCount: 1 }]);
const uploadUnico             = multer({ storage, fileFilter: fileFilterPDFoImagen, limits:{ fileSize: MAX_FILE_MB*1024*1024 }}).single('archivo');

// Export
module.exports = {
  uploadHerramientas,
  uploadStock,
  uploadComponenteExterno,
  uploadAvion,
  uploadPersonal,
  uploadOrdenTrabajo,
  uploadUnico,
};

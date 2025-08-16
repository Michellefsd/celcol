const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  }
});

const fileFilterPDFoImagen = (req, file, cb) => {
  const allowed = new Set([
    'application/pdf',
    'image/jpeg', 'image/jpg',
    'image/png', 'image/webp',
    'image/heic', 'image/heif',
  ]);
  if (allowed.has(file.mimetype)) cb(null, true);
  else cb(new Error('Solo se permiten archivos PDF o imágenes'));
};

const uploadHerramientas = multer({ storage, fileFilter: fileFilterPDFoImagen }).fields([
  { name: 'certificadoCalibracion', maxCount: 1 },
]);

const uploadStock = multer({ storage, fileFilter: fileFilterPDFoImagen }).fields([
  { name: 'imagen', maxCount: 1 },
  { name: 'archivo', maxCount: 1 },
]);

const uploadComponenteExterno = multer({ storage, fileFilter: fileFilterPDFoImagen }).single('archivo8130');

const uploadAvion = multer({ storage, fileFilter: fileFilterPDFoImagen }).fields([
  { name: 'certificadoMatricula', maxCount: 1 },
]);

const uploadPersonal = multer({ storage, fileFilter: fileFilterPDFoImagen }).fields([
  { name: 'carneSalud', maxCount: 1 },
]);

const uploadOrdenTrabajo = multer({ storage, fileFilter: fileFilterPDFoImagen }).fields([
  { name: 'solicitudFirma', maxCount: 1 },
  { name: 'archivoFactura', maxCount: 1 },
]);

const uploadUnico = multer({ storage, fileFilter: fileFilterPDFoImagen }).single('archivo');
const upload = multer({ storage });

module.exports = {
  uploadHerramientas,
  uploadStock,
  uploadComponenteExterno,
  uploadAvion,
  uploadPersonal,
  uploadOrdenTrabajo,
  uploadUnico,
  upload,
};

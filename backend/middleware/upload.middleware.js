import multer from 'multer';

const MAX_FILE_MB = Number(process.env.MAX_FILE_MB || 10);
const storage = multer.memoryStorage();

// Lee lista desde .env (case-insensitive), soporta comodín 'image/*'
const raw = (process.env.ALLOWED_MIME || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
const allowAllImages = raw.includes('image/*');
const allowed = new Set(raw);

// Normaliza algunos alias comunes
function normalize(mime) {
  const m = String(mime || '').toLowerCase();
  if (m === 'image/jpg') return 'image/jpeg';
  return m;
}

const fileFilterPDFoImagen = (_req, file, cb) => {
  const mime = normalize(file.mimetype);

  // Bloqueá SVG por seguridad (XSS), salvo que vos lo quieras permitir explícitamente
  if (mime === 'image/svg+xml' && !allowed.has('image/svg+xml')) {
    return cb(new Error('SVG no permitido'), false);
  }

  if (allowed.has(mime)) return cb(null, true);
  if (allowAllImages && mime.startsWith('image/')) return cb(null, true);

  return cb(new Error('Tipo de archivo no permitido'), false);
};

// Builder para reusar misma config en "fields"
const makeUpload = (fields) =>
  multer({
    storage,
    fileFilter: fileFilterPDFoImagen,
    limits: { fileSize: MAX_FILE_MB * 1024 * 1024 },
  }).fields(fields);

// ✅ Mantengo los mismos exports y nombres de campos
export const uploadHerramientas      = makeUpload([{ name: 'certificadoCalibracion', maxCount: 1 }]);
export const uploadStock             = makeUpload([{ name: 'imagen', maxCount: 1 }, { name: 'archivo', maxCount: 1 }]);
export const uploadComponenteExterno = multer({ storage, fileFilter: fileFilterPDFoImagen, limits:{ fileSize: MAX_FILE_MB*1024*1024 }}).single('archivo8130');
export const uploadAvion             = makeUpload([{ name: 'certificadoMatricula', maxCount: 1 }]);
export const uploadPersonal          = makeUpload([{ name: 'carneSalud', maxCount: 1 }]);
export const uploadOrdenTrabajo      = makeUpload([{ name: 'solicitudFirma', maxCount: 1 }, { name: 'archivoFactura', maxCount: 1 }]);
export const uploadUnico             = multer({ storage, fileFilter: fileFilterPDFoImagen, limits:{ fileSize: MAX_FILE_MB*1024*1024 }}).single('archivo');

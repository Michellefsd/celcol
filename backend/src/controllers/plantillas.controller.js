import path from 'path';
import fs from 'fs';


function safeReadTemplate(filename) {
  try {
    const p = path.join(process.cwd(), 'templates', filename);
    if (!fs.existsSync(p)) return null;
    return fs.readFileSync(p, 'utf8');
  } catch { return null; }
}

export const descargarPlantillaEnBlanco = async (req, res) => {
  try {
    const tipo = String(req.params.tipo || '').toLowerCase(); // 'ccm' | 'pdf'
    if (!['ccm', 'pdf'].includes(tipo)) {
      return res.status(400).json({ error: 'Parámetro tipo inválido (use ccm|pdf)' });
    }

    const tplName = `${tipo}.html`; // ccm.html | pdf.html
    let tplContent = safeReadTemplate(tplName);
    if (!tplContent) {
      return res.status(404).json({ error: `Falta templates/${tplName}` });
    }

    // Agregar logo de Celcol embebido
    let logoData = '';
    try {
      const logoPath = path.join(process.cwd(), 'public', 'celcol-logo.jpeg');
      if (fs.existsSync(logoPath)) {
        const buf = fs.readFileSync(logoPath);
        logoData = `data:image/jpeg;base64,${buf.toString('base64')}`;
      }
    } catch (e) {
      console.warn('No se pudo cargar el logo:', e.message);
    }

    // Si hay logo, agregarlo como parámetro en la URL
    if (logoData) {
      const logoParam = encodeURIComponent(logoData);
      tplContent = tplContent.replace(
        '<script>',
        `<script>
    // Inyectar logo automáticamente
    (function() {
      const logoData = '${logoData}';
      const $imgs = document.querySelectorAll('.logo-to-fill, #logo-el');
      $imgs.forEach(img => {
        img.src = logoData;
        img.style.display = 'block';
      });
    })();`
      );
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="Plantilla-${tipo}.html"`);
    return res.send(tplContent);
  } catch (e) {
    console.error('descargarPlantillaEnBlanco error:', e);
    return res.status(500).json({ error: 'No se pudo servir la plantilla' });
  }
};
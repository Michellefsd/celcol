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
    const tplContent = safeReadTemplate(tplName);
    if (!tplContent) {
      return res.status(404).json({ error: `Falta templates/${tplName}` });
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="Plantilla-${tipo}.html"`);
    return res.send(tplContent);
  } catch (e) {
    console.error('descargarPlantillaEnBlanco error:', e);
    return res.status(500).json({ error: 'No se pudo servir la plantilla' });
  }
};
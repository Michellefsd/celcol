const path = require('path');

function agregarHeaderCelcol(doc) {
  const logoPath = path.join(__dirname, '..', '..', 'public', 'celcol-logo.webp');

  try {
    doc.image(logoPath, 50, 30, { width: 80 });
  } catch (e) {
    console.warn('⚠️ No se pudo cargar el logo:', e.message);
  }

  // Texto Celcol
  doc.fontSize(18).fillColor('black').text('Celcol', 140, 40);

  // Fecha
  const ahora = new Date();
  const fechaTexto = `Emitido: ${ahora.toLocaleDateString('es-UY')}`;
  doc.fontSize(10).fillColor('red'); // color temporal para debug

  // Cálculo del ancho y posición
  const textWidth = doc.widthOfString(fechaTexto);
  const x = doc.page.width - doc.page.margins.right - textWidth;
  const y = 40;

  // Depuración
  console.log(`🧪 Insertando fecha "${fechaTexto}" en x=${x}, y=${y}`);
  doc.rect(x - 2, y - 2, textWidth + 4, 14).stroke(); // borde visible para ver si aparece
  doc.text(fechaTexto, x, y);

  doc.fillColor('black'); // volver a color normal
  doc.moveDown(3);
}

module.exports = { agregarHeaderCelcol };

export function simulatedParse(text) {
  const t = text.toLowerCase();

  const amountMatch = t.match(/(\d{1,3}(?:[.,]\d{3})+|\d+)(?:[.,](\d{1,2}))?/);
  let monto = 0;
  if (amountMatch) {
    monto = parseInt(amountMatch[1].replace(/[.,]/g, ''), 10) || 0;
  }

  const rules = [
    { id: 'hogar',     kw: ['alquiler', 'luz', 'gas', 'agua', 'internet', 'expensas', 'wifi', 'muebles', 'depto'] },
    { id: 'auto',      kw: ['nafta', 'combustible', 'peaje', 'lavadero', 'mecánico', 'mecanico', 'patente'] },
    { id: 'comida',    kw: ['super', 'súper', 'verdulería', 'verduleria', 'almuerzo', 'cena', 'café', 'cafe', 'restaurante', 'pedido', 'empanada', 'pizza', 'mercado'] },
    { id: 'impuestos', kw: ['abl', 'monotributo', 'impuesto', 'arba', 'afip', 'rentas'] },
    { id: 'salud',     kw: ['farmacia', 'obra social', 'médico', 'medico', 'remedio', 'antibiotico', 'psicóloga', 'psicólogo'] },
    { id: 'ocio',      kw: ['cine', 'spotify', 'netflix', 'disney', 'hbo', 'salida', 'bar', 'boliche', 'show', 'libro'] },
  ];

  let categoria = 'comida';
  for (const r of rules) {
    if (r.kw.some(k => t.includes(k))) { categoria = r.id; break; }
  }

  let descripcion = text
    .replace(/(\$|pesos?|pagué|pague|gasté|gaste|de\s+|por\s+)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (amountMatch) descripcion = descripcion.replace(amountMatch[0], '').trim();
  if (!descripcion) descripcion = 'Gasto';
  descripcion = descripcion.charAt(0).toUpperCase() + descripcion.slice(1);

  return { categoria, monto, descripcion, source: 'sim' };
}

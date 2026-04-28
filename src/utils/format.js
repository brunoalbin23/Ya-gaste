export function formatARS(n, opts = {}) {
  const { compact = false, showSign = false } = opts;
  if (typeof n !== 'number' || isNaN(n)) n = 0;
  const sign = n < 0 ? '-' : showSign && n > 0 ? '+' : '';
  const abs = Math.abs(Math.round(n));
  if (compact && abs >= 1000) {
    if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1).replace('.0', '')}M`;
    return `${sign}$${(abs / 1000).toFixed(abs >= 10000 ? 0 : 1).replace('.0', '')}k`;
  }
  const str = String(abs);
  const parts = [];
  for (let i = str.length; i > 0; i -= 3) {
    parts.unshift(str.slice(Math.max(0, i - 3), i));
  }
  return `${sign}$${parts.join('.')}`;
}

export function shortDate(iso) {
  const d = new Date(iso);
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${d.getDate()} ${meses[d.getMonth()]}`;
}

export function relativeDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const that = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((today - that) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  if (diff < 7) return `Hace ${diff} días`;
  return shortDate(iso);
}

export function computeStats(data, categories) {
  const now = new Date();
  const thisMonth = (iso) => {
    const d = new Date(iso);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };
  const gastosMes = data.gastos.filter(g => thisMonth(g.fecha));
  const ingresosMes = data.ingresos.filter(i => thisMonth(i.fecha));
  const totalGastos = gastosMes.reduce((s, g) => s + g.monto, 0);
  const totalIngresos = ingresosMes.reduce((s, i) => s + i.monto, 0);
  const balance = totalIngresos - totalGastos;
  const byCat = {};
  for (const c of categories) byCat[c.id] = { total: 0, count: 0 };
  for (const g of gastosMes) {
    if (!byCat[g.categoria]) byCat[g.categoria] = { total: 0, count: 0 };
    byCat[g.categoria].total += g.monto;
    byCat[g.categoria].count += 1;
  }
  return { totalGastos, totalIngresos, balance, byCat, gastosMes, ingresosMes };
}

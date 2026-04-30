import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { FONTS, PALETTE } from '../constants/theme';
import { useData } from '../context/DataContext';
import { supabase } from '../../lib/supabase';
import DonutChart from '../components/charts/DonutChart';
import BarChart from '../components/charts/BarChart';
import LineChart from '../components/charts/LineChart';
import { formatARS } from '../utils/format';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

// Normalize Supabase timestamp strings for Hermes compatibility
function dateKey(str) {
  if (!str) return null;
  const d = new Date(str.replace(' ', 'T'));
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function parseDate(str) {
  if (!str) return new Date(NaN);
  return new Date(str.replace(' ', 'T'));
}

function computeMonthStats(gastos, ingresos, allCategories) {
  const totalGastos = gastos.reduce((s, g) => s + g.monto, 0);
  const totalIngresos = ingresos.reduce((s, i) => s + i.monto, 0);
  const balance = totalIngresos - totalGastos;
  const byCat = {};
  for (const c of allCategories) byCat[c.id] = { total: 0, count: 0 };
  for (const g of gastos) {
    if (!byCat[g.categoria]) byCat[g.categoria] = { total: 0, count: 0 };
    byCat[g.categoria].total += g.monto;
    byCat[g.categoria].count += 1;
  }
  return { totalGastos, totalIngresos, balance, byCat };
}

function buildPDFHtml({ mes, year, gastos, ingresos, stats, donutData, allCategories }) {
  const shortDate = (str) => {
    const d = parseDate(str);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  const catName = (id) => allCategories.find(c => c.id === id)?.nombre ?? id;

  const gastoRows = gastos
    .sort((a, b) => parseDate(b.fecha) - parseDate(a.fecha))
    .map(g => `
      <tr>
        <td>${shortDate(g.fecha)}</td>
        <td>${catName(g.categoria)}</td>
        <td>${g.descripcion ?? ''}</td>
        <td style="text-align:right;color:#B03030;font-weight:600;">${formatARS(g.monto)}</td>
      </tr>`)
    .join('');

  const ingresoRows = ingresos
    .sort((a, b) => parseDate(b.fecha) - parseDate(a.fecha))
    .map(i => `
      <tr>
        <td>${shortDate(i.fecha)}</td>
        <td>${i.tipo}</td>
        <td>${i.descripcion ?? ''}</td>
        <td style="text-align:right;color:#2A6E47;font-weight:600;">${formatARS(i.monto)}</td>
      </tr>`)
    .join('');

  const catRows = donutData
    .map(d => {
      const pct = stats.totalGastos > 0 ? Math.round((d.value / stats.totalGastos) * 100) : 0;
      return `
        <tr>
          <td><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${d.color};margin-right:6px;"></span>${d.label}</td>
          <td style="text-align:right;">${pct}%</td>
          <td style="text-align:right;font-weight:600;">${formatARS(d.value)}</td>
        </tr>`;
    })
    .join('');

  const balanceColor = stats.balance >= 0 ? '#2A6E47' : '#B03030';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #2E2438; background: #FBF6EE; padding: 32px; font-size: 13px; }
    h1 { font-size: 30px; font-weight: 800; letter-spacing: -1px; margin-bottom: 2px; }
    h2 { font-size: 13px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; color: rgba(46,36,56,0.55); margin-bottom: 12px; margin-top: 24px; }
    .header { margin-bottom: 24px; }
    .subtitle { color: rgba(46,36,56,0.55); font-size: 14px; margin-top: 4px; }
    .summary { display: flex; gap: 12px; margin-bottom: 8px; }
    .sum-box { flex: 1; border-radius: 14px; padding: 14px 16px; }
    .sum-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
    .sum-value { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; font-size: 11px; font-weight: 700; color: rgba(46,36,56,0.55); text-transform: uppercase; letter-spacing: 0.4px; padding: 6px 8px; border-bottom: 1px solid rgba(46,36,56,0.1); }
    td { padding: 8px; border-bottom: 1px solid rgba(46,36,56,0.06); font-size: 13px; }
    tr:last-child td { border-bottom: none; }
    .card { background: white; border-radius: 16px; padding: 16px; margin-bottom: 16px; }
    .footer { margin-top: 32px; text-align: center; font-size: 11px; color: rgba(46,36,56,0.4); }
  </style>
</head>
<body>
  <div class="header">
    <h1>💸 Chaucha</h1>
    <p class="subtitle">Reporte de ${mes} ${year}</p>
  </div>

  <div class="summary">
    <div class="sum-box" style="background:#FFE5E0;">
      <div class="sum-label" style="color:#B03030;">Gastos</div>
      <div class="sum-value" style="color:#B03030;">${formatARS(stats.totalGastos)}</div>
    </div>
    <div class="sum-box" style="background:#B8E6C8;">
      <div class="sum-label" style="color:#1F3A2C;">Ingresos</div>
      <div class="sum-value" style="color:#1F3A2C;">${formatARS(stats.totalIngresos)}</div>
    </div>
    <div class="sum-box" style="background:white;">
      <div class="sum-label">Balance</div>
      <div class="sum-value" style="color:${balanceColor};">${formatARS(stats.balance, { showSign: true })}</div>
    </div>
  </div>

  ${donutData.length > 0 ? `
  <h2>Distribución por categoría</h2>
  <div class="card">
    <table>
      <thead><tr><th>Categoría</th><th style="text-align:right;">%</th><th style="text-align:right;">Total</th></tr></thead>
      <tbody>${catRows}</tbody>
    </table>
  </div>` : ''}

  ${gastos.length > 0 ? `
  <h2>Gastos (${gastos.length})</h2>
  <div class="card">
    <table>
      <thead><tr><th>Fecha</th><th>Categoría</th><th>Descripción</th><th style="text-align:right;">Monto</th></tr></thead>
      <tbody>${gastoRows}</tbody>
    </table>
  </div>` : ''}

  ${ingresos.length > 0 ? `
  <h2>Ingresos (${ingresos.length})</h2>
  <div class="card">
    <table>
      <thead><tr><th>Fecha</th><th>Tipo</th><th>Descripción</th><th style="text-align:right;">Monto</th></tr></thead>
      <tbody>${ingresoRows}</tbody>
    </table>
  </div>` : ''}

  <div class="footer">Generado por Chaucha · ${mes} ${year}</div>
</body>
</html>`;
}

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const { gastos: ctxGastos, ingresos: ctxIngresos, stats, allCategories } = useData();

  const now = new Date();
  const [selYear, setSelYear] = useState(now.getFullYear());
  const [selMonth, setSelMonth] = useState(now.getMonth());
  const [histGastos, setHistGastos] = useState([]);
  const [histIngresos, setHistIngresos] = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const isCurrentMonth = selYear === now.getFullYear() && selMonth === now.getMonth();
  const activeGastos = isCurrentMonth ? ctxGastos : histGastos;
  const activeIngresos = isCurrentMonth ? ctxIngresos : histIngresos;

  const activeStats = useMemo(
    () => isCurrentMonth ? stats : computeMonthStats(activeGastos, activeIngresos, allCategories),
    [isCurrentMonth, stats, activeGastos, activeIngresos, allCategories],
  );

  useEffect(() => {
    if (isCurrentMonth) return;
    let cancelled = false;
    (async () => {
      setHistLoading(true);
      const pad = n => String(n).padStart(2, '0');
      const from = `${selYear}-${pad(selMonth + 1)}-01`;
      const lastDay = new Date(selYear, selMonth + 1, 0).getDate();
      const to = `${selYear}-${pad(selMonth + 1)}-${pad(lastDay)}T23:59:59`;
      const [{ data: g }, { data: i }] = await Promise.all([
        supabase.from('gastos').select('*').gte('fecha', from).lte('fecha', to).order('fecha', { ascending: false }),
        supabase.from('ingresos').select('*').gte('fecha', from).lte('fecha', to).order('fecha', { ascending: false }),
      ]);
      if (!cancelled) {
        setHistGastos(g ?? []);
        setHistIngresos(i ?? []);
        setHistLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selYear, selMonth, isCurrentMonth]);

  function prevMonth() {
    if (selMonth === 0) { setSelYear(y => y - 1); setSelMonth(11); }
    else setSelMonth(m => m - 1);
  }
  function nextMonth() {
    if (isCurrentMonth) return;
    if (selMonth === 11) { setSelYear(y => y + 1); setSelMonth(0); }
    else setSelMonth(m => m + 1);
  }

  // Month gastos/ingresos for PDF and donut (filter ctxGastos to selected month when current)
  const monthGastos = useMemo(() => {
    if (!isCurrentMonth) return activeGastos;
    return activeGastos.filter(g => {
      const d = parseDate(g.fecha);
      return d.getMonth() === selMonth && d.getFullYear() === selYear;
    });
  }, [activeGastos, isCurrentMonth, selMonth, selYear]);

  const monthIngresos = useMemo(() => {
    if (!isCurrentMonth) return activeIngresos;
    return activeIngresos.filter(i => {
      const d = parseDate(i.fecha);
      return d.getMonth() === selMonth && d.getFullYear() === selYear;
    });
  }, [activeIngresos, isCurrentMonth, selMonth, selYear]);

  const donutData = useMemo(() =>
    allCategories
      .map(c => ({ id: c.id, label: c.nombre, value: activeStats?.byCat[c.id]?.total || 0, color: c.color }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value),
    [allCategories, activeStats],
  );

  // ── Bar chart: last 7 days (or weekly buckets) ────────────────────────────
  const barsData = useMemo(() => {
    const labels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

    if (isCurrentMonth) {
      const today = new Date();
      // Build a day→total map for O(n) lookup
      const byDay = new Map();
      for (const g of activeGastos) {
        const k = dateKey(g.fecha);
        if (k) byDay.set(k, (byDay.get(k) ?? 0) + g.monto);
      }
      return Array.from({ length: 7 }, (_, idx) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (6 - idx));
        const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        return {
          label: labels[(d.getDay() + 6) % 7],
          value: byDay.get(k) ?? 0,
          highlight: idx === 6,
        };
      });
    }

    // Historical: 4 weekly buckets
    const lastDay = new Date(selYear, selMonth + 1, 0).getDate();
    const size = Math.ceil(lastDay / 4);
    return Array.from({ length: 4 }, (_, i) => {
      const start = i * size + 1;
      const end = Math.min((i + 1) * size, lastDay);
      const sum = activeGastos.reduce((s, g) => {
        const gd = parseDate(g.fecha);
        const day = gd.getDate();
        return (gd.getFullYear() === selYear && gd.getMonth() === selMonth && day >= start && day <= end)
          ? s + g.monto : s;
      }, 0);
      return { label: `S${i + 1}`, value: sum, highlight: false };
    });
  }, [activeGastos, isCurrentMonth, selYear, selMonth]);

  const lineData = useMemo(() => {
    const daysShown = isCurrentMonth
      ? now.getDate()
      : new Date(selYear, selMonth + 1, 0).getDate();
    let cum = 0;
    return Array.from({ length: daysShown }, (_, i) => {
      const day = i + 1;
      const sum = activeGastos.reduce((s, g) => {
        const gd = parseDate(g.fecha);
        return (gd.getFullYear() === selYear && gd.getMonth() === selMonth && gd.getDate() === day)
          ? s + g.monto : s;
      }, 0);
      cum += sum;
      return { label: String(day), value: cum };
    });
  }, [activeGastos, isCurrentMonth, selYear, selMonth]);

  const daysInPeriod = isCurrentMonth ? now.getDate() : new Date(selYear, selMonth + 1, 0).getDate();
  const avgDaily = daysInPeriod > 0 ? (activeStats?.totalGastos ?? 0) / daysInPeriod : 0;
  const barsHasData = barsData.some(d => d.value > 0);

  async function exportPDF() {
    setExporting(true);
    try {
      const html = buildPDFHtml({
        mes: MESES[selMonth],
        year: selYear,
        gastos: monthGastos,
        ingresos: monthIngresos,
        stats: activeStats ?? { totalGastos: 0, totalIngresos: 0, balance: 0, byCat: {} },
        donutData,
        allCategories,
      });
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: '.pdf' });
    } catch (e) {
      Alert.alert('Error', 'No se pudo exportar el reporte.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: PALETTE.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ marginBottom: 14, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ fontSize: 12, color: PALETTE.muted, letterSpacing: 0.4, textTransform: 'uppercase', fontWeight: '600' }}>
            Análisis
          </Text>
          <Text style={{ ...FONTS.display, fontSize: 28, color: PALETTE.ink, letterSpacing: -0.6, marginTop: 2 }}>
            Reportes
          </Text>
        </View>
        <Pressable
          onPress={exportPDF}
          disabled={exporting}
          style={({ pressed }) => ({
            flexDirection: 'row', alignItems: 'center', gap: 6,
            paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12,
            backgroundColor: pressed ? 'rgba(46,36,56,0.1)' : PALETTE.card,
            borderWidth: 1, borderColor: 'rgba(46,36,56,0.1)',
            opacity: exporting ? 0.6 : 1,
            shadowColor: PALETTE.ink, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
          })}
        >
          {exporting
            ? <ActivityIndicator size="small" color={PALETTE.ink} />
            : <Text style={{ fontSize: 14 }}>📄</Text>
          }
          <Text style={{ fontSize: 12, fontWeight: '600', color: PALETTE.ink }}>
            {exporting ? 'Exportando…' : 'Exportar PDF'}
          </Text>
        </Pressable>
      </View>

      {/* Month navigator */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(46,36,56,0.06)', borderRadius: 16, padding: 4, marginBottom: 16,
      }}>
        <Pressable
          onPress={prevMonth}
          style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}
        >
          <Text style={{ fontSize: 22, color: PALETTE.ink, lineHeight: 28 }}>‹</Text>
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ ...FONTS.bodySemiBold, fontSize: 14, color: PALETTE.ink }}>
            {MESES[selMonth]} {selYear}
          </Text>
        </View>
        <Pressable
          onPress={nextMonth}
          disabled={isCurrentMonth}
          style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, opacity: isCurrentMonth ? 0.25 : 1 }}
        >
          <Text style={{ fontSize: 22, color: PALETTE.ink, lineHeight: 28 }}>›</Text>
        </Pressable>
      </View>

      {histLoading ? (
        <View style={{ paddingVertical: 60, alignItems: 'center' }}>
          <ActivityIndicator color={PALETTE.ink} />
        </View>
      ) : (
        <>
          {/* Summary row */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
            <View style={{ flex: 1, backgroundColor: '#ECE6F6', borderRadius: 18, padding: 14 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: PALETTE.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Gastos</Text>
              <Text style={{ ...FONTS.display, fontSize: 17, color: PALETTE.ink, letterSpacing: -0.5, marginTop: 4 }} numberOfLines={1}>
                {formatARS(activeStats?.totalGastos ?? 0)}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#B8E6C8', borderRadius: 18, padding: 14 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#1F3A2C', textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.7 }}>Ingresos</Text>
              <Text style={{ ...FONTS.display, fontSize: 17, color: '#1F3A2C', letterSpacing: -0.5, marginTop: 4 }} numberOfLines={1}>
                {formatARS(activeStats?.totalIngresos ?? 0)}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: PALETTE.card, borderRadius: 18, padding: 14 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: PALETTE.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Balance</Text>
              <Text style={{ ...FONTS.display, fontSize: 17, letterSpacing: -0.5, marginTop: 4, color: (activeStats?.balance ?? 0) >= 0 ? '#2A6E47' : '#B03030' }} numberOfLines={1}>
                {formatARS(activeStats?.balance ?? 0, { showSign: true })}
              </Text>
            </View>
          </View>

          {/* Donut card */}
          {donutData.length > 0 && (
            <View style={cardStyle}>
              <Text style={{ ...FONTS.display, fontSize: 15, color: PALETTE.ink, marginBottom: 12 }}>Distribución</Text>
              <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                <DonutChart data={donutData} size={140} thickness={20} />
                <View style={{ flex: 1, gap: 8 }}>
                  {donutData.slice(0, 4).map(d => {
                    const pct = (activeStats?.totalGastos ?? 0) > 0
                      ? Math.round((d.value / activeStats.totalGastos) * 100)
                      : 0;
                    return (
                      <View key={d.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: d.color }} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 12, fontWeight: '600', color: PALETTE.ink }}>{d.label}</Text>
                          <Text style={{ fontSize: 10, color: PALETTE.muted }}>
                            {pct}% · {formatARS(d.value, { compact: true })}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          )}

          {/* Bar chart card */}
          <View style={cardStyle}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
              <Text style={{ ...FONTS.display, fontSize: 15, color: PALETTE.ink }}>
                {isCurrentMonth ? 'Últimos 7 días' : 'Por semana'}
              </Text>
              <Text style={{ fontSize: 11, color: PALETTE.muted }}>
                prom. {formatARS(Math.round(avgDaily), { compact: true })}/día
              </Text>
            </View>
            {barsHasData
              ? <BarChart data={barsData} accent={PALETTE.accent} />
              : <View style={{ paddingVertical: 28, alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, color: PALETTE.muted }}>Sin gastos en este período</Text>
                </View>
            }
          </View>

          {/* Line chart card */}
          <View style={cardStyle}>
            <Text style={{ ...FONTS.display, fontSize: 15, color: PALETTE.ink, marginBottom: 12 }}>
              Acumulado del mes
            </Text>
            <LineChart data={lineData} width={300} height={100} accent={PALETTE.accent} />
          </View>
        </>
      )}
    </ScrollView>
  );
}

const cardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: 22, padding: 18, marginBottom: 14,
  shadowColor: '#2E2438', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
};

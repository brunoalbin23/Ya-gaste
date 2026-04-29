import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CATEGORIES } from '../constants/categories';
import { FONTS, PALETTE } from '../constants/theme';
import { useData } from '../context/DataContext';
import { supabase } from '../../lib/supabase';
import DonutChart from '../components/charts/DonutChart';
import BarChart from '../components/charts/BarChart';
import LineChart from '../components/charts/LineChart';
import { formatARS } from '../utils/format';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function computeMonthStats(gastos, ingresos) {
  const totalGastos = gastos.reduce((s, g) => s + g.monto, 0);
  const totalIngresos = ingresos.reduce((s, i) => s + i.monto, 0);
  const balance = totalIngresos - totalGastos;
  const byCat = {};
  for (const c of CATEGORIES) byCat[c.id] = { total: 0, count: 0 };
  for (const g of gastos) {
    if (!byCat[g.categoria]) byCat[g.categoria] = { total: 0, count: 0 };
    byCat[g.categoria].total += g.monto;
    byCat[g.categoria].count += 1;
  }
  return { totalGastos, totalIngresos, balance, byCat };
}

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const { gastos: ctxGastos, ingresos: ctxIngresos, stats } = useData();

  const now = new Date();
  const [selYear, setSelYear] = useState(now.getFullYear());
  const [selMonth, setSelMonth] = useState(now.getMonth());
  const [histGastos, setHistGastos] = useState([]);
  const [histIngresos, setHistIngresos] = useState([]);
  const [histLoading, setHistLoading] = useState(false);

  const isCurrentMonth = selYear === now.getFullYear() && selMonth === now.getMonth();
  const activeGastos = isCurrentMonth ? ctxGastos : histGastos;
  const activeIngresos = isCurrentMonth ? ctxIngresos : histIngresos;

  const activeStats = useMemo(
    () => isCurrentMonth ? stats : computeMonthStats(activeGastos, activeIngresos),
    [isCurrentMonth, stats, activeGastos, activeIngresos],
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
        supabase.from('gastos').select('*, profiles(nombre)').gte('fecha', from).lte('fecha', to).order('fecha', { ascending: false }),
        supabase.from('ingresos').select('*, profiles(nombre)').gte('fecha', from).lte('fecha', to).order('fecha', { ascending: false }),
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

  const donutData = CATEGORIES
    .map(c => ({ id: c.id, label: c.nombre, value: activeStats?.byCat[c.id]?.total || 0, color: c.color }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const barsData = useMemo(() => {
    const labels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    if (isCurrentMonth) {
      const today = new Date();
      return Array.from({ length: 7 }, (_, idx) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (6 - idx));
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        const sum = activeGastos.filter(g => {
          const gd = new Date(g.fecha);
          return `${gd.getFullYear()}-${gd.getMonth()}-${gd.getDate()}` === key;
        }).reduce((s, g) => s + g.monto, 0);
        return { label: labels[(d.getDay() + 6) % 7], value: sum, highlight: idx === 6 };
      });
    }
    // Historical: 4 weekly buckets
    const lastDay = new Date(selYear, selMonth + 1, 0).getDate();
    const size = Math.ceil(lastDay / 4);
    return Array.from({ length: 4 }, (_, i) => {
      const start = i * size + 1;
      const end = Math.min((i + 1) * size, lastDay);
      const sum = activeGastos.filter(g => {
        const gd = new Date(g.fecha);
        const day = gd.getDate();
        return gd.getFullYear() === selYear && gd.getMonth() === selMonth && day >= start && day <= end;
      }).reduce((s, g) => s + g.monto, 0);
      return { label: `S${i + 1}`, value: sum, highlight: false };
    });
  }, [activeGastos, isCurrentMonth, selYear, selMonth]);

  const lineData = useMemo(() => {
    const daysShown = isCurrentMonth
      ? new Date().getDate()
      : new Date(selYear, selMonth + 1, 0).getDate();
    let cum = 0;
    return Array.from({ length: daysShown }, (_, i) => {
      const day = i + 1;
      const sum = activeGastos.filter(g => {
        const gd = new Date(g.fecha);
        return gd.getFullYear() === selYear && gd.getMonth() === selMonth && gd.getDate() === day;
      }).reduce((s, g) => s + g.monto, 0);
      cum += sum;
      return { label: String(day), value: cum };
    });
  }, [activeGastos, isCurrentMonth, selYear, selMonth]);

  const daysInPeriod = isCurrentMonth ? now.getDate() : new Date(selYear, selMonth + 1, 0).getDate();
  const avgDaily = daysInPeriod > 0 ? (activeStats?.totalGastos ?? 0) / daysInPeriod : 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: PALETTE.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ marginBottom: 14 }}>
        <Text style={{ fontSize: 12, color: PALETTE.muted, letterSpacing: 0.4, textTransform: 'uppercase', fontWeight: '600' }}>
          Análisis
        </Text>
        <Text style={{ ...FONTS.display, fontSize: 28, color: PALETTE.ink, letterSpacing: -0.6, marginTop: 2 }}>
          Reportes
        </Text>
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
            <BarChart data={barsData} accent={PALETTE.accent} />
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

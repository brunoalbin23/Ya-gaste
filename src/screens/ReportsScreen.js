import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CATEGORIES } from '../constants/categories';
import { FONTS, PALETTE } from '../constants/theme';
import { useData } from '../context/DataContext';
import DonutChart from '../components/charts/DonutChart';
import BarChart from '../components/charts/BarChart';
import LineChart from '../components/charts/LineChart';
import { formatARS } from '../utils/format';

const PERIODS = [['dia', 'Día'], ['sem', 'Semana'], ['mes', 'Mes'], ['anio', 'Año']];

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const { data, stats } = useData();
  const [period, setPeriod] = useState('mes');

  const donutData = CATEGORIES
    .map(c => ({ id: c.id, label: c.nombre, value: stats.byCat[c.id]?.total || 0, color: c.color }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const barsData = useMemo(() => {
    const labels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    const today = new Date();
    return Array.from({ length: 7 }, (_, idx) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - idx));
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const sum = data.gastos.filter(g => {
        const gd = new Date(g.fecha);
        return `${gd.getFullYear()}-${gd.getMonth()}-${gd.getDate()}` === key;
      }).reduce((s, g) => s + g.monto, 0);
      const wd = (d.getDay() + 6) % 7;
      return { label: labels[wd], value: sum, highlight: idx === 6 };
    });
  }, [data.gastos]);

  const lineData = useMemo(() => {
    const today = new Date();
    let cum = 0;
    return Array.from({ length: today.getDate() }, (_, i) => {
      const day = i + 1;
      const sum = data.gastos.filter(g => {
        const gd = new Date(g.fecha);
        return gd.getMonth() === today.getMonth() && gd.getFullYear() === today.getFullYear() && gd.getDate() === day;
      }).reduce((s, g) => s + g.monto, 0);
      cum += sum;
      return { label: String(day), value: cum };
    });
  }, [data.gastos]);

  const avgDaily = barsData.reduce((s, b) => s + b.value, 0) / 7;

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

      {/* Period segmented control */}
      <View style={{
        flexDirection: 'row', backgroundColor: 'rgba(46,36,56,0.06)', borderRadius: 12, padding: 3, marginBottom: 16,
      }}>
        {PERIODS.map(([k, l]) => (
          <Pressable
            key={k}
            onPress={() => setPeriod(k)}
            style={{
              flex: 1, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
              backgroundColor: period === k ? PALETTE.card : 'transparent',
              shadowColor: period === k ? PALETTE.ink : 'transparent',
              shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2,
              elevation: period === k ? 2 : 0,
            }}
          >
            <Text style={{ ...FONTS.bodySemiBold, fontSize: 12, color: PALETTE.ink }}>{l}</Text>
          </Pressable>
        ))}
      </View>

      {/* Donut card */}
      <View style={cardStyle}>
        <Text style={{ ...FONTS.display, fontSize: 15, color: PALETTE.ink, marginBottom: 12 }}>Distribución</Text>
        <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
          <DonutChart data={donutData} size={140} thickness={20} />
          <View style={{ flex: 1, gap: 8 }}>
            {donutData.slice(0, 4).map(d => {
              const pct = stats.totalGastos ? Math.round((d.value / stats.totalGastos) * 100) : 0;
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

      {/* Bar chart card */}
      <View style={cardStyle}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
          <Text style={{ ...FONTS.display, fontSize: 15, color: PALETTE.ink }}>Últimos 7 días</Text>
          <Text style={{ fontSize: 11, color: PALETTE.muted }}>
            prom. {formatARS(avgDaily, { compact: true })}/día
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
    </ScrollView>
  );
}

const cardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: 22, padding: 18, marginBottom: 14,
  shadowColor: '#2E2438', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
};

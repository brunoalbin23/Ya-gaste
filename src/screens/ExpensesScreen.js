import React, { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS, PALETTE } from '../constants/theme';
import { useData } from '../context/DataContext';
import ExpenseRow from '../components/ExpenseRow';
import EmptyState from '../components/EmptyState';
import { formatARS, relativeDate } from '../utils/format';

export default function ExpensesScreen() {
  const insets = useSafeAreaInsets();
  const { gastos, deleteExpense } = useData();

  const groups = useMemo(() => {
    const out = {};
    for (const g of gastos) {
      const d = new Date(g.fecha);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!out[key]) out[key] = { label: relativeDate(g.fecha), items: [], total: 0 };
      out[key].items.push(g);
      out[key].total += g.monto;
    }
    return Object.values(out);
  }, [gastos]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: PALETTE.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ marginBottom: 18 }}>
        <Text style={{ fontSize: 12, color: PALETTE.muted, letterSpacing: 0.4, textTransform: 'uppercase', fontWeight: '600' }}>
          Todos
        </Text>
        <Text style={{ ...FONTS.display, fontSize: 28, color: PALETTE.ink, letterSpacing: -0.6, marginTop: 2 }}>
          Gastos
        </Text>
      </View>

      {groups.length === 0 && (
        <EmptyState emoji="💸" title="Sin gastos todavía" subtitle="Agregá tu primer gasto con el botón +" />
      )}

      {groups.map((grp, idx) => (
        <View key={idx} style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 4, paddingBottom: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: PALETTE.muted, letterSpacing: 0.3, textTransform: 'uppercase' }}>
              {grp.label}
            </Text>
            <Text style={{ fontSize: 12, color: PALETTE.muted }}>{formatARS(grp.total)}</Text>
          </View>
          <View style={{
            backgroundColor: PALETTE.card, borderRadius: 22, overflow: 'hidden',
            shadowColor: PALETTE.ink, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
          }}>
            {grp.items.map((g, i) => (
              <ExpenseRow key={g.id} g={g} isLast={i === grp.items.length - 1} onDelete={() => deleteExpense(g.id)} />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

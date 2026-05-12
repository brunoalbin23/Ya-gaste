import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS, PALETTE } from '../constants/theme';
import { useData } from '../context/DataContext';
import { useLayout } from '../hooks/useLayout';
import IncomeRow from '../components/IncomeRow';
import { formatARS } from '../utils/format';

export default function IncomeScreen() {
  const insets = useSafeAreaInsets();
  const { isDesktop } = useLayout();
  const { ingresos, stats, deleteIncome, setShowAddIncome } = useData();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: PALETTE.bg }}
      contentContainerStyle={{ paddingTop: isDesktop ? 32 : insets.top + 8, paddingHorizontal: isDesktop ? 32 : 18, paddingBottom: isDesktop ? 40 : 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ marginBottom: 18 }}>
        <Text style={{ fontSize: 12, color: PALETTE.muted, letterSpacing: 0.4, textTransform: 'uppercase', fontWeight: '600' }}>
          Este mes
        </Text>
        <Text style={{ ...FONTS.display, fontSize: 28, color: PALETTE.ink, letterSpacing: -0.6, marginTop: 2 }}>
          Ingresos
        </Text>
      </View>

      {/* Hero card */}
      <View style={{
        borderRadius: 26, padding: 22, marginBottom: 18, overflow: 'hidden',
        backgroundColor: '#B8E6C8',
        shadowColor: '#1F3A2C', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 6,
      }}>
        <View style={{ position: 'absolute', top: -20, right: -20, width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.3)' }} />
        <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(31,58,44,0.7)' }}>
          Total ingresos
        </Text>
        <Text style={{ ...FONTS.display, fontSize: 40, color: '#1F3A2C', letterSpacing: -1.4, lineHeight: 48, marginTop: 6 }}>
          +{formatARS(stats.totalIngresos)}
        </Text>
        <Text style={{ fontSize: 12, color: 'rgba(31,58,44,0.65)', marginTop: 4 }}>
          {stats.ingresosMes.length} {stats.ingresosMes.length === 1 ? 'cobro' : 'cobros'} registrados
        </Text>
      </View>

      <Pressable
        onPress={() => setShowAddIncome(true)}
        style={({ pressed }) => ({
          height: 50, borderRadius: 16, backgroundColor: pressed ? '#162B20' : '#1F3A2C',
          alignItems: 'center', justifyContent: 'center', marginBottom: 16,
        })}
      >
        <Text style={{ ...FONTS.display, fontWeight: '600', fontSize: 15, color: '#fff' }}>
          + Cargar ingreso
        </Text>
      </Pressable>

      <View style={{
        backgroundColor: PALETTE.card, borderRadius: 22, overflow: 'hidden',
        shadowColor: PALETTE.ink, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
      }}>
        {ingresos.map((i, idx, arr) => (
          <IncomeRow key={i.id} i={i} isLast={idx === arr.length - 1} onDelete={() => deleteIncome(i.id)} />
        ))}
        {ingresos.length === 0 && (
          <View style={{ padding: 32, alignItems: 'center' }}>
            <Text style={{ fontSize: 13, color: PALETTE.muted }}>Sin ingresos cargados todavía.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

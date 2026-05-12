import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS, PALETTE } from '../constants/theme';
import { useData } from '../context/DataContext';
import { useLayout } from '../hooks/useLayout';
import CategoryTile from '../components/CategoryTile';
import ExpenseRow from '../components/ExpenseRow';
import { formatARS } from '../utils/format';

// ─── Shared ───────────────────────────────────────────────────────────────────

function BalancePill({ label, value, positive }) {
  return (
    <View style={{
      flex: 1, backgroundColor: 'rgba(255,255,255,0.5)',
      borderRadius: 16, padding: 10,
      borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.7)',
    }}>
      <Text style={{ fontSize: 10, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase', color: 'rgba(46,36,56,0.6)' }}>
        {label}
      </Text>
      <Text style={{ ...FONTS.display, fontSize: 18, color: PALETTE.ink, letterSpacing: -0.4, marginTop: 2 }}>
        {positive ? '+' : '−'}{formatARS(Math.abs(value))}
      </Text>
    </View>
  );
}

// ─── Desktop stat card ────────────────────────────────────────────────────────

function StatCard({ label, value, bg, valueColor }) {
  return (
    <View style={{
      flex: 1, borderRadius: 20, padding: 20,
      backgroundColor: bg,
      shadowColor: PALETTE.ink, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    }}>
      <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', color: PALETTE.muted, marginBottom: 8 }}>
        {label}
      </Text>
      <Text style={{ ...FONTS.display, fontSize: 24, color: valueColor ?? PALETTE.ink, letterSpacing: -0.8 }} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

// ─── Mobile layout ────────────────────────────────────────────────────────────

function MobileDashboard({ navigation, gastos, stats, profile, allCategories, setShowNewCat }) {
  const insets = useSafeAreaInsets();
  const monthName = new Date().toLocaleDateString('es-AR', { month: 'long' });
  const firstName = profile?.nombre?.split(' ')[0] ?? 'vos';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: PALETTE.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <View>
          <Text style={{ fontSize: 12, color: PALETTE.muted, letterSpacing: 0.4, textTransform: 'uppercase', fontWeight: '600' }}>
            {monthName}
          </Text>
          <Text style={{ ...FONTS.display, fontSize: 26, color: PALETTE.ink, letterSpacing: -0.5, marginTop: 2 }}>
            Hola, {firstName} 👋
          </Text>
        </View>
      </View>

      {/* Balance hero card */}
      <View style={{
        borderRadius: 26, padding: 22, marginBottom: 18, overflow: 'hidden',
        backgroundColor: PALETTE.accent,
        shadowColor: PALETTE.accent, shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 8,
      }}>
        <View style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: 70, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' }} />
        <View style={{ position: 'absolute', top: -10, right: -10, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.18)' }} />
        <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(46,36,56,0.65)' }}>
          Balance del mes
        </Text>
        <Text style={{ ...FONTS.display, fontSize: 44, color: PALETTE.ink, letterSpacing: -1.6, lineHeight: 52, marginTop: 6 }}>
          {formatARS(stats.balance)}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 18 }}>
          <BalancePill label="Ingresos" value={stats.totalIngresos} positive />
          <BalancePill label="Gastos"   value={stats.totalGastos} />
        </View>
      </View>

      {/* Categories header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12, paddingHorizontal: 4 }}>
        <Text style={{ ...FONTS.display, fontSize: 18, color: PALETTE.ink, letterSpacing: -0.3 }}>Categorías</Text>
        <Text style={{ fontSize: 12, color: PALETTE.muted }}>este mes</Text>
      </View>

      {/* Categories grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 22 }}>
        {allCategories.map((cat) => (
          <View key={cat.id} style={{ width: '47.5%' }}>
            <CategoryTile
              cat={cat}
              total={stats.byCat[cat.id]?.total || 0}
              count={stats.byCat[cat.id]?.count || 0}
              onPress={() => navigation.navigate('CategoryDetail', { catId: cat.id })}
            />
          </View>
        ))}
        <View style={{ width: '47.5%' }}>
          <Pressable
            onPress={() => setShowNewCat(true)}
            style={{
              backgroundColor: 'transparent',
              borderWidth: 1.5, borderColor: 'rgba(46,36,56,0.18)', borderStyle: 'dashed',
              borderRadius: 22, padding: 18, minHeight: 116,
              alignItems: 'flex-start', justifyContent: 'center', gap: 8,
            }}
          >
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(46,36,56,0.04)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 22, color: PALETTE.muted, lineHeight: 26 }}>+</Text>
            </View>
            <Text style={{ fontSize: 13, fontWeight: '500', color: PALETTE.muted }}>Nueva categoría</Text>
            <Text style={{ fontSize: 11, color: PALETTE.muted, opacity: 0.7 }}>gym, viajes, regalos…</Text>
          </Pressable>
        </View>
      </View>

      {/* Recent activity */}
      <Text style={{ ...FONTS.display, fontSize: 18, color: PALETTE.ink, letterSpacing: -0.3, marginBottom: 8, paddingHorizontal: 4 }}>
        Movimientos recientes
      </Text>
      <View style={{
        backgroundColor: PALETTE.card, borderRadius: 22, overflow: 'hidden',
        shadowColor: PALETTE.ink, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
      }}>
        {gastos.slice(0, 4).map((g, i, arr) => (
          <ExpenseRow key={g.id} g={g} isLast={i === arr.length - 1} />
        ))}
        {gastos.length === 0 && (
          <View style={{ padding: 28, alignItems: 'center' }}>
            <Text style={{ fontSize: 13, color: PALETTE.muted }}>Sin movimientos todavía.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// ─── Desktop layout ───────────────────────────────────────────────────────────

function DesktopDashboard({ navigation, gastos, stats, profile, allCategories, setShowNewCat }) {
  const monthName = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  const firstName = profile?.nombre?.split(' ')[0] ?? 'vos';
  const balanceColor = stats.balance >= 0 ? '#2A6E47' : '#B03030';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: PALETTE.bg }}
      contentContainerStyle={{ paddingTop: 32, paddingHorizontal: 32, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Page header */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 12, color: PALETTE.muted, letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: '600' }}>
          {monthName}
        </Text>
        <Text style={{ ...FONTS.display, fontSize: 30, color: PALETTE.ink, letterSpacing: -0.8, marginTop: 4 }}>
          Hola, {firstName} 👋
        </Text>
      </View>

      {/* Stat cards row */}
      <View style={{ flexDirection: 'row', gap: 14, marginBottom: 28 }}>
        <StatCard
          label="Gastos del mes"
          value={formatARS(stats.totalGastos)}
          bg="#FFE8E4"
          valueColor="#B03030"
        />
        <StatCard
          label="Ingresos del mes"
          value={formatARS(stats.totalIngresos)}
          bg="#D4EDDA"
          valueColor="#2A6E47"
        />
        <StatCard
          label="Balance"
          value={formatARS(stats.balance)}
          bg={PALETTE.card}
          valueColor={balanceColor}
        />
      </View>

      {/* Two-column section */}
      <View style={{ flexDirection: 'row', gap: 20, alignItems: 'flex-start' }}>
        {/* Left: categories */}
        <View style={{ flex: 2 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14, paddingHorizontal: 2 }}>
            <Text style={{ ...FONTS.display, fontSize: 18, color: PALETTE.ink, letterSpacing: -0.3 }}>Categorías</Text>
            <Text style={{ fontSize: 12, color: PALETTE.muted }}>este mes</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {allCategories.map((cat) => (
              <View key={cat.id} style={{ width: '31%' }}>
                <CategoryTile
                  cat={cat}
                  total={stats.byCat[cat.id]?.total || 0}
                  count={stats.byCat[cat.id]?.count || 0}
                  onPress={() => navigation.navigate('CategoryDetail', { catId: cat.id })}
                />
              </View>
            ))}
            <View style={{ width: '31%' }}>
              <Pressable
                onPress={() => setShowNewCat(true)}
                style={{
                  backgroundColor: 'transparent',
                  borderWidth: 1.5, borderColor: 'rgba(46,36,56,0.18)', borderStyle: 'dashed',
                  borderRadius: 22, padding: 18, minHeight: 116,
                  alignItems: 'flex-start', justifyContent: 'center', gap: 8,
                }}
              >
                <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(46,36,56,0.04)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 22, color: PALETTE.muted, lineHeight: 26 }}>+</Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: '500', color: PALETTE.muted }}>Nueva categoría</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Right: recent activity */}
        <View style={{ flex: 1, minWidth: 260 }}>
          <Text style={{ ...FONTS.display, fontSize: 18, color: PALETTE.ink, letterSpacing: -0.3, marginBottom: 14, paddingHorizontal: 2 }}>
            Últimos movimientos
          </Text>
          <View style={{
            backgroundColor: PALETTE.card, borderRadius: 22, overflow: 'hidden',
            shadowColor: PALETTE.ink, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
          }}>
            {gastos.slice(0, 5).map((g, i, arr) => (
              <ExpenseRow key={g.id} g={g} isLast={i === arr.length - 1} />
            ))}
            {gastos.length === 0 && (
              <View style={{ padding: 28, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: PALETTE.muted }}>Sin movimientos todavía.</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function DashboardScreen({ navigation }) {
  const { isDesktop } = useLayout();
  const { gastos, stats, profile, allCategories, setShowNewCat } = useData();

  const shared = { navigation, gastos, stats, profile, allCategories, setShowNewCat };

  if (isDesktop) return <DesktopDashboard {...shared} />;
  return <MobileDashboard {...shared} />;
}

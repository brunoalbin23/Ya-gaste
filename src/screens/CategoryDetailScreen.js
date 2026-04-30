import React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS, PALETTE } from '../constants/theme';
import { useData } from '../context/DataContext';
import ExpenseRow from '../components/ExpenseRow';
import { formatARS } from '../utils/format';

export default function CategoryDetailScreen({ route, navigation }) {
  const { catId } = route.params;
  const insets = useSafeAreaInsets();
  const { gastos, stats, deleteExpense, openAddExpense, allCategories, deleteCustomCategory } = useData();

  const cat = allCategories.find(c => c.id === catId);
  if (!cat) return null;

  const items = gastos.filter(g => g.categoria === catId);
  const total = stats.byCat[catId]?.total || 0;

  function handleDeleteCategory() {
    if (items.length > 0) {
      Alert.alert(
        'No se puede eliminar',
        `Esta categoría tiene ${items.length} gasto${items.length !== 1 ? 's' : ''}. Eliminá los gastos primero para poder borrar la categoría.`,
      );
      return;
    }
    Alert.alert(
      'Eliminar categoría',
      `¿Eliminar "${cat.nombre}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            try {
              await deleteCustomCategory(catId);
              navigation.goBack();
            } catch (e) {
              Alert.alert('Error', e.message ?? 'No se pudo eliminar');
            }
          },
        },
      ],
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: PALETTE.bg }}>
      {/* Back button */}
      <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 14, paddingBottom: 6 }}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={{
            width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.7)',
            alignItems: 'center', justifyContent: 'center',
            shadowColor: PALETTE.ink, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
          }}
        >
          <Text style={{ fontSize: 18, color: PALETTE.ink, lineHeight: 22 }}>‹</Text>
        </Pressable>
      </View>

      {/* Hero */}
      <View style={{
        marginHorizontal: 18, marginBottom: 14, padding: 24, borderRadius: 26,
        backgroundColor: cat.tint, overflow: 'hidden',
      }}>
        <View style={{ position: 'absolute', top: -30, right: -30, width: 130, height: 130, borderRadius: 65, backgroundColor: cat.color, opacity: 0.55 }} />
        <Text style={{ fontSize: 56, lineHeight: 64, marginBottom: 8 }}>{cat.emoji}</Text>
        <Text style={{ fontSize: 12, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase', color: 'rgba(46,36,56,0.6)' }}>
          {cat.nombre}
        </Text>
        <Text style={{ ...FONTS.display, fontSize: 38, color: PALETTE.ink, letterSpacing: -1.2, lineHeight: 44, marginTop: 6 }}>
          {formatARS(total)}
        </Text>
        <Text style={{ fontSize: 12, color: PALETTE.muted, marginTop: 4 }}>
          {items.length} {items.length === 1 ? 'movimiento' : 'movimientos'} este mes
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{
          backgroundColor: PALETTE.card, borderRadius: 22, overflow: 'hidden',
          shadowColor: PALETTE.ink, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
        }}>
          {items.length === 0 && (
            <View style={{ padding: 28, alignItems: 'center' }}>
              <Text style={{ fontSize: 13, color: PALETTE.muted, textAlign: 'center' }}>
                Todavía no cargaste gastos de {cat.nombre.toLowerCase()}.
              </Text>
            </View>
          )}
          {items.map((g, i) => (
            <ExpenseRow key={g.id} g={g} isLast={i === items.length - 1} onDelete={() => deleteExpense(g.id)} />
          ))}
        </View>

        <Pressable
          onPress={() => { openAddExpense(catId); navigation.goBack(); }}
          style={({ pressed }) => ({
            marginTop: 14, height: 52, borderRadius: 18,
            backgroundColor: pressed ? `${cat.color}CC` : cat.color,
            alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8,
            shadowColor: cat.color, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 4,
          })}
        >
          <Text style={{ fontSize: 18, color: PALETTE.ink }}>+</Text>
          <Text style={{ ...FONTS.display, fontSize: 15, color: PALETTE.ink }}>
            Agregar gasto a {cat.nombre}
          </Text>
        </Pressable>

        {/* Delete category — solo para custom */}
        {cat.isCustom && (
          <Pressable
            onPress={handleDeleteCategory}
            style={{
              marginTop: 10, height: 44, borderRadius: 14,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'rgba(176,48,48,0.07)',
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#B03030' }}>
              Eliminar categoría
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

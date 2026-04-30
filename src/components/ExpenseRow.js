import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { FONTS, PALETTE } from '../constants/theme';
import { useData } from '../context/DataContext';
import { formatARS, relativeDate } from '../utils/format';

export default function ExpenseRow({ g, isLast, onDelete }) {
  const { allCategories, profile: currentProfile, openEditExpense } = useData();
  const cat = allCategories.find(c => c.id === g.categoria);
  if (!cat) return null;

  const autorNombre = g.profiles?.nombre ?? null;
  const isCurrentUser = g.user_id === currentProfile?.user_id;
  const displayName = autorNombre
    ? (isCurrentUser ? 'Tu' : autorNombre)
    : null;

  function handleDelete() {
    Alert.alert(
      'Eliminar gasto',
      '¿Estás seguro que querés eliminar este gasto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: onDelete },
      ],
    );
  }

  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: 16, paddingVertical: 12,
      borderBottomWidth: isLast ? 0 : 0.5,
      borderBottomColor: 'rgba(46,36,56,0.06)',
    }}>
      {/* Category icon */}
      <View style={{
        width: 40, height: 40, borderRadius: 13, backgroundColor: cat.tint,
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Text style={{ fontSize: 20 }}>{cat.emoji}</Text>
      </View>

      {/* Text */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ ...FONTS.bodySemiBold, fontSize: 14, color: PALETTE.ink, letterSpacing: -0.1 }}>
          {g.descripcion}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <Text style={{ fontSize: 11, color: PALETTE.muted }}>
            {cat.nombre} · {relativeDate(g.fecha)}
          </Text>
          {displayName && (
            <>
              <Text style={{ fontSize: 11, color: PALETTE.muted }}>·</Text>
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 3,
                backgroundColor: isCurrentUser ? PALETTE.accent + '33' : 'rgba(46,36,56,0.08)',
                borderRadius: 99, paddingHorizontal: 6, paddingVertical: 1,
              }}>
                <Text style={{ fontSize: 10, fontWeight: '600', color: PALETTE.ink }}>
                  {displayName}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Amount */}
      <Text style={{ ...FONTS.display, fontSize: 15, color: PALETTE.ink, letterSpacing: -0.2, flexShrink: 0 }}>
        −{formatARS(g.monto)}
      </Text>

      {/* Edit button */}
      <Pressable onPress={() => openEditExpense(g)} hitSlop={8} style={{ padding: 4 }}>
        <Text style={{ fontSize: 15, color: PALETTE.muted, lineHeight: 18 }}>✎</Text>
      </Pressable>

      {/* Delete button */}
      {onDelete && (
        <Pressable onPress={handleDelete} hitSlop={8} style={{ padding: 4 }}>
          <Text style={{ fontSize: 18, color: 'rgba(46,36,56,0.3)', lineHeight: 20 }}>×</Text>
        </Pressable>
      )}
    </View>
  );
}

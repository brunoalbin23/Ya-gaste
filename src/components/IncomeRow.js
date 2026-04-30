import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { FONTS, PALETTE } from '../constants/theme';
import { useData } from '../context/DataContext';
import { formatARS, relativeDate } from '../utils/format';

// Fallback para registros legacy (Sueldo, Freelance)
const TIPO_LEGACY = {
  Sueldo:    { nombre: 'Trabajo',   emoji: '💼', tint: '#E0F1F8' },
  Freelance: { nombre: 'Freelance', emoji: '🧑‍💻', tint: '#FFEFD4' },
};

export default function IncomeRow({ i, isLast, onDelete }) {
  const { allIncomeTipos, profile: currentProfile, openEditIncome } = useData();

  const tipoMeta = allIncomeTipos.find(t => t.id === i.tipo)
    ?? TIPO_LEGACY[i.tipo]
    ?? { nombre: i.tipo, emoji: '✨', tint: '#ECE6F6' };

  const autorNombre = i.profiles?.nombre ?? null;
  const isCurrentUser = i.user_id === currentProfile?.user_id;
  const displayName = autorNombre
    ? (isCurrentUser ? 'Tu' : autorNombre)
    : null;

  function handleDelete() {
    Alert.alert(
      'Eliminar ingreso',
      '¿Estás seguro que querés eliminar este ingreso?',
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
      <View style={{
        width: 40, height: 40, borderRadius: 13, backgroundColor: tipoMeta.tint,
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Text style={{ fontSize: 20 }}>{tipoMeta.emoji}</Text>
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ ...FONTS.bodySemiBold, fontSize: 14, color: PALETTE.ink }}>{tipoMeta.nombre}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <Text numberOfLines={1} style={{ fontSize: 11, color: PALETTE.muted, flexShrink: 1 }}>
            {i.descripcion} · {relativeDate(i.fecha)}
          </Text>
          {displayName && (
            <>
              <Text style={{ fontSize: 11, color: PALETTE.muted }}>·</Text>
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: isCurrentUser ? '#B8E6C833' : 'rgba(46,36,56,0.08)',
                borderRadius: 99, paddingHorizontal: 6, paddingVertical: 1,
              }}>
                <Text style={{ fontSize: 10, fontWeight: '600', color: '#1F3A2C' }}>
                  {displayName}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>

      <Text style={{ ...FONTS.display, fontSize: 15, color: '#2A6E47', letterSpacing: -0.2, flexShrink: 0 }}>
        +{formatARS(i.monto)}
      </Text>

      <Pressable onPress={() => openEditIncome(i)} hitSlop={8} style={{ padding: 4 }}>
        <Text style={{ fontSize: 15, color: PALETTE.muted, lineHeight: 18 }}>✎</Text>
      </Pressable>

      {onDelete && (
        <Pressable onPress={handleDelete} hitSlop={8} style={{ padding: 4 }}>
          <Text style={{ fontSize: 18, color: 'rgba(46,36,56,0.3)', lineHeight: 20 }}>×</Text>
        </Pressable>
      )}
    </View>
  );
}

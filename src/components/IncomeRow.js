import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { FONTS, PALETTE } from '../constants/theme';
import { formatARS, relativeDate } from '../utils/format';

const TIPO_META = {
  Sueldo:    { emoji: '💼', tint: '#E0F1F8' },
  Freelance: { emoji: '🧑‍💻', tint: '#FFEFD4' },
  Otros:     { emoji: '✨', tint: '#ECE6F6' },
};

function UserBadge({ nombre }) {
  if (!nombre) return null;
  return (
    <View style={{
      width: 18, height: 18, borderRadius: 9,
      backgroundColor: '#B8E6C8',
      alignItems: 'center', justifyContent: 'center',
      position: 'absolute', bottom: -3, right: -3,
      borderWidth: 1.5, borderColor: PALETTE.card,
    }}>
      <Text style={{ fontSize: 9, fontWeight: '700', color: '#1F3A2C' }}>
        {nombre.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

export default function IncomeRow({ i, isLast, onDelete }) {
  const meta = TIPO_META[i.tipo] ?? TIPO_META.Otros;
  const autorNombre = i.profiles?.nombre ?? null;

  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: 16, paddingVertical: 12,
      borderBottomWidth: isLast ? 0 : 0.5,
      borderBottomColor: 'rgba(46,36,56,0.06)',
    }}>
      <View style={{ position: 'relative' }}>
        <View style={{
          width: 40, height: 40, borderRadius: 13, backgroundColor: meta.tint,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontSize: 20 }}>{meta.emoji}</Text>
        </View>
        <UserBadge nombre={autorNombre} />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ ...FONTS.bodySemiBold, fontSize: 14, color: PALETTE.ink }}>{i.tipo}</Text>
        <Text numberOfLines={1} style={{ fontSize: 11, color: PALETTE.muted, marginTop: 2 }}>
          {i.descripcion} · {relativeDate(i.fecha)}
        </Text>
      </View>

      <Text style={{ ...FONTS.display, fontSize: 15, color: '#2A6E47', letterSpacing: -0.2 }}>
        +{formatARS(i.monto)}
      </Text>

      {onDelete && (
        <Pressable onPress={onDelete} hitSlop={8} style={{ padding: 4 }}>
          <Text style={{ fontSize: 18, color: 'rgba(46,36,56,0.3)', lineHeight: 20 }}>×</Text>
        </Pressable>
      )}
    </View>
  );
}

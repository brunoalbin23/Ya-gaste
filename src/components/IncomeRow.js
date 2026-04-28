import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { FONTS, PALETTE } from '../constants/theme';
import { formatARS, relativeDate } from '../utils/format';

const FUENTE_META = {
  Sueldo:    { emoji: '💼', tint: '#E0F1F8' },
  Freelance: { emoji: '🧑‍💻', tint: '#FFEFD4' },
  Otros:     { emoji: '✨', tint: '#ECE6F6' },
};

export default function IncomeRow({ i, isLast, onDelete }) {
  const meta = FUENTE_META[i.fuente] || FUENTE_META.Otros;

  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: 16, paddingVertical: 12,
      borderBottomWidth: isLast ? 0 : 0.5,
      borderBottomColor: 'rgba(46,36,56,0.06)',
    }}>
      <View style={{
        width: 40, height: 40, borderRadius: 13, backgroundColor: meta.tint,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 20 }}>{meta.emoji}</Text>
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ ...FONTS.bodySemiBold, fontSize: 14, color: PALETTE.ink }}>
          {i.fuente}
        </Text>
        <Text numberOfLines={1} style={{ fontSize: 11, color: PALETTE.muted, marginTop: 2 }}>
          {i.nota} · {relativeDate(i.fecha)}
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

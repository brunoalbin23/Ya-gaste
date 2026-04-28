import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { CATEGORY_BY_ID } from '../constants/categories';
import { FONTS, PALETTE } from '../constants/theme';
import { formatARS, relativeDate } from '../utils/format';

export default function ExpenseRow({ g, isLast, onDelete }) {
  const cat = CATEGORY_BY_ID[g.categoria];
  if (!cat) return null;

  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: 16, paddingVertical: 12,
      borderBottomWidth: isLast ? 0 : 0.5,
      borderBottomColor: 'rgba(46,36,56,0.06)',
    }}>
      <View style={{
        width: 40, height: 40, borderRadius: 13, backgroundColor: cat.tint,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 20 }}>{cat.emoji}</Text>
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{
          ...FONTS.bodySemiBold, fontSize: 14, color: PALETTE.ink, letterSpacing: -0.1,
        }}>
          {g.descripcion}
        </Text>
        <Text style={{ fontSize: 11, color: PALETTE.muted, marginTop: 2 }}>
          {cat.nombre} · {relativeDate(g.fecha)}
        </Text>
      </View>

      <Text style={{ ...FONTS.display, fontSize: 15, color: PALETTE.ink, letterSpacing: -0.2 }}>
        −{formatARS(g.monto)}
      </Text>

      {onDelete && (
        <Pressable onPress={onDelete} hitSlop={8} style={{ padding: 4 }}>
          <Text style={{ fontSize: 18, color: 'rgba(46,36,56,0.3)', lineHeight: 20 }}>×</Text>
        </Pressable>
      )}
    </View>
  );
}

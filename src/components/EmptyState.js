import React from 'react';
import { View, Text } from 'react-native';
import { FONTS, PALETTE } from '../constants/theme';

export default function EmptyState({ emoji, title, subtitle }) {
  return (
    <View style={{ paddingVertical: 60, alignItems: 'center' }}>
      <Text style={{ fontSize: 56, marginBottom: 12 }}>{emoji}</Text>
      <Text style={{ ...FONTS.display, fontSize: 18, color: PALETTE.ink }}>{title}</Text>
      <Text style={{ fontSize: 13, color: PALETTE.muted, marginTop: 6, textAlign: 'center' }}>{subtitle}</Text>
    </View>
  );
}

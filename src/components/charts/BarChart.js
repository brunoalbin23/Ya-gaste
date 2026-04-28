import React from 'react';
import { View, Text } from 'react-native';
import { PALETTE } from '../../constants/theme';
import { formatARS } from '../../utils/format';

export default function BarChart({ data, height = 120, accent = '#C5B8E3' }) {
  const max = Math.max(...data.map(d => d.value), 1);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, paddingHorizontal: 4, gap: 8 }}>
      {data.map((d, i) => {
        const barH = Math.max(4, (d.value / max) * (height - 28));
        const bg = d.highlight ? accent : `${accent}70`;

        return (
          <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
            <View style={{ alignItems: 'center' }}>
              {d.highlight && (
                <Text style={{ fontSize: 10, fontWeight: '600', color: PALETTE.ink, marginBottom: 4 }}>
                  {formatARS(d.value, { compact: true })}
                </Text>
              )}
              <View style={{ width: '100%', height: barH, borderRadius: 6, backgroundColor: bg }} />
            </View>
            <Text style={{ fontSize: 10, color: PALETTE.muted, fontWeight: '500' }}>{d.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

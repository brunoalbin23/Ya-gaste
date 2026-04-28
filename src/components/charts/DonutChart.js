import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { FONTS, PALETTE } from '../../constants/theme';
import { formatARS } from '../../utils/format';

export default function DonutChart({ data, size = 140, thickness = 20 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = (size - thickness) / 2;
  const C = 2 * Math.PI * r;
  let acc = 0;

  return (
    <View style={{ width: size, height: size, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(46,36,56,0.06)" strokeWidth={thickness}
        />
        {total > 0 && data.map((d, i) => {
          const frac = d.value / total;
          const len = C * frac;
          const dash = `${len} ${C - len}`;
          const offset = -acc * C;
          acc += frac;
          return (
            <Circle
              key={i} cx={size / 2} cy={size / 2} r={r}
              fill="none" stroke={d.color} strokeWidth={thickness}
              strokeDasharray={dash} strokeDashoffset={offset}
              strokeLinecap="butt"
            />
          );
        })}
      </Svg>

      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 10, color: PALETTE.muted, letterSpacing: 0.4, textTransform: 'uppercase' }}>
          Total
        </Text>
        <Text style={{ ...FONTS.display, fontSize: 20, color: PALETTE.ink, letterSpacing: -0.5, marginTop: 2 }}>
          {formatARS(total, { compact: total > 99999 })}
        </Text>
      </View>
    </View>
  );
}

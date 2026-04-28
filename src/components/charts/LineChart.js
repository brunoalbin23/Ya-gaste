import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

export default function LineChart({ data, width = 300, height = 100, accent = '#C5B8E3' }) {
  if (!data.length) return null;

  const max = Math.max(...data.map(d => d.value), 1);
  const stepX = width / Math.max(1, data.length - 1);
  const points = data.map((d, i) => [
    i * stepX,
    height - 16 - (d.value / max) * (height - 28),
  ]);

  const path = points.reduce((p, [x, y], i) => {
    if (i === 0) return `M ${x} ${y}`;
    const [px, py] = points[i - 1];
    const cx = (px + x) / 2;
    return `${p} C ${cx} ${py}, ${cx} ${y}, ${x} ${y}`;
  }, '');

  const areaPath = `${path} L ${width} ${height} L 0 ${height} Z`;
  const last = points[points.length - 1];

  return (
    <View>
      <Svg width={width} height={height} style={{ overflow: 'visible' }}>
        <Defs>
          <LinearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={accent} stopOpacity={0.45} />
            <Stop offset="100%" stopColor={accent} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Path d={areaPath} fill="url(#lg)" />
        <Path d={path} fill="none" stroke={accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {last && (
          <Circle cx={last[0]} cy={last[1]} r={4} fill={accent} stroke="#fff" strokeWidth={2} />
        )}
      </Svg>
    </View>
  );
}

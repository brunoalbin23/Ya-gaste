import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, View, Text } from 'react-native';
import { FONTS, PALETTE } from '../constants/theme';
import { formatARS } from '../utils/format';

const ANIM_CONFIGS = {
  flotar: { duration: 2600, prop: 'translateY', from: 0,  to: -3   },
  andar:  { duration: 1800, prop: 'translateX', from: -2, to: 2    },
  pulsar: { duration: 1600, prop: 'scale',      from: 1,  to: 1.08 },
  tilt:   { duration: 2400, prop: 'rotate',     from: -3, to: 3    },
  jiggle: { duration: 2200, prop: 'rotate',     from: -6, to: 6    },
  wiggle: { duration: 2400, prop: 'translateY', from: 0,  to: -2   },
};

function AnimatedEmoji({ emoji, animName }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const cfg = ANIM_CONFIGS[animName];
    if (!cfg) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: cfg.duration / 2, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: cfg.duration / 2, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [animName]);

  const cfg = ANIM_CONFIGS[animName];
  let transform = [];
  if (cfg) {
    const interpolated = anim.interpolate({ inputRange: [0, 1], outputRange: [cfg.from, cfg.to] });
    if (cfg.prop === 'rotate') {
      const rotateStr = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [`${cfg.from}deg`, `${cfg.to}deg`],
      });
      transform = [{ rotate: rotateStr }];
    } else if (cfg.prop === 'scale') {
      transform = [{ scale: interpolated }];
    } else if (cfg.prop === 'translateY') {
      transform = [{ translateY: interpolated }];
    } else if (cfg.prop === 'translateX') {
      transform = [{ translateX: interpolated }];
    }
  }

  return (
    <Animated.Text style={{ fontSize: 28, lineHeight: 36, transform }}>
      {emoji}
    </Animated.Text>
  );
}

export default function CategoryTile({ cat, total, count, onPress }) {
  const { nombre, emoji, color, tint, anim } = cat;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: PALETTE.card,
        borderRadius: 22,
        padding: 18,
        flex: 1,
        overflow: 'hidden',
        shadowColor: PALETTE.ink,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}
    >
      {/* corner blob */}
      <View style={{
        position: 'absolute', top: -22, right: -22, width: 70, height: 70,
        borderRadius: 35, backgroundColor: tint, opacity: 0.7,
      }} />

      {/* icon box */}
      <View style={{
        width: 52, height: 52, borderRadius: 16, backgroundColor: tint,
        alignItems: 'center', justifyContent: 'center', marginBottom: 10,
      }}>
        <AnimatedEmoji emoji={emoji} animName={anim} />
      </View>

      <Text style={{ ...FONTS.display, fontSize: 17, color: PALETTE.ink, letterSpacing: -0.2 }}>
        {nombre}
      </Text>
      <Text style={{ ...FONTS.display, fontSize: 18, fontWeight: '600', color: PALETTE.ink, letterSpacing: -0.4, marginTop: 4 }}>
        {formatARS(total)}
      </Text>
      <Text style={{ fontSize: 11, color: PALETTE.muted, marginTop: 2 }}>
        {count === 0 ? 'sin movimientos' : `${count} ${count === 1 ? 'gasto' : 'gastos'}`}
      </Text>

      {/* bottom accent bar */}
      <View style={{
        position: 'absolute', left: 14, right: 14, bottom: 0, height: 3,
        borderRadius: 2, backgroundColor: color, opacity: 0.85,
      }} />
    </Pressable>
  );
}

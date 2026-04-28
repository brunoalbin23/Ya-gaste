import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS, PALETTE } from '../constants/theme';

export default function Sheet({ visible, onClose, title, children }) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 300, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(46,36,56,0.45)', opacity: fadeAnim }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <Animated.View style={{
          backgroundColor: PALETTE.bg,
          borderTopLeftRadius: 28, borderTopRightRadius: 28,
          paddingTop: 12, paddingHorizontal: 18,
          paddingBottom: insets.bottom + 16,
          maxHeight: '90%',
          transform: [{ translateY: slideAnim }],
        }}>
          {/* drag handle */}
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(46,36,56,0.18)', alignSelf: 'center', marginBottom: 10 }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ ...FONTS.display, fontSize: 20, color: PALETTE.ink, letterSpacing: -0.4 }}>
              {title}
            </Text>
            <Pressable onPress={onClose} style={{
              width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(46,36,56,0.06)',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 16, color: PALETTE.ink, lineHeight: 18 }}>✕</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

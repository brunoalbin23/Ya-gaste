import React, { useEffect, useRef } from 'react';
import {
  Animated, Modal, Pressable, View, Text,
  ScrollView, KeyboardAvoidingView, Platform,
  useWindowDimensions, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS, PALETTE } from '../constants/theme';
import { useLayout } from '../hooks/useLayout';

const DESKTOP_MODAL_WIDTH = 580;

function DesktopModal({ visible, onClose, title, children }) {
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1,    duration: 180, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, tension: 200, friction: 20 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 0,    duration: 140, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.96, duration: 140, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const modalWidth = Math.min(DESKTOP_MODAL_WIDTH, windowWidth * 0.9);
  const maxHeight  = windowHeight * 0.85;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
        {/* Backdrop */}
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(46,36,56,0.5)' }]}
          onPress={onClose}
        />
        {/* Card */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', pointerEvents: 'box-none' }}>
          <Animated.View style={{
            width: modalWidth,
            maxHeight,
            backgroundColor: PALETTE.bg,
            borderRadius: 24,
            overflow: 'hidden',
            transform: [{ scale: scaleAnim }],
            shadowColor: PALETTE.ink,
            shadowOffset: { width: 0, height: 20 },
            shadowOpacity: 0.18,
            shadowRadius: 40,
            elevation: 24,
          }}>
            {/* Header */}
            <View style={{
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              paddingHorizontal: 24, paddingTop: 22, paddingBottom: 14,
              borderBottomWidth: 1, borderBottomColor: 'rgba(46,36,56,0.07)',
            }}>
              <Text style={{ ...FONTS.display, fontSize: 20, color: PALETTE.ink, letterSpacing: -0.4 }}>
                {title}
              </Text>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => ({
                  width: 32, height: 32, borderRadius: 10,
                  backgroundColor: pressed ? 'rgba(46,36,56,0.12)' : 'rgba(46,36,56,0.06)',
                  alignItems: 'center', justifyContent: 'center',
                })}
              >
                <Text style={{ fontSize: 16, color: PALETTE.ink, lineHeight: 18 }}>✕</Text>
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}
            >
              {children}
            </ScrollView>
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
}

function MobileSheet({ visible, onClose, title, children }) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 0,   duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 300, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
              <Pressable
                onPress={onClose}
                style={{
                  width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(46,36,56,0.06)',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 16, color: PALETTE.ink, lineHeight: 18 }}>✕</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function Sheet({ visible, onClose, title, children }) {
  const { isDesktop } = useLayout();

  if (isDesktop) {
    return (
      <DesktopModal visible={visible} onClose={onClose} title={title}>
        {children}
      </DesktopModal>
    );
  }

  return (
    <MobileSheet visible={visible} onClose={onClose} title={title}>
      {children}
    </MobileSheet>
  );
}

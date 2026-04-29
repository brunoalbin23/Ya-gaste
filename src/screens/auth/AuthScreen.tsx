import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { PALETTE, FONTS } from '../../constants/theme';

type Mode = 'login' | 'register';

function mapError(msg: string): string {
  if (msg.includes('Invalid login')) return 'Email o contraseña incorrectos';
  if (msg.includes('already registered')) return 'Este email ya tiene una cuenta';
  if (msg.includes('Password should')) return 'La contraseña debe tener al menos 6 caracteres';
  if (msg.includes('valid email')) return 'Ingresá un email válido';
  return msg;
}

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function switchMode(m: Mode) {
    setMode(m);
    setError(null);
  }

  async function handleSubmit() {
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError('Completá todos los campos');
      return;
    }
    if (mode === 'register' && nombre.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password, nombre.trim());
      }
    } catch (e: any) {
      setError(mapError(e.message ?? 'Error inesperado'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: PALETTE.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[s.container, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={s.logo}>
          <Text style={s.logoEmoji}>💸</Text>
          <Text style={s.logoTitle}>Chaucha</Text>
          <Text style={s.logoSub}>Tus finanzas, en familia</Text>
        </View>

        {/* Card */}
        <View style={s.card}>
          {/* Tabs */}
          <View style={s.tabs}>
            {(['login', 'register'] as const).map(m => (
              <Pressable key={m} onPress={() => switchMode(m)} style={[s.tab, mode === m && s.tabActive]}>
                <Text style={[s.tabText, mode === m && s.tabTextActive]}>
                  {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Fields */}
          {mode === 'register' && (
            <>
              <Text style={s.label}>Nombre</Text>
              <TextInput
                value={nombre} onChangeText={setNombre}
                placeholder="¿Cómo te llamás?"
                placeholderTextColor={PALETTE.muted}
                autoCapitalize="words"
                style={s.input}
              />
            </>
          )}

          <Text style={s.label}>Email</Text>
          <TextInput
            value={email} onChangeText={setEmail}
            placeholder="tu@email.com"
            placeholderTextColor={PALETTE.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={s.input}
          />

          <Text style={s.label}>Contraseña</Text>
          <TextInput
            value={password} onChangeText={setPassword}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor={PALETTE.muted}
            secureTextEntry
            style={s.input}
          />

          {error && (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}

          <Pressable onPress={handleSubmit} disabled={loading} style={[s.btn, loading && { opacity: 0.6 }]}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>{mode === 'login' ? 'Entrar' : 'Crear cuenta'}</Text>
            }
          </Pressable>

          {mode === 'register' && (
            <Text style={s.hint}>
              Al registrarte se crea tu familia personal con un código único que podés compartir.
            </Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:      { paddingHorizontal: 24, flexGrow: 1 },
  logo:           { alignItems: 'center', marginBottom: 32 },
  logoEmoji:      { fontSize: 56, marginBottom: 8 },
  logoTitle:      { fontSize: 34, fontWeight: '700', color: PALETTE.ink, letterSpacing: -1.2 },
  logoSub:        { fontSize: 14, color: PALETTE.muted, marginTop: 4 },
  card: {
    backgroundColor: PALETTE.card, borderRadius: 28, padding: 20,
    shadowColor: PALETTE.ink, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08, shadowRadius: 20, elevation: 6,
  },
  tabs:           { flexDirection: 'row', backgroundColor: 'rgba(46,36,56,0.06)', borderRadius: 12, padding: 3, marginBottom: 20 },
  tab:            { flex: 1, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tabActive: {
    backgroundColor: PALETTE.card,
    shadowColor: PALETTE.ink, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  tabText:        { fontSize: 13, fontWeight: '500', color: PALETTE.muted },
  tabTextActive:  { color: PALETTE.ink, fontWeight: '600' },
  label:          { fontSize: 11, fontWeight: '700', color: PALETTE.muted, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6, marginTop: 14, marginLeft: 4 },
  input: {
    backgroundColor: PALETTE.bg, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: PALETTE.ink,
    borderWidth: 1, borderColor: 'rgba(46,36,56,0.1)',
  },
  errorBox:       { backgroundColor: '#FFE5E0', borderRadius: 12, padding: 10, marginTop: 14 },
  errorText:      { color: '#B03030', fontSize: 13, textAlign: 'center' },
  btn: {
    height: 52, borderRadius: 16, backgroundColor: PALETTE.ink,
    alignItems: 'center', justifyContent: 'center', marginTop: 20,
  },
  btnText:        { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  hint:           { fontSize: 12, color: PALETTE.muted, textAlign: 'center', marginTop: 14, lineHeight: 18 },
});

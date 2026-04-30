import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { PALETTE, FONTS } from '../constants/theme';

function Avatar({ nombre, size = 40 }: { nombre: string; size?: number }) {
  const initial = nombre?.charAt(0)?.toUpperCase() ?? '?';
  return (
    <View style={[s.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={{ fontSize: size * 0.4, fontWeight: '700', color: PALETTE.ink }}>{initial}</Text>
    </View>
  );
}

// ── Family setup screen (shown when familia === null) ────────────────────────

function FamiliaSetup() {
  const { createFamilia, joinFamilia } = useData();
  const [mode, setMode] = useState<'idle' | 'join'>('idle');
  const [codigoInput, setCodigoInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      await createFamilia();
    } catch (e: any) {
      setError(e.message ?? 'No se pudo crear la familia');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!codigoInput.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await joinFamilia(codigoInput);
    } catch (e: any) {
      setError(e.message.includes('inválido') ? 'Código inválido. Revisalo e intentá de nuevo.' : e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={s.card}>
      <Text style={[s.fieldLabel, { marginBottom: 4, marginTop: 0 }]}>Núcleo familiar</Text>
      <Text style={{ fontSize: 13, color: PALETTE.muted, marginBottom: 20, lineHeight: 18 }}>
        Organizá tus finanzas con tu familia. Podés crear un nuevo núcleo o unirte a uno existente.
      </Text>

      {/* Create */}
      <Pressable
        onPress={handleCreate}
        disabled={loading}
        style={({ pressed }) => [s.setupBtn, { backgroundColor: pressed ? '#1a3026' : '#1F3A2C', opacity: loading ? 0.6 : 1 }]}
      >
        {loading && mode === 'idle'
          ? <ActivityIndicator color="#fff" size="small" />
          : <>
              <Text style={{ fontSize: 22, marginRight: 4 }}>🏠</Text>
              <View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Crear núcleo familiar</Text>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 1 }}>
                  Generá tu familia y compartí el código
                </Text>
              </View>
            </>
        }
      </Pressable>

      {/* Join */}
      {mode === 'idle' ? (
        <Pressable onPress={() => setMode('join')} style={s.outlineBtn}>
          <Text style={{ fontSize: 18, marginRight: 6 }}>🔗</Text>
          <View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: PALETTE.ink }}>Unirme a una familia</Text>
            <Text style={{ fontSize: 11, color: PALETTE.muted, marginTop: 1 }}>Ingresá el código que te compartieron</Text>
          </View>
        </Pressable>
      ) : (
        <View style={{ marginTop: 12 }}>
          <Text style={s.fieldLabel}>Código de familia</Text>
          <TextInput
            value={codigoInput}
            onChangeText={v => { setCodigoInput(v.toUpperCase()); setError(null); }}
            placeholder="Ej: CHAU42"
            placeholderTextColor={PALETTE.muted}
            autoCapitalize="characters"
            maxLength={6}
            style={s.input}
          />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <Pressable
              onPress={() => { setMode('idle'); setCodigoInput(''); setError(null); }}
              style={[s.outlineBtn, { flex: 1, marginTop: 0, flexDirection: 'row', justifyContent: 'center' }]}
            >
              <Text style={s.outlineBtnText}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={handleJoin}
              disabled={loading || codigoInput.length < 4}
              style={[s.smallBtn, { flex: 1, height: 44 }, (loading || codigoInput.length < 4) && { opacity: 0.4 }]}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.smallBtnText}>Unirse</Text>
              }
            </Pressable>
          </View>
        </View>
      )}

      {error && <Text style={[s.errorText, { marginTop: 10 }]}>{error}</Text>}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const { profile, familia, familiaMembers, updateNombre, joinFamilia, leaveFamilia } = useData();

  const [nombreEdit, setNombreEdit] = useState(profile?.nombre ?? '');
  const [savingNombre, setSavingNombre] = useState(false);
  const [nombreError, setNombreError] = useState<string | null>(null);
  const [nombreSaved, setNombreSaved] = useState(false);

  const [codigoInput, setCodigoInput] = useState('');
  const [joiningFam, setJoiningFam] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [showJoinInput, setShowJoinInput] = useState(false);

  const isAlone = familiaMembers.length <= 1;

  async function handleSaveNombre() {
    if (nombreEdit.trim() === profile?.nombre) return;
    setNombreError(null);
    setSavingNombre(true);
    try {
      await updateNombre(nombreEdit.trim());
      setNombreSaved(true);
      setTimeout(() => setNombreSaved(false), 2000);
    } catch (e: any) {
      setNombreError(e.message);
    } finally {
      setSavingNombre(false);
    }
  }

  async function handleJoin() {
    if (!codigoInput.trim()) return;
    setJoinError(null);
    setJoiningFam(true);
    try {
      await joinFamilia(codigoInput);
      setShowJoinInput(false);
      setCodigoInput('');
    } catch (e: any) {
      setJoinError(e.message.includes('inválido') ? 'Código inválido. Revisalo e intentá de nuevo.' : e.message);
    } finally {
      setJoiningFam(false);
    }
  }

  function handleLeave() {
    Alert.alert(
      'Salir de la familia',
      'Vas a crear una nueva familia personal. Tus gastos anteriores quedan en la familia actual.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', style: 'destructive', onPress: () => leaveFamilia() },
      ],
    );
  }

  function copyCode() {
    if (familia?.codigo) {
      Clipboard.setStringAsync(familia.codigo);
      Alert.alert('Copiado', `Código "${familia.codigo}" copiado al portapapeles`);
    }
  }

  function handleLogout() {
    Alert.alert('Cerrar sesión', '¿Querés salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: signOut },
    ]);
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: PALETTE.bg }}
      contentContainerStyle={[s.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ marginBottom: 22 }}>
        <Text style={s.sectionLabel}>Mi cuenta</Text>
        <Text style={s.title}>Perfil</Text>
      </View>

      {/* Avatar + Nombre */}
      <View style={s.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <Avatar nombre={profile?.nombre ?? ''} size={52} />
          <View>
            <Text style={s.profileName}>{profile?.nombre}</Text>
            {familia && (
              <Text style={{ fontSize: 12, color: PALETTE.muted }}>Miembro de {familia.nombre}</Text>
            )}
          </View>
        </View>

        <Text style={s.fieldLabel}>Nombre</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            value={nombreEdit}
            onChangeText={v => { setNombreEdit(v); setNombreError(null); setNombreSaved(false); }}
            maxLength={30}
            autoCapitalize="words"
            style={[s.input, { flex: 1 }]}
            placeholderTextColor={PALETTE.muted}
          />
          <Pressable
            onPress={handleSaveNombre}
            disabled={savingNombre || nombreEdit.trim() === profile?.nombre || nombreEdit.trim().length < 2}
            style={[s.smallBtn, (savingNombre || nombreEdit.trim() === profile?.nombre || nombreEdit.trim().length < 2) && { opacity: 0.4 }]}
          >
            {savingNombre
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.smallBtnText}>{nombreSaved ? '✓' : 'Guardar'}</Text>
            }
          </Pressable>
        </View>
        {nombreError && <Text style={s.errorText}>{nombreError}</Text>}
        <Text style={s.hint}>Entre 2 y 30 caracteres</Text>
      </View>

      {/* Núcleo familiar */}
      <Text style={[s.sectionLabel, { marginTop: 24, marginBottom: 4 }]}>Núcleo familiar</Text>

      {!familia ? (
        /* No family yet — show setup options */
        <FamiliaSetup />
      ) : (
        /* Family exists — show details */
        <View style={s.card}>
          {/* Código familiar */}
          <Text style={s.fieldLabel}>Código para invitar</Text>
          <Pressable onPress={copyCode} style={s.codeBox}>
            <Text style={s.code}>{familia.codigo}</Text>
            <Text style={{ fontSize: 12, color: PALETTE.muted, marginTop: 4 }}>Tocá para copiar</Text>
          </Pressable>

          {/* Miembros */}
          <Text style={[s.fieldLabel, { marginTop: 16 }]}>Miembros ({familiaMembers.length})</Text>
          {familiaMembers.map(m => (
            <View key={m.id} style={s.memberRow}>
              <Avatar nombre={m.nombre} size={32} />
              <Text style={{ fontSize: 14, color: PALETTE.ink, fontWeight: '500' }}>{m.nombre}</Text>
              {m.user_id === profile?.user_id && (
                <View style={s.youBadge}><Text style={{ fontSize: 10, color: PALETTE.muted, fontWeight: '600' }}>Tu</Text></View>
              )}
            </View>
          ))}

          {/* Unirse a otra familia */}
          {!showJoinInput ? (
            <Pressable onPress={() => setShowJoinInput(true)} style={s.outlineBtn}>
              <Text style={s.outlineBtnText}>🔗 Unirse a otra familia</Text>
            </Pressable>
          ) : (
            <View style={{ marginTop: 12 }}>
              <Text style={s.fieldLabel}>Código de familia</Text>
              <TextInput
                value={codigoInput}
                onChangeText={v => { setCodigoInput(v.toUpperCase()); setJoinError(null); }}
                placeholder="Ej: CHAU42"
                placeholderTextColor={PALETTE.muted}
                autoCapitalize="characters"
                maxLength={6}
                style={s.input}
              />
              {joinError && <Text style={s.errorText}>{joinError}</Text>}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <Pressable onPress={() => { setShowJoinInput(false); setCodigoInput(''); setJoinError(null); }} style={[s.outlineBtn, { flex: 1, marginTop: 0 }]}>
                  <Text style={s.outlineBtnText}>Cancelar</Text>
                </Pressable>
                <Pressable onPress={handleJoin} disabled={joiningFam || codigoInput.length < 4} style={[s.smallBtn, { flex: 1, height: 44 }, (joiningFam || codigoInput.length < 4) && { opacity: 0.4 }]}>
                  {joiningFam
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={s.smallBtnText}>Unirse</Text>
                  }
                </Pressable>
              </View>
            </View>
          )}

          {/* Salir de familia (solo si hay más miembros) */}
          {!isAlone && (
            <Pressable onPress={handleLeave} style={[s.outlineBtn, { marginTop: 8, borderColor: '#FFB8B8' }]}>
              <Text style={[s.outlineBtnText, { color: '#C0392B' }]}>Salir de la familia</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Logout */}
      <Pressable onPress={handleLogout} style={s.logoutBtn}>
        <Text style={s.logoutText}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:      { paddingHorizontal: 18 },
  sectionLabel:   { fontSize: 12, color: PALETTE.muted, letterSpacing: 0.4, textTransform: 'uppercase', fontWeight: '600' },
  title:          { ...FONTS.display, fontSize: 28, color: PALETTE.ink, letterSpacing: -0.6, marginTop: 2 },
  card: {
    backgroundColor: PALETTE.card, borderRadius: 22, padding: 18, marginBottom: 12,
    shadowColor: PALETTE.ink, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  profileName:    { ...FONTS.display, fontSize: 20, color: PALETTE.ink, letterSpacing: -0.3 },
  fieldLabel:     { fontSize: 11, fontWeight: '700', color: PALETTE.muted, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8, marginLeft: 2, marginTop: 4 },
  input: {
    backgroundColor: PALETTE.bg, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 11,
    fontSize: 15, color: PALETTE.ink,
    borderWidth: 1, borderColor: 'rgba(46,36,56,0.1)',
  },
  smallBtn: {
    height: 44, paddingHorizontal: 16, borderRadius: 12,
    backgroundColor: PALETTE.ink, alignItems: 'center', justifyContent: 'center',
  },
  smallBtnText:   { color: '#fff', fontWeight: '700', fontSize: 13 },
  hint:           { fontSize: 11, color: PALETTE.muted, marginTop: 6, marginLeft: 2 },
  errorText:      { color: '#B03030', fontSize: 12, marginTop: 6, marginLeft: 2 },
  codeBox: {
    backgroundColor: PALETTE.bg, borderRadius: 16,
    paddingVertical: 16, alignItems: 'center',
    borderWidth: 1.5, borderColor: PALETTE.accent, borderStyle: 'dashed',
  },
  code:           { fontSize: 32, fontWeight: '800', color: PALETTE.ink, letterSpacing: 6 },
  memberRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  youBadge: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99,
    backgroundColor: 'rgba(46,36,56,0.06)',
  },
  outlineBtn: {
    marginTop: 12, height: 54, borderRadius: 14, borderWidth: 1.5,
    borderColor: 'rgba(46,36,56,0.15)', flexDirection: 'row',
    alignItems: 'center', paddingHorizontal: 16, gap: 2,
  },
  outlineBtnText: { fontSize: 13, fontWeight: '600', color: PALETTE.ink },
  setupBtn: {
    height: 62, borderRadius: 16, flexDirection: 'row',
    alignItems: 'center', paddingHorizontal: 18, gap: 12, marginBottom: 10,
  },
  avatar: {
    backgroundColor: PALETTE.accent, alignItems: 'center', justifyContent: 'center',
  },
  logoutBtn: {
    marginTop: 8, height: 48, borderRadius: 14,
    backgroundColor: 'rgba(192,57,43,0.08)', alignItems: 'center', justifyContent: 'center',
  },
  logoutText:     { fontSize: 14, fontWeight: '600', color: '#C0392B' },
});

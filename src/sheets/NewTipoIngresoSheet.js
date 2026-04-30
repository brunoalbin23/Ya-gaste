import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { FONTS, PALETTE } from '../constants/theme';
import { useData } from '../context/DataContext';
import Sheet from '../components/Sheet';

const PASTEL_COLORS = [
  '#B8E6C8', '#9DD6EE', '#FFD58A', '#C5B8E3',
  '#FFB8B8', '#F5A8C7', '#FFE5A3', '#A8D8F0',
  '#DDB8E3', '#9FDCB8', '#F0D0B8', '#C8D8F0',
];

const PRESET_EMOJIS = [
  '💼', '💰', '🏦', '📈', '🤝', '🎓', '🏠', '💻', '🎯', '✈️', '🎁', '🔧',
  '💵', '🪙', '📊', '🛒', '🎨', '🏋️', '🔑', '🚀', '🌱', '💎', '🤑', '🏅',
];

function FormLabel({ children }) {
  return (
    <Text style={{
      fontSize: 11, fontWeight: '700', color: PALETTE.muted,
      letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6, marginLeft: 4,
    }}>
      {children}
    </Text>
  );
}

export default function NewTipoIngresoSheet() {
  const { showNewIncomeTipo, setShowNewIncomeTipo, addCustomIncomeTipo } = useData();

  const [nombre, setNombre] = useState('');
  const [emoji, setEmoji] = useState('💰');
  const [color, setColor] = useState('#B8E6C8');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const canSave = nombre.trim().length >= 2;

  function handleClose() {
    setNombre('');
    setEmoji('💰');
    setColor('#B8E6C8');
    setError(null);
    setSaving(false);
    setShowNewIncomeTipo(false);
  }

  async function submit() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await addCustomIncomeTipo({ nombre: nombre.trim(), emoji, color });
      handleClose();
    } catch (e) {
      setError(e.message ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet visible={showNewIncomeTipo} onClose={handleClose} title="Nuevo tipo de ingreso">
      {/* Preview */}
      <View style={{
        alignSelf: 'center', marginBottom: 20,
        width: 72, height: 72, borderRadius: 22,
        backgroundColor: color + '33',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: color,
      }}>
        <Text style={{ fontSize: 36 }}>{emoji}</Text>
      </View>

      <FormLabel>Nombre</FormLabel>
      <TextInput
        value={nombre}
        onChangeText={setNombre}
        placeholder="Ej: Préstamo, Alquiler, Beca…"
        placeholderTextColor={PALETTE.muted}
        maxLength={20}
        style={{
          backgroundColor: PALETTE.card, borderRadius: 14,
          paddingHorizontal: 14, paddingVertical: 12,
          ...FONTS.body, fontSize: 15, color: PALETTE.ink, marginBottom: 16,
          shadowColor: PALETTE.ink, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
        }}
      />

      <FormLabel>Emoji</FormLabel>
      <TextInput
        value={emoji}
        onChangeText={(v) => {
          const chars = [...v];
          if (chars.length > 0) setEmoji(chars[chars.length - 1]);
        }}
        style={{
          backgroundColor: PALETTE.card, borderRadius: 14,
          paddingHorizontal: 14, paddingVertical: 10,
          fontSize: 24, color: PALETTE.ink, marginBottom: 8, width: 70,
          shadowColor: PALETTE.ink, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
        }}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {PRESET_EMOJIS.map(e => (
          <Pressable
            key={e}
            onPress={() => setEmoji(e)}
            style={{
              width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
              backgroundColor: emoji === e ? PALETTE.accent + '55' : 'rgba(46,36,56,0.05)',
              borderWidth: emoji === e ? 1.5 : 0,
              borderColor: emoji === e ? PALETTE.accent : 'transparent',
            }}
          >
            <Text style={{ fontSize: 22 }}>{e}</Text>
          </Pressable>
        ))}
      </View>

      <FormLabel>Color</FormLabel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
        {PASTEL_COLORS.map(c => (
          <Pressable
            key={c}
            onPress={() => setColor(c)}
            style={{
              width: 36, height: 36, borderRadius: 10, backgroundColor: c,
              borderWidth: color === c ? 2.5 : 0,
              borderColor: color === c ? PALETTE.ink : 'transparent',
              shadowColor: c, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 2,
            }}
          />
        ))}
      </View>

      {error && (
        <Text style={{ color: '#B03030', fontSize: 12, textAlign: 'center', marginBottom: 8 }}>{error}</Text>
      )}

      <Pressable
        onPress={submit}
        disabled={!canSave || saving}
        style={{
          height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
          backgroundColor: canSave ? '#1F3A2C' : 'rgba(46,36,56,0.2)',
          marginBottom: 8, opacity: saving ? 0.6 : 1,
        }}
      >
        {saving
          ? <ActivityIndicator color="#fff" />
          : <Text style={{ ...FONTS.display, fontWeight: '600', fontSize: 15, color: '#fff' }}>Crear tipo</Text>
        }
      </Pressable>
    </Sheet>
  );
}

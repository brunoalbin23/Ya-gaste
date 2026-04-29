import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { FONTS, PALETTE } from '../constants/theme';
import { useData } from '../context/DataContext';
import Sheet from '../components/Sheet';
import { formatARS } from '../utils/format';

const TIPOS = ['Sueldo', 'Freelance', 'Otros'];
const TIPO_META = {
  Sueldo:    { emoji: '💼', tint: '#E0F1F8' },
  Freelance: { emoji: '🧑‍💻', tint: '#FFEFD4' },
  Otros:     { emoji: '✨', tint: '#ECE6F6' },
};

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

export default function AddIncomeSheet() {
  const { showAddIncome, setShowAddIncome, addIncome } = useData();
  const [form, setForm] = useState({ tipo: 'Sueldo', monto: '', descripcion: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const canSave = parseInt((form.monto || '').replace(/[^\d]/g, ''), 10) > 0;
  const displayMonto = form.monto
    ? formatARS(parseInt(form.monto.replace(/[^\d]/g, ''), 10) || 0).replace('$', '')
    : '';

  function handleClose() {
    setForm({ tipo: 'Sueldo', monto: '', descripcion: '' });
    setError(null);
    setShowAddIncome(false);
  }

  async function submit() {
    const monto = parseInt((form.monto || '').replace(/[^\d]/g, ''), 10);
    if (!monto) return;
    setSaving(true);
    setError(null);
    try {
      await addIncome({ tipo: form.tipo, monto, descripcion: form.descripcion || form.tipo });
      handleClose();
    } catch (e) {
      setError(e.message ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet visible={showAddIncome} onClose={handleClose} title="Cargar ingreso">
      <FormLabel>Fuente</FormLabel>
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14 }}>
        {TIPOS.map(t => {
          const active = form.tipo === t;
          const meta = TIPO_META[t];
          return (
            <Pressable
              key={t}
              onPress={() => setForm(s => ({ ...s, tipo: t }))}
              style={{
                flex: 1, paddingVertical: 12, paddingHorizontal: 6, borderRadius: 14,
                backgroundColor: active ? meta.tint : PALETTE.card,
                borderWidth: active ? 1.5 : 0,
                borderColor: active ? '#1F3A2C' : 'transparent',
                alignItems: 'center', gap: 4,
                shadowColor: PALETTE.ink, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
              }}
            >
              <Text style={{ fontSize: 22 }}>{meta.emoji}</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: PALETTE.ink }}>{t}</Text>
            </Pressable>
          );
        })}
      </View>

      <FormLabel>Monto</FormLabel>
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: PALETTE.card, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12,
      }}>
        <Text style={{ ...FONTS.display, fontSize: 28, color: '#2A6E47' }}>+$</Text>
        <TextInput
          keyboardType="numeric"
          value={displayMonto}
          onChangeText={(v) => setForm(f => ({ ...f, monto: v.replace(/[^\d]/g, '') }))}
          placeholder="0"
          placeholderTextColor={PALETTE.muted}
          style={{ flex: 1, ...FONTS.display, fontSize: 28, color: PALETTE.ink }}
        />
      </View>

      <FormLabel>Descripción</FormLabel>
      <TextInput
        value={form.descripcion}
        onChangeText={(v) => setForm(s => ({ ...s, descripcion: v }))}
        placeholder="Ej: Empresa SA — abril"
        placeholderTextColor={PALETTE.muted}
        style={{
          backgroundColor: PALETTE.card, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
          ...FONTS.body, fontSize: 14, color: PALETTE.ink, marginBottom: 16,
        }}
      />

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
          : <Text style={{ ...FONTS.display, fontWeight: '600', fontSize: 15, color: '#fff' }}>Guardar ingreso</Text>
        }
      </Pressable>
    </Sheet>
  );
}

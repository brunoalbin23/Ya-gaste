import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { CATEGORIES } from '../constants/categories';
import { FONTS, PALETTE } from '../constants/theme';
import { useData } from '../context/DataContext';
import Sheet from '../components/Sheet';
import { simulatedParse } from '../utils/aiParse';
import { formatARS } from '../utils/format';

const EJEMPLOS = [
  'pagué $1200 de luz',
  'gasté 4500 en nafta',
  'super 18.650 hoy',
  'farmacia 7300',
  'cine 6200 con Sofi',
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

export default function AddExpenseSheet() {
  const { showAddExpense, setShowAddExpense, presetCategory, addExpense } = useData();
  const [text, setText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parseSource, setParseSource] = useState(null);
  const [form, setForm] = useState({ categoria: presetCategory || 'comida', monto: '', descripcion: '' });

  const runIA = async (input) => {
    if (!input.trim()) return;
    setParsing(true);
    setParseSource(null);
    try {
      const result = simulatedParse(input);
      setForm({ categoria: result.categoria, monto: String(result.monto || ''), descripcion: result.descripcion });
      setParseSource(result.source);
    } finally {
      setParsing(false);
    }
  };

  const displayMonto = form.monto
    ? formatARS(parseInt(form.monto.replace(/[^\d]/g, ''), 10) || 0).replace('$', '')
    : '';

  const canSave = parseInt((form.monto || '').replace(/[^\d]/g, ''), 10) > 0;

  const handleClose = () => {
    setText('');
    setParsing(false);
    setParseSource(null);
    setForm({ categoria: presetCategory || 'comida', monto: '', descripcion: '' });
    setShowAddExpense(false);
  };

  const submit = () => {
    const monto = parseInt((form.monto || '').replace(/[^\d]/g, ''), 10);
    if (!monto || monto <= 0) return;
    addExpense({ categoria: form.categoria, monto, descripcion: form.descripcion || 'Gasto' });
    handleClose();
  };

  return (
    <Sheet visible={showAddExpense} onClose={handleClose} title="Agregar gasto">
      {/* IA box */}
      <View style={{
        backgroundColor: '#ECE6F6', borderRadius: 20, padding: 14, marginBottom: 14,
        borderWidth: 1, borderColor: 'rgba(197,184,227,0.5)',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Text style={{ fontSize: 16 }}>✨</Text>
          <Text style={{ fontSize: 12, fontWeight: '700', color: PALETTE.ink, letterSpacing: 0.4, textTransform: 'uppercase' }}>
            Asistente IA
          </Text>
          {parseSource === 'sim' && (
            <View style={{ marginLeft: 'auto', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, backgroundColor: 'rgba(46,36,56,0.08)' }}>
              <Text style={{ fontSize: 10, fontWeight: '600', color: PALETTE.muted }}>modo offline</Text>
            </View>
          )}
        </View>

        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder='Escribí algo como "pagué $14.200 de luz"…'
            placeholderTextColor={PALETTE.muted}
            multiline
            numberOfLines={2}
            style={{
              flex: 1, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 12,
              padding: 10, ...FONTS.body, fontSize: 13, color: PALETTE.ink,
              textAlignVertical: 'top', minHeight: 52,
            }}
          />
          <Pressable
            onPress={() => runIA(text)}
            disabled={parsing || !text.trim()}
            style={{
              width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
              backgroundColor: parsing || !text.trim() ? 'rgba(46,36,56,0.15)' : PALETTE.accent,
            }}
          >
            {parsing
              ? <ActivityIndicator size="small" color={PALETTE.ink} />
              : <Text style={{ fontSize: 18, color: PALETTE.ink }}>→</Text>
            }
          </Pressable>
        </View>

        {/* Examples */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {EJEMPLOS.map((ex, i) => (
            <Pressable
              key={i}
              onPress={() => { setText(ex); runIA(ex); }}
              style={{
                paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99,
                backgroundColor: 'rgba(255,255,255,0.6)',
              }}
            >
              <Text style={{ fontSize: 11, color: PALETTE.muted }}>{ex}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Amount */}
      <FormLabel>Monto</FormLabel>
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: PALETTE.card, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12,
        shadowColor: PALETTE.ink, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
      }}>
        <Text style={{ ...FONTS.display, fontSize: 28, color: PALETTE.muted }}>$</Text>
        <TextInput
          keyboardType="numeric"
          value={displayMonto}
          onChangeText={(v) => setForm(f => ({ ...f, monto: v.replace(/[^\d]/g, '') }))}
          placeholder="0"
          placeholderTextColor={PALETTE.muted}
          style={{ flex: 1, ...FONTS.display, fontSize: 28, color: PALETTE.ink, letterSpacing: -0.5 }}
        />
      </View>

      {/* Description */}
      <FormLabel>Descripción</FormLabel>
      <TextInput
        value={form.descripcion}
        onChangeText={(v) => setForm(f => ({ ...f, descripcion: v }))}
        placeholder="Ej: Súper Coto"
        placeholderTextColor={PALETTE.muted}
        style={{
          backgroundColor: PALETTE.card, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
          ...FONTS.body, fontSize: 14, color: PALETTE.ink, marginBottom: 12,
          shadowColor: PALETTE.ink, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
        }}
      />

      {/* Category picker */}
      <FormLabel>Categoría</FormLabel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {CATEGORIES.map(c => {
          const active = form.categoria === c.id;
          return (
            <Pressable
              key={c.id}
              onPress={() => setForm(f => ({ ...f, categoria: c.id }))}
              style={{
                flex: 1, minWidth: '30%', paddingVertical: 10, paddingHorizontal: 6, borderRadius: 14,
                backgroundColor: active ? c.tint : PALETTE.card,
                borderWidth: active ? 1.5 : 0,
                borderColor: active ? c.color : 'transparent',
                alignItems: 'center', gap: 4,
                shadowColor: PALETTE.ink, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
              }}
            >
              <Text style={{ fontSize: 22 }}>{c.emoji}</Text>
              <Text style={{ fontSize: 11, fontWeight: '600', color: PALETTE.ink }}>{c.nombre}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={submit}
        disabled={!canSave}
        style={{
          height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
          backgroundColor: canSave ? PALETTE.ink : 'rgba(46,36,56,0.2)',
          marginBottom: 8,
        }}
      >
        <Text style={{ ...FONTS.display, fontWeight: '600', fontSize: 15, color: '#fff', letterSpacing: -0.2 }}>
          Guardar gasto
        </Text>
      </Pressable>
    </Sheet>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { FONTS, PALETTE } from '../constants/theme';
import { useData } from '../context/DataContext';
import Sheet from '../components/Sheet';
import { formatARS } from '../utils/format';

const PASTEL_COLORS = [
  '#B8E6C8', '#9DD6EE', '#FFD58A', '#C5B8E3',
  '#FFB8B8', '#F5A8C7', '#FFE5A3', '#A8D8F0',
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

export default function AddIncomeSheet() {
  const {
    showAddIncome, setShowAddIncome,
    editingIncome, setEditingIncome,
    allIncomeTipos, customIncomeTipos,
    addIncome, updateIncome, deleteIncome, addCustomIncomeTipo,
  } = useData();

  const [form, setForm] = useState({ tipo: 'Trabajo', monto: '', descripcion: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Inline form para nuevo tipo
  const [showInline, setShowInline] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [newEmoji, setNewEmoji] = useState('💰');
  const [newColor, setNewColor] = useState('#B8E6C8');
  const [creatingTipo, setCreatingTipo] = useState(false);
  const [createError, setCreateError] = useState(null);

  const isEditing = !!editingIncome;
  const prevCustomCountRef = useRef(customIncomeTipos.length);

  useEffect(() => {
    if (!showAddIncome) return;
    if (editingIncome) {
      setForm({ tipo: editingIncome.tipo, monto: String(editingIncome.monto), descripcion: editingIncome.descripcion });
    } else {
      setForm({ tipo: 'Trabajo', monto: '', descripcion: '' });
    }
    setError(null);
    setShowInline(false);
    prevCustomCountRef.current = customIncomeTipos.length;
  }, [showAddIncome, editingIncome]);

  // Auto-seleccionar el nuevo tipo al crearlo
  useEffect(() => {
    if (!showAddIncome) return;
    if (customIncomeTipos.length > prevCustomCountRef.current) {
      const newest = customIncomeTipos[customIncomeTipos.length - 1];
      setForm(f => ({ ...f, tipo: newest.id }));
    }
    prevCustomCountRef.current = customIncomeTipos.length;
  }, [customIncomeTipos.length]);

  const canSave = parseInt((form.monto || '').replace(/[^\d]/g, ''), 10) > 0;
  const displayMonto = form.monto
    ? formatARS(parseInt(form.monto.replace(/[^\d]/g, ''), 10) || 0).replace('$', '')
    : '';

  function handleClose() {
    setEditingIncome(null);
    setShowAddIncome(false);
    setShowInline(false);
  }

  async function submit() {
    const monto = parseInt((form.monto || '').replace(/[^\d]/g, ''), 10);
    if (!monto) return;
    setSaving(true);
    setError(null);
    try {
      if (isEditing) {
        await updateIncome(editingIncome.id, { tipo: form.tipo, monto, descripcion: form.descripcion || form.tipo });
      } else {
        await addIncome({ tipo: form.tipo, monto, descripcion: form.descripcion || form.tipo });
      }
      handleClose();
    } catch (e) {
      setError(e.message ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Eliminar ingreso',
      '¿Estás seguro que querés eliminar este ingreso?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            try { await deleteIncome(editingIncome.id); handleClose(); }
            catch (e) { setError(e.message ?? 'Error al eliminar'); }
          },
        },
      ],
    );
  }

  function openInline() {
    setNewNombre('');
    setNewEmoji('💰');
    setNewColor('#B8E6C8');
    setCreateError(null);
    setShowInline(true);
  }

  async function handleCreateTipo() {
    if (newNombre.trim().length < 2) return;
    setCreatingTipo(true);
    setCreateError(null);
    try {
      await addCustomIncomeTipo({ nombre: newNombre.trim(), emoji: newEmoji, color: newColor });
      setShowInline(false);
    } catch (e) {
      setCreateError(e.message ?? 'Error al crear');
    } finally {
      setCreatingTipo(false);
    }
  }

  return (
    <Sheet visible={showAddIncome} onClose={handleClose} title={isEditing ? 'Editar ingreso' : 'Cargar ingreso'}>
      <FormLabel>Fuente</FormLabel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        {allIncomeTipos.map(t => {
          const active = form.tipo === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => { setForm(s => ({ ...s, tipo: t.id })); setShowInline(false); }}
              style={{
                minWidth: '30%', flex: 1, paddingVertical: 10, paddingHorizontal: 6, borderRadius: 14,
                backgroundColor: active ? t.tint : PALETTE.card,
                borderWidth: active ? 1.5 : 0,
                borderColor: active ? t.color : 'transparent',
                alignItems: 'center', gap: 4,
                shadowColor: PALETTE.ink, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
              }}
            >
              <Text style={{ fontSize: 22 }}>{t.emoji}</Text>
              <Text style={{ fontSize: 11, fontWeight: '600', color: PALETTE.ink, textAlign: 'center' }}>{t.nombre}</Text>
            </Pressable>
          );
        })}

        {!showInline && (
          <Pressable
            onPress={openInline}
            style={{
              minWidth: '30%', flex: 1, paddingVertical: 10, paddingHorizontal: 6, borderRadius: 14,
              backgroundColor: 'transparent',
              borderWidth: 1.5, borderColor: 'rgba(46,36,56,0.15)', borderStyle: 'dashed',
              alignItems: 'center', gap: 4,
            }}
          >
            <Text style={{ fontSize: 22, color: PALETTE.muted }}>+</Text>
            <Text style={{ fontSize: 11, fontWeight: '600', color: PALETTE.muted }}>Nuevo</Text>
          </Pressable>
        )}
      </View>

      {/* Formulario inline — sin ningún Modal secundario */}
      {showInline && (
        <View style={{
          backgroundColor: PALETTE.card, borderRadius: 18, padding: 14, marginBottom: 14,
          shadowColor: PALETTE.ink, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            {/* Preview */}
            <View style={{
              width: 48, height: 48, borderRadius: 14,
              backgroundColor: newColor + '33', borderWidth: 1.5, borderColor: newColor,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 26 }}>{newEmoji}</Text>
            </View>
            <TextInput
              value={newNombre}
              onChangeText={setNewNombre}
              placeholder="Nombre del tipo…"
              placeholderTextColor={PALETTE.muted}
              maxLength={20}
              style={{
                flex: 1, backgroundColor: PALETTE.bg, borderRadius: 12,
                paddingHorizontal: 12, paddingVertical: 9,
                ...FONTS.body, fontSize: 14, color: PALETTE.ink,
              }}
            />
          </View>

          {/* Emoji presets */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {PRESET_EMOJIS.map(e => (
                <Pressable
                  key={e}
                  onPress={() => setNewEmoji(e)}
                  style={{
                    width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: newEmoji === e ? PALETTE.accent + '55' : PALETTE.bg,
                    borderWidth: newEmoji === e ? 1.5 : 0,
                    borderColor: newEmoji === e ? PALETTE.accent : 'transparent',
                  }}
                >
                  <Text style={{ fontSize: 20 }}>{e}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {/* Color swatches */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {PASTEL_COLORS.map(c => (
              <Pressable
                key={c}
                onPress={() => setNewColor(c)}
                style={{
                  width: 28, height: 28, borderRadius: 8, backgroundColor: c,
                  borderWidth: newColor === c ? 2.5 : 0,
                  borderColor: newColor === c ? PALETTE.ink : 'transparent',
                }}
              />
            ))}
          </View>

          {createError && (
            <Text style={{ color: '#B03030', fontSize: 11, marginBottom: 8 }}>{createError}</Text>
          )}

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              onPress={() => setShowInline(false)}
              style={{
                flex: 1, height: 40, borderRadius: 12,
                backgroundColor: 'rgba(46,36,56,0.07)',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: PALETTE.muted }}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={handleCreateTipo}
              disabled={newNombre.trim().length < 2 || creatingTipo}
              style={{
                flex: 2, height: 40, borderRadius: 12,
                backgroundColor: newNombre.trim().length >= 2 ? '#1F3A2C' : 'rgba(46,36,56,0.2)',
                alignItems: 'center', justifyContent: 'center',
                opacity: creatingTipo ? 0.6 : 1,
              }}
            >
              {creatingTipo
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Crear tipo</Text>
              }
            </Pressable>
          </View>
        </View>
      )}

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
          marginBottom: isEditing ? 10 : 8, opacity: saving ? 0.6 : 1,
        }}
      >
        {saving
          ? <ActivityIndicator color="#fff" />
          : <Text style={{ ...FONTS.display, fontWeight: '600', fontSize: 15, color: '#fff' }}>
              {isEditing ? 'Guardar cambios' : 'Guardar ingreso'}
            </Text>
        }
      </Pressable>

      {isEditing && (
        <Pressable
          onPress={confirmDelete}
          style={{
            height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(176,48,48,0.08)', marginBottom: 8,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#B03030' }}>Eliminar ingreso</Text>
        </Pressable>
      )}
    </Sheet>
  );
}

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { FONTS, PALETTE } from '../constants/theme';
import { useData } from '../context/DataContext';
import Sheet from '../components/Sheet';
import { formatARS } from '../utils/format';

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
  const {
    showAddExpense, setShowAddExpense,
    presetCategory, allCategories,
    editingExpense, setEditingExpense,
    addExpense, updateExpense, deleteExpense,
  } = useData();

  const defaultCatId = () => presetCategory || allCategories[0]?.id || 'comida';

  const [form, setForm] = useState({ categoria: defaultCatId(), monto: '', descripcion: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const isEditing = !!editingExpense;

  useEffect(() => {
    if (!showAddExpense) return;
    if (editingExpense) {
      setForm({
        categoria: editingExpense.categoria,
        monto: String(editingExpense.monto),
        descripcion: editingExpense.descripcion,
      });
    } else {
      setForm({ categoria: presetCategory || allCategories[0]?.id || 'comida', monto: '', descripcion: '' });
    }
    setSaveError(null);
  }, [showAddExpense, editingExpense]);

  const displayMonto = form.monto
    ? formatARS(parseInt(form.monto.replace(/[^\d]/g, ''), 10) || 0).replace('$', '')
    : '';

  const canSave = parseInt((form.monto || '').replace(/[^\d]/g, ''), 10) > 0;

  function handleClose() {
    setEditingExpense(null);
    setShowAddExpense(false);
  }

  async function submit() {
    const monto = parseInt((form.monto || '').replace(/[^\d]/g, ''), 10);
    if (!monto || monto <= 0) return;
    setSaving(true);
    setSaveError(null);
    try {
      if (isEditing) {
        await updateExpense(editingExpense.id, {
          categoria: form.categoria,
          monto,
          descripcion: form.descripcion || 'Gasto',
        });
      } else {
        await addExpense({ categoria: form.categoria, monto, descripcion: form.descripcion || 'Gasto' });
      }
      handleClose();
    } catch (e) {
      setSaveError(e.message ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Eliminar gasto',
      '¿Estás seguro que querés eliminar este gasto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            try {
              await deleteExpense(editingExpense.id);
              handleClose();
            } catch (e) {
              setSaveError(e.message ?? 'Error al eliminar');
            }
          },
        },
      ],
    );
  }

  const showCategoryPicker = !presetCategory || isEditing;

  return (
    <Sheet
      visible={showAddExpense}
      onClose={handleClose}
      title={isEditing ? 'Editar gasto' : 'Agregar gasto'}
    >
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
          autoFocus={!isEditing}
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

      {/* Category picker — hidden when coming from a category (add mode only) */}
      {showCategoryPicker && (
        <>
          <FormLabel>Categoría</FormLabel>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {allCategories.map(c => {
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
        </>
      )}

      {saveError && (
        <Text style={{ color: '#B03030', fontSize: 12, textAlign: 'center', marginBottom: 8 }}>{saveError}</Text>
      )}

      <Pressable
        onPress={submit}
        disabled={!canSave || saving}
        style={{
          height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
          backgroundColor: canSave ? PALETTE.ink : 'rgba(46,36,56,0.2)',
          marginBottom: isEditing ? 10 : 8, opacity: saving ? 0.6 : 1,
        }}
      >
        {saving
          ? <ActivityIndicator color="#fff" />
          : <Text style={{ ...FONTS.display, fontWeight: '600', fontSize: 15, color: '#fff', letterSpacing: -0.2 }}>
              {isEditing ? 'Guardar cambios' : 'Guardar gasto'}
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
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#B03030' }}>Eliminar gasto</Text>
        </Pressable>
      )}
    </Sheet>
  );
}

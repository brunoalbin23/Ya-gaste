import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, ActivityIndicator,
  ScrollView, Image, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { FONTS, PALETTE } from '../constants/theme';
import { useData } from '../context/DataContext';
import { analyzeText, analyzeImage } from '../services/aiService';
import Sheet from '../components/Sheet';
import { formatARS } from '../utils/format';

// ─── helpers ──────────────────────────────────────────────────────────────────

function confidenceColor(c) {
  if (c >= 0.8) return '#2A6E47';
  if (c >= 0.5) return '#E6982A';
  return '#B03030';
}

function FormLabel({ children }) {
  return (
    <Text style={{
      fontSize: 11, fontWeight: '700', color: PALETTE.muted,
      letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6, marginLeft: 2,
    }}>
      {children}
    </Text>
  );
}

// ─── Editable expense card ─────────────────────────────────────────────────────

function ExpenseCard({ item, allCategories, openDropdownId, setOpenDropdownId, onChange, onDelete }) {
  const cat = allCategories.find(c => c.id === item.categoria) ?? allCategories[0];
  const isOpen = openDropdownId === item.id;
  const displayMonto = item.monto > 0
    ? formatARS(item.monto).replace('$', '')
    : '';

  return (
    <View style={{
      backgroundColor: PALETTE.card, borderRadius: 18, padding: 14, marginBottom: 10,
      shadowColor: PALETTE.ink, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    }}>
      {/* Header row: category picker + confidence + delete */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 }}>
        <Pressable
          onPress={() => setOpenDropdownId(isOpen ? null : item.id)}
          style={{
            flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
            backgroundColor: cat.tint ?? cat.color + '33',
            borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7,
          }}
        >
          <Text style={{ fontSize: 18 }}>{cat.emoji}</Text>
          <Text style={{ fontSize: 13, fontWeight: '600', color: PALETTE.ink, flex: 1 }}>{cat.nombre}</Text>
          <Text style={{ fontSize: 11, color: PALETTE.muted }}>{isOpen ? '▲' : '▼'}</Text>
        </Pressable>

        {/* Confidence dot */}
        <View style={{
          width: 10, height: 10, borderRadius: 5,
          backgroundColor: confidenceColor(item.confianza),
        }} />

        {/* Delete */}
        <Pressable
          onPress={onDelete}
          style={{
            width: 30, height: 30, borderRadius: 9, backgroundColor: 'rgba(176,48,48,0.09)',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 16, color: '#B03030', lineHeight: 18 }}>✕</Text>
        </Pressable>
      </View>

      {/* Inline category dropdown */}
      {isOpen && (
        <ScrollView
          style={{ maxHeight: 160, marginBottom: 10 }}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          {allCategories.map(c => (
            <Pressable
              key={c.id}
              onPress={() => { onChange({ categoria: c.id }); setOpenDropdownId(null); }}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                paddingVertical: 7, paddingHorizontal: 4,
                backgroundColor: c.id === item.categoria ? c.tint ?? c.color + '33' : 'transparent',
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 18 }}>{c.emoji}</Text>
              <Text style={{ fontSize: 13, fontWeight: c.id === item.categoria ? '700' : '400', color: PALETTE.ink }}>
                {c.nombre}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Description */}
      <TextInput
        value={item.descripcion}
        onChangeText={v => onChange({ descripcion: v })}
        placeholder="Descripción…"
        placeholderTextColor={PALETTE.muted}
        maxLength={40}
        style={{
          backgroundColor: PALETTE.bg, borderRadius: 10,
          paddingHorizontal: 10, paddingVertical: 8,
          ...FONTS.body, fontSize: 13, color: PALETTE.ink, marginBottom: 8,
        }}
      />

      {/* Amount */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: PALETTE.bg, borderRadius: 10,
        paddingHorizontal: 10, paddingVertical: 8,
      }}>
        <Text style={{ ...FONTS.display, fontSize: 22, color: '#B03030' }}>-$</Text>
        <TextInput
          keyboardType="numeric"
          value={displayMonto}
          onChangeText={v => onChange({ monto: parseInt(v.replace(/[^\d]/g, ''), 10) || 0 })}
          placeholder="0"
          placeholderTextColor={PALETTE.muted}
          style={{ flex: 1, ...FONTS.display, fontSize: 22, color: PALETTE.ink }}
        />
      </View>
    </View>
  );
}

// ─── Main sheet ────────────────────────────────────────────────────────────────

export default function AIExpenseSheet() {
  const { showAISheet, setShowAISheet, allCategories, addExpenses } = useData();

  const [tab, setTab] = useState('text'); // 'text' | 'photo' | 'manual'
  const [inputText, setInputText] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [imageMediaType, setImageMediaType] = useState('image/jpeg');

  const [phase, setPhase] = useState('input'); // 'input' | 'analyzing' | 'preview'
  const [detected, setDetected] = useState([]);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Manual tab state
  const [manualCategoria, setManualCategoria] = useState(null);
  const [manualMonto, setManualMonto] = useState('');
  const [manualDescripcion, setManualDescripcion] = useState('');

  const canAnalyzeText = inputText.trim().length > 3;
  const canAnalyzePhoto = !!imageBase64;
  const canSaveManual = parseInt((manualMonto || '').replace(/[^\d]/g, ''), 10) > 0;

  function handleClose() {
    setShowAISheet(false);
    setTab('text');
    setInputText('');
    setImageUri(null);
    setImageBase64(null);
    setPhase('input');
    setDetected([]);
    setOpenDropdownId(null);
    setSaving(false);
    setManualCategoria(null);
    setManualMonto('');
    setManualDescripcion('');
  }

  async function handleManualSave() {
    const monto = parseInt((manualMonto || '').replace(/[^\d]/g, ''), 10);
    if (!monto) return;
    const catId = manualCategoria ?? allCategories[0]?.id;
    const cat = allCategories.find(c => c.id === catId);
    setSaving(true);
    try {
      await addExpenses([{
        categoria: catId,
        monto,
        descripcion: manualDescripcion.trim() || cat?.nombre || 'Gasto',
      }]);
      handleClose();
    } catch (e) {
      Alert.alert('Error al guardar', e.message ?? 'No se pudo guardar el gasto.');
    } finally {
      setSaving(false);
    }
  }

  async function pickImage(fromCamera) {
    try {
      let result;
      if (fromCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permiso necesario', 'Necesitamos acceso a la cámara para sacar fotos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: 'images',
          quality: 0.6,
          base64: true,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permiso necesario', 'Necesitamos acceso a la galería para seleccionar fotos.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'images',
          quality: 0.6,
          base64: true,
        });
      }

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setImageUri(asset.uri);
        setImageBase64(asset.base64);
        const ext = (asset.uri.split('.').pop() ?? 'jpg').toLowerCase();
        setImageMediaType(ext === 'png' ? 'image/png' : 'image/jpeg');
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo acceder a la cámara/galería.');
    }
  }

  async function handleAnalyze() {
    setPhase('analyzing');
    try {
      let results;
      if (tab === 'text') {
        results = await analyzeText(inputText.trim(), allCategories);
      } else {
        results = await analyzeImage(imageBase64, imageMediaType, allCategories);
      }

      if (results.length === 0) {
        setPhase('input');
        Alert.alert('Sin resultados', 'No detecté ningún gasto. Intentá con una descripción más detallada.');
        return;
      }

      // Validate detected categories — fallback to first category if unknown
      const validIds = new Set(allCategories.map(c => c.id));
      const validated = results.map(r => ({
        ...r,
        categoria: validIds.has(r.categoria) ? r.categoria : allCategories[0]?.id ?? r.categoria,
      }));

      setDetected(validated);
      setPhase('preview');
    } catch (e) {
      setPhase('input');
      Alert.alert('Error de IA', e.message ?? 'No se pudo analizar. Intentá de nuevo.');
    }
  }

  const updateItem = useCallback((id, patch) => {
    setDetected(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d));
  }, []);

  const deleteItem = useCallback((id) => {
    setDetected(prev => {
      const next = prev.filter(d => d.id !== id);
      if (next.length === 0) setPhase('input');
      return next;
    });
  }, []);

  async function handleSave() {
    const valid = detected.filter(d => d.monto > 0);
    if (valid.length === 0) return;
    setSaving(true);
    try {
      await addExpenses(valid.map(d => ({
        categoria: d.categoria,
        monto: d.monto,
        descripcion: d.descripcion || d.categoria,
      })));
      handleClose();
    } catch (e) {
      Alert.alert('Error al guardar', e.message ?? 'No se pudieron guardar los gastos.');
    } finally {
      setSaving(false);
    }
  }

  const totalDetected = detected.reduce((s, d) => s + d.monto, 0);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Sheet
      visible={showAISheet}
      onClose={handleClose}
      title={phase === 'preview' ? 'Revisar gastos' : '¿Cuánto gastaste?'}
    >
      {/* ── Analyzing phase ──────────────────────────────────────── */}
      {phase === 'analyzing' && (
        <View style={{ alignItems: 'center', paddingVertical: 40, gap: 14 }}>
          <ActivityIndicator size="large" color={PALETTE.accent} />
          <Text style={{ fontSize: 15, color: PALETTE.ink, fontWeight: '600' }}>Analizando con IA…</Text>
          <Text style={{ fontSize: 12, color: PALETTE.muted }}>Esto puede tardar unos segundos</Text>
        </View>
      )}

      {/* ── Input phase ──────────────────────────────────────────── */}
      {phase === 'input' && (
        <>
          {/* Tabs */}
          <View style={{
            flexDirection: 'row', backgroundColor: PALETTE.card,
            borderRadius: 14, padding: 3, marginBottom: 16,
            shadowColor: PALETTE.ink, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
          }}>
            {[
              { key: 'text', label: '✏️  Texto' },
              { key: 'photo', label: '📷  Foto' },
              { key: 'manual', label: '✍️  Manual' },
            ].map(t => (
              <Pressable
                key={t.key}
                onPress={() => setTab(t.key)}
                style={{
                  flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: 'center',
                  backgroundColor: tab === t.key ? PALETTE.bg : 'transparent',
                  shadowColor: tab === t.key ? PALETTE.ink : 'transparent',
                  shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 3, elevation: tab === t.key ? 1 : 0,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: tab === t.key ? '700' : '500', color: tab === t.key ? PALETTE.ink : PALETTE.muted }}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Text tab */}
          {tab === 'text' && (
            <>
              <View style={{
                backgroundColor: PALETTE.card, borderRadius: 18,
                padding: 4, marginBottom: 12,
                shadowColor: PALETTE.ink, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
              }}>
                <TextInput
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Ej: gasté $2500 en supermercado y $800 en nafta..."
                  placeholderTextColor={PALETTE.muted}
                  multiline
                  textAlignVertical="top"
                  style={{
                    paddingHorizontal: 14, paddingTop: 14, paddingBottom: 14,
                    ...FONTS.body, fontSize: 15, color: PALETTE.ink,
                    minHeight: 100,
                  }}
                />
              </View>

              <Pressable
                onPress={handleAnalyze}
                disabled={!canAnalyzeText}
                style={{
                  height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
                  flexDirection: 'row', gap: 8,
                  backgroundColor: canAnalyzeText ? PALETTE.accent : 'rgba(46,36,56,0.12)',
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontSize: 16 }}>✦</Text>
                <Text style={{ ...FONTS.display, fontSize: 15, fontWeight: '700', color: canAnalyzeText ? PALETTE.ink : PALETTE.muted }}>
                  Analizar con IA
                </Text>
              </Pressable>
            </>
          )}

          {/* Photo tab */}
          {tab === 'photo' && (
            <>
              {/* Image preview */}
              {imageUri ? (
                <View style={{ marginBottom: 12, borderRadius: 18, overflow: 'hidden', position: 'relative' }}>
                  <Image
                    source={{ uri: imageUri }}
                    style={{ width: '100%', height: 200, borderRadius: 18 }}
                    resizeMode="cover"
                  />
                  <Pressable
                    onPress={() => { setImageUri(null); setImageBase64(null); }}
                    style={{
                      position: 'absolute', top: 8, right: 8,
                      width: 30, height: 30, borderRadius: 15,
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 14, lineHeight: 16 }}>✕</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                  <Pressable
                    onPress={() => pickImage(true)}
                    style={({ pressed }) => ({
                      flex: 1, height: 90, borderRadius: 16,
                      backgroundColor: pressed ? 'rgba(46,36,56,0.07)' : PALETTE.card,
                      borderWidth: 1.5, borderColor: 'rgba(46,36,56,0.1)', borderStyle: 'dashed',
                      alignItems: 'center', justifyContent: 'center', gap: 4,
                      shadowColor: PALETTE.ink, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
                    })}
                  >
                    <Text style={{ fontSize: 28 }}>📷</Text>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: PALETTE.muted }}>Cámara</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => pickImage(false)}
                    style={({ pressed }) => ({
                      flex: 1, height: 90, borderRadius: 16,
                      backgroundColor: pressed ? 'rgba(46,36,56,0.07)' : PALETTE.card,
                      borderWidth: 1.5, borderColor: 'rgba(46,36,56,0.1)', borderStyle: 'dashed',
                      alignItems: 'center', justifyContent: 'center', gap: 4,
                      shadowColor: PALETTE.ink, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
                    })}
                  >
                    <Text style={{ fontSize: 28 }}>🖼️</Text>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: PALETTE.muted }}>Galería</Text>
                  </Pressable>
                </View>
              )}

              <Pressable
                onPress={handleAnalyze}
                disabled={!canAnalyzePhoto}
                style={{
                  height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
                  flexDirection: 'row', gap: 8,
                  backgroundColor: canAnalyzePhoto ? PALETTE.accent : 'rgba(46,36,56,0.12)',
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontSize: 16 }}>✦</Text>
                <Text style={{ ...FONTS.display, fontSize: 15, fontWeight: '700', color: canAnalyzePhoto ? PALETTE.ink : PALETTE.muted }}>
                  {imageUri ? 'Analizar foto' : 'Seleccioná una imagen'}
                </Text>
              </Pressable>
            </>
          )}

          {/* Manual tab */}
          {tab === 'manual' && (
            <>
              <Text style={{ fontSize: 11, fontWeight: '700', color: PALETTE.muted, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6, marginLeft: 2 }}>
                Categoría
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {allCategories.map(c => {
                  const active = (manualCategoria ?? allCategories[0]?.id) === c.id;
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => setManualCategoria(c.id)}
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
                      <Text style={{ fontSize: 11, fontWeight: '600', color: PALETTE.ink, textAlign: 'center' }}>{c.nombre}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={{ fontSize: 11, fontWeight: '700', color: PALETTE.muted, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6, marginLeft: 2 }}>
                Monto
              </Text>
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 4,
                backgroundColor: PALETTE.card, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12,
                shadowColor: PALETTE.ink, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
              }}>
                <Text style={{ ...FONTS.display, fontSize: 28, color: PALETTE.muted }}>$</Text>
                <TextInput
                  keyboardType="numeric"
                  value={manualMonto ? formatARS(parseInt(manualMonto.replace(/[^\d]/g, ''), 10) || 0).replace('$', '') : ''}
                  onChangeText={v => setManualMonto(v.replace(/[^\d]/g, ''))}
                  placeholder="0"
                  placeholderTextColor={PALETTE.muted}
                  style={{ flex: 1, ...FONTS.display, fontSize: 28, color: PALETTE.ink }}
                />
              </View>

              <Text style={{ fontSize: 11, fontWeight: '700', color: PALETTE.muted, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6, marginLeft: 2 }}>
                Descripción
              </Text>
              <TextInput
                value={manualDescripcion}
                onChangeText={setManualDescripcion}
                placeholder="Ej: Súper Coto"
                placeholderTextColor={PALETTE.muted}
                style={{
                  backgroundColor: PALETTE.card, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
                  ...FONTS.body, fontSize: 14, color: PALETTE.ink, marginBottom: 16,
                  shadowColor: PALETTE.ink, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
                }}
              />

              <Pressable
                onPress={handleManualSave}
                disabled={!canSaveManual || saving}
                style={{
                  height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: canSaveManual ? PALETTE.ink : 'rgba(46,36,56,0.2)',
                  marginBottom: 8, opacity: saving ? 0.6 : 1,
                }}
              >
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={{ ...FONTS.display, fontSize: 15, fontWeight: '700', color: '#fff' }}>Guardar gasto</Text>
                }
              </Pressable>
            </>
          )}

          {/* Footer hint — only for AI tabs */}
          {tab !== 'manual' && (
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            backgroundColor: '#ECE6F6', borderRadius: 12, padding: 10, marginBottom: 8,
          }}>
            <Text style={{ fontSize: 13 }}>✨</Text>
            <Text style={{ fontSize: 12, color: PALETTE.muted, flex: 1 }}>
              La IA detecta y clasifica tus gastos automáticamente
            </Text>
          </View>
          )}
        </>
      )}

      {/* ── Preview phase ─────────────────────────────────────────── */}
      {phase === 'preview' && (
        <>
          {/* Summary bar */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            backgroundColor: PALETTE.card, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
            marginBottom: 12,
            shadowColor: PALETTE.ink, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
          }}>
            <Text style={{ fontSize: 13, color: PALETTE.muted }}>
              {detected.length} {detected.length === 1 ? 'gasto detectado' : 'gastos detectados'}
            </Text>
            <Text style={{ ...FONTS.display, fontSize: 15, fontWeight: '700', color: '#B03030' }}>
              -{formatARS(totalDetected)}
            </Text>
          </View>

          {/* Confidence legend */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12, paddingHorizontal: 2 }}>
            {[
              { color: '#2A6E47', label: 'Alta certeza' },
              { color: '#E6982A', label: 'Media' },
              { color: '#B03030', label: 'Baja certeza' },
            ].map(({ color, label }) => (
              <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
                <Text style={{ fontSize: 10, color: PALETTE.muted }}>{label}</Text>
              </View>
            ))}
          </View>

          {/* Editable cards */}
          {detected.map(item => (
            <ExpenseCard
              key={item.id}
              item={item}
              allCategories={allCategories}
              openDropdownId={openDropdownId}
              setOpenDropdownId={setOpenDropdownId}
              onChange={patch => updateItem(item.id, patch)}
              onDelete={() => deleteItem(item.id)}
            />
          ))}

          {/* Save button */}
          <Pressable
            onPress={handleSave}
            disabled={saving || detected.every(d => d.monto === 0)}
            style={{
              height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
              backgroundColor: '#1F3A2C', marginTop: 4, marginBottom: 10,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ ...FONTS.display, fontSize: 15, fontWeight: '700', color: '#fff' }}>
                  Guardar {detected.length === 1 ? 'gasto' : `${detected.length} gastos`}
                </Text>
            }
          </Pressable>

          {/* Back to edit */}
          <Pressable
            onPress={() => { setPhase('input'); setDetected([]); setOpenDropdownId(null); }}
            style={{ alignItems: 'center', paddingVertical: 8, marginBottom: 4 }}
          >
            <Text style={{ fontSize: 13, color: PALETTE.muted, fontWeight: '600' }}>
              ← Volver a editar
            </Text>
          </Pressable>
        </>
      )}
    </Sheet>
  );
}

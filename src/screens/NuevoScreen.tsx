import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, ActivityIndicator,
  ScrollView, Alert, Image, Animated,
} from 'react-native';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS, PALETTE } from '../constants/theme';
import { useData } from '../context/DataContext';
import { analyzeText, analyzeImage, transcribeAudio } from '../services/aiService';
import { formatARS } from '../utils/format';
import type { AllCategory, DetectedGasto } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'manual' | 'photo' | 'text' | 'dictar';
type Phase = 'input' | 'analyzing' | 'preview';
type DictarPhase = 'idle' | 'recording' | 'transcribing' | 'review';

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string; emoji: string }[] = [
  { key: 'manual', label: 'Manual', emoji: '✍️' },
  { key: 'photo',  label: 'Foto',   emoji: '📷' },
  { key: 'text',   label: 'Texto',  emoji: '✏️' },
  { key: 'dictar', label: 'Dictar', emoji: '🎙️' },
];

const TAB_DESCRIPTIONS: Partial<Record<Tab, string>> = {
  photo:
    '📸 Sacá una foto o subí una imagen de tu ticket, factura o lista de compras. La IA lee los precios y conceptos automáticamente y crea cada gasto en la categoría correcta.',
  text:
    '✏️ Escribí tus gastos como le contarías a un amigo. Por ejemplo: "Pagué $1400 de inglés, $2000 de peluquería y $300 en el almacén". La IA interpreta todo y separa cada gasto automáticamente.',
  dictar:
    '🎙️ Grabá un audio contando tus gastos en voz alta como le contarías a un amigo. Por ejemplo: "Hoy gasté 1000 pesos en nafta y 200 en un café". La IA  transcribe tu voz y clasifica cada gasto en su categoría.',
};

const MAX_RECORDING_SECONDS = 60;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(s: number): string {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function confidenceColor(c: number): string {
  if (c >= 0.8) return '#2A6E47';
  if (c >= 0.5) return '#E6982A';
  return '#B03030';
}

// ─── ExpenseCard ──────────────────────────────────────────────────────────────

interface CardProps {
  item: DetectedGasto;
  allCategories: AllCategory[];
  openDropdownId: string | null;
  setOpenDropdownId: (id: string | null) => void;
  onChange: (patch: Partial<DetectedGasto>) => void;
  onDelete: () => void;
}

function ExpenseCard({ item, allCategories, openDropdownId, setOpenDropdownId, onChange, onDelete }: CardProps) {
  const cat = allCategories.find(c => c.id === item.categoria) ?? allCategories[0];
  const isOpen = openDropdownId === item.id;
  const displayMonto = item.monto > 0 ? formatARS(item.monto).replace('$', '') : '';

  return (
    <View style={{
      backgroundColor: PALETTE.card, borderRadius: 18, padding: 14, marginBottom: 10,
      shadowColor: PALETTE.ink, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 }}>
        <Pressable
          onPress={() => setOpenDropdownId(isOpen ? null : item.id)}
          style={{
            flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
            backgroundColor: cat?.tint ?? (cat?.color ?? '#ccc') + '33',
            borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7,
          }}
        >
          <Text style={{ fontSize: 18 }}>{cat?.emoji}</Text>
          <Text style={{ fontSize: 13, fontWeight: '600', color: PALETTE.ink, flex: 1 }}>{cat?.nombre}</Text>
          <Text style={{ fontSize: 11, color: PALETTE.muted }}>{isOpen ? '▲' : '▼'}</Text>
        </Pressable>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: confidenceColor(item.confianza) }} />
        <Pressable
          onPress={onDelete}
          style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: 'rgba(176,48,48,0.09)', alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontSize: 16, color: '#B03030', lineHeight: 18 }}>✕</Text>
        </Pressable>
      </View>

      {isOpen && (
        <ScrollView style={{ maxHeight: 150, marginBottom: 10 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
          {allCategories.map(c => (
            <Pressable
              key={c.id}
              onPress={() => { onChange({ categoria: c.id }); setOpenDropdownId(null); }}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7, paddingHorizontal: 4,
                backgroundColor: c.id === item.categoria ? (c.tint ?? c.color + '33') : 'transparent', borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 18 }}>{c.emoji}</Text>
              <Text style={{ fontSize: 13, fontWeight: c.id === item.categoria ? '700' : '400', color: PALETTE.ink }}>{c.nombre}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <TextInput
        value={item.descripcion}
        onChangeText={v => onChange({ descripcion: v })}
        placeholder="Descripción…"
        placeholderTextColor={PALETTE.muted}
        maxLength={40}
        style={{
          backgroundColor: PALETTE.bg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8,
          ...FONTS.body, fontSize: 13, color: PALETTE.ink, marginBottom: 8,
        }}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: PALETTE.bg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 }}>
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

// ─── NuevoScreen ──────────────────────────────────────────────────────────────

export default function NuevoScreen({ navigation }: { navigation: any }) {
  const insets = useSafeAreaInsets();
  const { allCategories, addExpenses } = useData();

  // Main flow
  const [tab, setTab] = useState<Tab>('manual');
  const [phase, setPhase] = useState<Phase>('input');
  const [detected, setDetected] = useState<DetectedGasto[]>([]);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Text tab
  const [inputText, setInputText] = useState('');

  // Photo tab
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMediaType, setImageMediaType] = useState<string>('image/jpeg');

  // Manual tab
  const [manualCategoria, setManualCategoria] = useState<string | null>(null);
  const [manualMonto, setManualMonto] = useState('');
  const [manualDescripcion, setManualDescripcion] = useState('');

  // Dictar tab
  const [dictarPhase, setDictarPhase] = useState<DictarPhase>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcribedText, setTranscribedText] = useState('');
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const descFadeAnim = useRef(new Animated.Value(1)).current;
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // ── Recording pulse animation ─────────────────────────────────────────────

  useEffect(() => {
    if (dictarPhase === 'recording') {
      pulseLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.14, duration: 550, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 550, useNativeDriver: true }),
        ])
      );
      pulseLoopRef.current.start();
    } else {
      pulseLoopRef.current?.stop();
      pulseAnim.setValue(1);
    }
  }, [dictarPhase]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoStopRef.current) clearTimeout(autoStopRef.current);
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
    };
  }, []);

  // ── Tab switch with fade animation ────────────────────────────────────────

  function switchTab(newTab: Tab) {
    if (dictarPhase === 'recording') discardRecording();
    Animated.timing(descFadeAnim, { toValue: 0, duration: 80, useNativeDriver: true }).start(() => {
      setTab(newTab);
      Animated.timing(descFadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  }

  // ── Recording ─────────────────────────────────────────────────────────────

  async function discardRecording() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (autoStopRef.current) { clearTimeout(autoStopRef.current); autoStopRef.current = null; }
    if (recordingRef.current) {
      try { await recordingRef.current.stopAndUnloadAsync(); } catch {}
      recordingRef.current = null;
    }
    setDictarPhase('idle');
    setRecordingTime(0);
  }

  async function doStopAndTranscribe(rec: Audio.Recording) {
    setDictarPhase('transcribing');
    try {
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      recordingRef.current = null;

      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      if (!uri) {
        setTranscribedText('');
        setDictarPhase('review');
        return;
      }
      const text = await transcribeAudio(uri);
      setTranscribedText(text);
      setDictarPhase('review');
    } catch (e: any) {
      setDictarPhase('idle');
      Alert.alert('Error de transcripción', e.message ?? 'No se pudo transcribir el audio. Intentá de nuevo.');
    }
  }

  async function startRecording() {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Necesitamos acceso al micrófono para grabar audio.');
      return;
    }

    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );

    recordingRef.current = recording;
    setDictarPhase('recording');
    setRecordingTime(0);

    let elapsed = 0;
    timerRef.current = setInterval(() => {
      elapsed += 1;
      setRecordingTime(elapsed);
    }, 1000);

    autoStopRef.current = setTimeout(async () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      if (recordingRef.current) await doStopAndTranscribe(recordingRef.current);
    }, MAX_RECORDING_SECONDS * 1000);
  }

  async function stopRecording() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (autoStopRef.current) { clearTimeout(autoStopRef.current); autoStopRef.current = null; }
    if (recordingRef.current) await doStopAndTranscribe(recordingRef.current);
  }

  // ── Analyze helpers ───────────────────────────────────────────────────────

  function applyResults(results: DetectedGasto[]) {
    if (results.length === 0) {
      setPhase('input');
      Alert.alert('Sin resultados', 'No detecté ningún gasto. Intentá con más detalle.');
      return;
    }
    const validIds = new Set(allCategories.map(c => c.id));
    setDetected(results.map(r => ({
      ...r,
      categoria: validIds.has(r.categoria) ? r.categoria : (allCategories[0]?.id ?? r.categoria),
    })));
    setPhase('preview');
  }

  async function handleAnalyzeText() {
    setPhase('analyzing');
    try {
      applyResults(await analyzeText(inputText.trim(), allCategories));
    } catch (e: any) {
      setPhase('input');
      Alert.alert('Error de IA', e.message ?? 'No se pudo analizar. Intentá de nuevo.');
    }
  }

  async function handleAnalyzePhoto() {
    if (!imageBase64) return;
    setPhase('analyzing');
    try {
      applyResults(await analyzeImage(imageBase64, imageMediaType, allCategories));
    } catch (e: any) {
      setPhase('input');
      Alert.alert('Error de IA', e.message ?? 'No se pudo analizar. Intentá de nuevo.');
    }
  }

  async function handleAnalyzeDictar() {
    if (!transcribedText.trim()) {
      Alert.alert('Texto vacío', 'Escribí o dictá algo antes de analizar.');
      return;
    }
    setPhase('analyzing');
    try {
      applyResults(await analyzeText(transcribedText.trim(), allCategories));
    } catch (e: any) {
      setPhase('input');
      Alert.alert('Error de IA', e.message ?? 'No se pudo analizar. Intentá de nuevo.');
    }
  }

  // ── Save helpers ──────────────────────────────────────────────────────────

  function reset() {
    setTab('manual');
    setPhase('input');
    setDetected([]);
    setOpenDropdownId(null);
    setSaving(false);
    setInputText('');
    setImageUri(null); setImageBase64(null);
    setManualCategoria(null); setManualMonto(''); setManualDescripcion('');
    setDictarPhase('idle'); setRecordingTime(0); setTranscribedText('');
  }

  async function handleManualSave() {
    const monto = parseInt(manualMonto.replace(/[^\d]/g, ''), 10);
    if (!monto) return;
    const catId = manualCategoria ?? allCategories[0]?.id;
    const cat = allCategories.find(c => c.id === catId);
    setSaving(true);
    try {
      await addExpenses([{ categoria: catId!, monto, descripcion: manualDescripcion.trim() || cat?.nombre || 'Gasto' }]);
      reset();
      navigation.navigate('Inicio');
    } catch (e: any) {
      Alert.alert('Error al guardar', e.message ?? 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    const valid = detected.filter(d => d.monto > 0);
    if (!valid.length) return;
    setSaving(true);
    try {
      await addExpenses(valid.map(d => ({ categoria: d.categoria, monto: d.monto, descripcion: d.descripcion || d.categoria })));
      reset();
      navigation.navigate('Inicio');
    } catch (e: any) {
      Alert.alert('Error al guardar', e.message ?? 'No se pudieron guardar los gastos.');
    } finally {
      setSaving(false);
    }
  }

  // ── Photo picker ──────────────────────────────────────────────────────────

  async function pickImage(fromCamera: boolean) {
    try {
      let result: ImagePicker.ImagePickerResult;
      if (fromCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permiso necesario', 'Necesitamos acceso a la cámara.'); return; }
        result = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.6, base64: true });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permiso necesario', 'Necesitamos acceso a la galería.'); return; }
        result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.6, base64: true });
      }
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setImageUri(asset.uri);
        setImageBase64(asset.base64 ?? null);
        const ext = (asset.uri.split('.').pop() ?? 'jpg').toLowerCase();
        setImageMediaType(ext === 'png' ? 'image/png' : 'image/jpeg');
      }
    } catch {
      Alert.alert('Error', 'No se pudo acceder a la cámara/galería.');
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const canAnalyzeText = inputText.trim().length > 3;
  const canAnalyzePhoto = !!imageBase64;
  const canSaveManual = parseInt(manualMonto.replace(/[^\d]/g, ''), 10) > 0;
  const totalDetected = detected.reduce((s, d) => s + d.monto, 0);
  const updateItem = useCallback((id: string, patch: Partial<DetectedGasto>) => {
    setDetected(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d));
  }, []);
  const deleteItem = useCallback((id: string) => {
    setDetected(prev => { const next = prev.filter(d => d.id !== id); if (!next.length) setPhase('input'); return next; });
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: PALETTE.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingHorizontal: 18, paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: PALETTE.ink, letterSpacing: -0.8 }}>
          {phase === 'preview' ? 'Revisar gastos' : '¿Cuánto gastaste?'}
        </Text>
        {phase === 'preview' && (
          <Pressable onPress={() => { setPhase('input'); setDetected([]); }} style={{ marginTop: 4 }}>
            <Text style={{ fontSize: 13, color: PALETTE.muted, fontWeight: '600' }}>← Volver a editar</Text>
          </Pressable>
        )}
      </View>

      {/* ── Analyzing ───────────────────────────────────────────────────── */}
      {phase === 'analyzing' && (
        <View style={{ alignItems: 'center', paddingVertical: 60, gap: 14 }}>
          <ActivityIndicator size="large" color={PALETTE.accent} />
          <Text style={{ fontSize: 15, color: PALETTE.ink, fontWeight: '600' }}>Analizando con IA…</Text>
          <Text style={{ fontSize: 12, color: PALETTE.muted }}>Esto puede tardar unos segundos</Text>
        </View>
      )}

      {/* ── Input ───────────────────────────────────────────────────────── */}
      {phase === 'input' && (
        <>
          {/* Tab selector */}
          <View style={{
            flexDirection: 'row', backgroundColor: PALETTE.card,
            borderRadius: 14, padding: 3, marginBottom: 16,
            shadowColor: PALETTE.ink, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
          }}>
            {TABS.map(t => (
              <Pressable
                key={t.key}
                onPress={() => switchTab(t.key)}
                style={{
                  flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: 'center', gap: 1,
                  backgroundColor: tab === t.key ? PALETTE.bg : 'transparent',
                  shadowColor: tab === t.key ? PALETTE.ink : 'transparent',
                  shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 3, elevation: tab === t.key ? 1 : 0,
                }}
              >
                <Text style={{ fontSize: 14 }}>{t.emoji}</Text>
                <Text style={{ fontSize: 10, fontWeight: tab === t.key ? '700' : '500', color: tab === t.key ? PALETTE.ink : PALETTE.muted }}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* ── MANUAL ────────────────────────────────────────────────── */}
          {tab === 'manual' && (
            <>
              <Text style={{ fontSize: 11, fontWeight: '700', color: PALETTE.muted, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 }}>
                Categoría
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {allCategories.map(c => {
                  const active = (manualCategoria ?? allCategories[0]?.id) === c.id;
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => setManualCategoria(c.id)}
                      style={{
                        minWidth: '30%', flex: 1, paddingVertical: 12, borderRadius: 14,
                        backgroundColor: active ? c.tint : PALETTE.card,
                        borderWidth: active ? 1.5 : 0, borderColor: active ? c.color : 'transparent',
                        alignItems: 'center', gap: 4,
                        shadowColor: PALETTE.ink, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
                      }}
                    >
                      <Text style={{ fontSize: 24 }}>{c.emoji}</Text>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: PALETTE.ink, textAlign: 'center' }}>{c.nombre}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={{ fontSize: 11, fontWeight: '700', color: PALETTE.muted, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 }}>
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

              <Text style={{ fontSize: 11, fontWeight: '700', color: PALETTE.muted, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 }}>
                Descripción
              </Text>
              <TextInput
                value={manualDescripcion}
                onChangeText={setManualDescripcion}
                placeholder="Ej: Súper Coto"
                placeholderTextColor={PALETTE.muted}
                style={{
                  backgroundColor: PALETTE.card, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
                  ...FONTS.body, fontSize: 14, color: PALETTE.ink, marginBottom: 20,
                  shadowColor: PALETTE.ink, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
                }}
              />

              <Pressable
                onPress={handleManualSave}
                disabled={!canSaveManual || saving}
                style={{
                  height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: canSaveManual ? PALETTE.ink : 'rgba(46,36,56,0.2)', opacity: saving ? 0.6 : 1,
                }}
              >
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={{ ...FONTS.display, fontSize: 15, fontWeight: '700', color: '#fff' }}>Guardar gasto</Text>
                }
              </Pressable>
            </>
          )}

          {/* ── FOTO ──────────────────────────────────────────────────── */}
          {tab === 'photo' && (
            <>
              {imageUri ? (
                <View style={{ marginBottom: 12, borderRadius: 18, overflow: 'hidden' }}>
                  <Image source={{ uri: imageUri }} style={{ width: '100%', height: 220, borderRadius: 18 }} resizeMode="cover" />
                  <Pressable
                    onPress={() => { setImageUri(null); setImageBase64(null); }}
                    style={{ position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ color: '#fff', fontSize: 14, lineHeight: 16 }}>✕</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                  {([{ fromCamera: true, emoji: '📷', label: 'Cámara' }, { fromCamera: false, emoji: '🖼️', label: 'Galería' }] as const).map(({ fromCamera, emoji, label }) => (
                    <Pressable
                      key={label}
                      onPress={() => pickImage(fromCamera)}
                      style={{
                        flex: 1, height: 110, borderRadius: 16, backgroundColor: PALETTE.card,
                        borderWidth: 1.5, borderColor: 'rgba(46,36,56,0.1)', borderStyle: 'dashed',
                        alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}
                    >
                      <Text style={{ fontSize: 32 }}>{emoji}</Text>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: PALETTE.muted }}>{label}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
              <Pressable
                onPress={handleAnalyzePhoto}
                disabled={!canAnalyzePhoto}
                style={{
                  height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8,
                  backgroundColor: canAnalyzePhoto ? PALETTE.accent : 'rgba(46,36,56,0.12)',
                }}
              >
                <Text style={{ fontSize: 16 }}>✨</Text>
                <Text style={{ ...FONTS.display, fontSize: 15, fontWeight: '700', color: canAnalyzePhoto ? PALETTE.ink : PALETTE.muted }}>
                  {imageUri ? 'Analizar foto' : 'Seleccioná una imagen'}
                </Text>
              </Pressable>
            </>
          )}

          {/* ── TEXTO ─────────────────────────────────────────────────── */}
          {tab === 'text' && (
            <>
              <View style={{
                backgroundColor: PALETTE.card, borderRadius: 18, padding: 4, marginBottom: 12,
                shadowColor: PALETTE.ink, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
              }}>
                <TextInput
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Ej: gasté $2500 en supermercado y $800 en nafta..."
                  placeholderTextColor={PALETTE.muted}
                  multiline
                  textAlignVertical="top"
                  style={{ paddingHorizontal: 14, paddingTop: 14, paddingBottom: 14, ...FONTS.body, fontSize: 15, color: PALETTE.ink, minHeight: 120 }}
                />
              </View>
              <Pressable
                onPress={handleAnalyzeText}
                disabled={!canAnalyzeText}
                style={{
                  height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8,
                  backgroundColor: canAnalyzeText ? PALETTE.accent : 'rgba(46,36,56,0.12)',
                }}
              >
                <Text style={{ fontSize: 16 }}>✨</Text>
                <Text style={{ ...FONTS.display, fontSize: 15, fontWeight: '700', color: canAnalyzeText ? PALETTE.ink : PALETTE.muted }}>
                  Analizar con IA
                </Text>
              </Pressable>
            </>
          )}

          {/* ── DICTAR ────────────────────────────────────────────────── */}
          {tab === 'dictar' && (
            <>
              {/* Idle */}
              {dictarPhase === 'idle' && (
                <View style={{ alignItems: 'center', paddingVertical: 36, gap: 16 }}>
                  <Pressable
                    onPress={startRecording}
                    style={{
                      width: 100, height: 100, borderRadius: 50,
                      backgroundColor: PALETTE.accent,
                      alignItems: 'center', justifyContent: 'center',
                      shadowColor: PALETTE.ink, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 8,
                    }}
                  >
                    <Text style={{ fontSize: 44 }}>🎙️</Text>
                  </Pressable>
                  <Text style={{ fontSize: 14, color: PALETTE.muted, fontWeight: '500' }}>
                    Presioná para empezar a grabar
                  </Text>
                </View>
              )}

              {/* Recording */}
              {dictarPhase === 'recording' && (
                <View style={{ alignItems: 'center', paddingVertical: 28, gap: 14 }}>
                  <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <Pressable
                      onPress={stopRecording}
                      style={{
                        width: 100, height: 100, borderRadius: 50,
                        backgroundColor: '#B03030',
                        alignItems: 'center', justifyContent: 'center',
                        shadowColor: '#B03030', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
                      }}
                    >
                      <Text style={{ fontSize: 44 }}>🎙️</Text>
                    </Pressable>
                  </Animated.View>

                  <Text style={{ fontSize: 40, fontWeight: '700', color: PALETTE.ink, letterSpacing: 2, fontVariant: ['tabular-nums'] }}>
                    {formatTime(recordingTime)}
                  </Text>

                  {/* Progress bar */}
                  <View style={{ width: '80%', height: 5, backgroundColor: 'rgba(46,36,56,0.1)', borderRadius: 3 }}>
                    <View style={{
                      height: 5, borderRadius: 3, backgroundColor: '#B03030',
                      width: `${Math.min((recordingTime / MAX_RECORDING_SECONDS) * 100, 100)}%`,
                    }} />
                  </View>
                  <Text style={{ fontSize: 12, color: PALETTE.muted }}>
                    Máximo {MAX_RECORDING_SECONDS}s · Presioná para detener
                  </Text>
                </View>
              )}

              {/* Transcribing */}
              {dictarPhase === 'transcribing' && (
                <View style={{ alignItems: 'center', paddingVertical: 60, gap: 14 }}>
                  <ActivityIndicator size="large" color={PALETTE.accent} />
                  <Text style={{ fontSize: 15, color: PALETTE.ink, fontWeight: '600' }}>Transcribiendo con Whisper…</Text>
                  <Text style={{ fontSize: 12, color: PALETTE.muted }}>Esto puede tardar unos segundos</Text>
                </View>
              )}

              {/* Review */}
              {dictarPhase === 'review' && (
                <View style={{ gap: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: PALETTE.muted, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 2 }}>
                    Texto transcripto · podés editarlo
                  </Text>
                  <View style={{
                    backgroundColor: PALETTE.card, borderRadius: 18, padding: 4,
                    shadowColor: PALETTE.ink, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
                  }}>
                    <TextInput
                      value={transcribedText}
                      onChangeText={setTranscribedText}
                      placeholder="(sin texto — escribí manualmente)"
                      placeholderTextColor={PALETTE.muted}
                      multiline
                      textAlignVertical="top"
                      style={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, ...FONTS.body, fontSize: 15, color: PALETTE.ink, minHeight: 100 }}
                    />
                  </View>
                  <Pressable
                    onPress={handleAnalyzeDictar}
                    disabled={!transcribedText.trim()}
                    style={{
                      height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8,
                      backgroundColor: transcribedText.trim() ? PALETTE.accent : 'rgba(46,36,56,0.12)',
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>✨</Text>
                    <Text style={{ ...FONTS.display, fontSize: 15, fontWeight: '700', color: transcribedText.trim() ? PALETTE.ink : PALETTE.muted }}>
                      Analizar con IA
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => { setDictarPhase('idle'); setTranscribedText(''); setRecordingTime(0); }}
                    style={{ alignItems: 'center', paddingVertical: 10 }}
                  >
                    <Text style={{ fontSize: 13, color: PALETTE.muted, fontWeight: '600' }}>🎙️ Grabar de nuevo</Text>
                  </Pressable>
                </View>
              )}
            </>
          )}

          {/* ── AI hint + tab description ──────────────────────────── */}
          {tab !== 'manual' && (
            <View style={{ marginTop: 14, gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECE6F6', borderRadius: 12, padding: 10 }}>
                <Text style={{ fontSize: 13 }}>✨</Text>
                <Text style={{ fontSize: 12, color: PALETTE.muted, flex: 1 }}>
                  La IA detecta y clasifica tus gastos automáticamente
                </Text>
              </View>

              {TAB_DESCRIPTIONS[tab] && (
                <Animated.View style={{
                  opacity: descFadeAnim,
                  backgroundColor: 'rgba(46,36,56,0.04)', borderRadius: 12, padding: 12,
                }}>
                  <Text style={{ fontSize: 12, color: PALETTE.muted, lineHeight: 18, textAlign: 'center' }}>
                    {TAB_DESCRIPTIONS[tab]}
                  </Text>
                </Animated.View>
              )}
            </View>
          )}
        </>
      )}

      {/* ── Preview ─────────────────────────────────────────────────────── */}
      {phase === 'preview' && (
        <>
          <View style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            backgroundColor: PALETTE.card, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12,
            shadowColor: PALETTE.ink, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
          }}>
            <Text style={{ fontSize: 13, color: PALETTE.muted }}>
              {detected.length} {detected.length === 1 ? 'gasto detectado' : 'gastos detectados'}
            </Text>
            <Text style={{ ...FONTS.display, fontSize: 15, fontWeight: '700', color: '#B03030' }}>
              -{formatARS(totalDetected)}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12, paddingHorizontal: 2 }}>
            {[{ color: '#2A6E47', label: 'Alta certeza' }, { color: '#E6982A', label: 'Media' }, { color: '#B03030', label: 'Baja certeza' }].map(({ color, label }) => (
              <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
                <Text style={{ fontSize: 10, color: PALETTE.muted }}>{label}</Text>
              </View>
            ))}
          </View>

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

          <Pressable
            onPress={handleSave}
            disabled={saving || detected.every(d => d.monto === 0)}
            style={{ height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1F3A2C', marginTop: 4, opacity: saving ? 0.6 : 1 }}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ ...FONTS.display, fontSize: 15, fontWeight: '700', color: '#fff' }}>
                  Guardar {detected.length === 1 ? 'gasto' : `${detected.length} gastos`}
                </Text>
            }
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

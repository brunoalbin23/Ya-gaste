import { AllCategory, DetectedGasto } from '../types';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

function buildSystemPrompt(categories: AllCategory[]): string {
  const catList = categories.map(c => `- ${c.id}: ${c.nombre} ${c.emoji}`).join('\n');
  return `Sos un asistente de finanzas personales argentino. Detectás gastos a partir de texto libre o fotos de tickets/facturas.

Devolvé ÚNICAMENTE un JSON array (sin markdown, sin texto antes ni después):
[{"categoria":"id","monto":1234,"descripcion":"texto","confianza":0.9}]

Categorías disponibles:
${catList}

Reglas:
- monto: número entero en pesos argentinos (sin decimales, sin $, sin puntos)
- categoria: exactamente uno de los IDs de la lista de arriba
- descripcion: máximo 35 caracteres en español, descriptiva y concisa
- confianza: número entre 0 y 1 según certeza
- Si hay múltiples gastos en el ticket, incluí todos en el array
- Si no detectás ningún gasto, devolvé []
- Nunca incluyas texto fuera del array JSON`;
}

async function callAnthropic(systemPrompt: string, userContent: object[]): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';
  if (!apiKey) throw new Error('Falta configurar la API key de IA');

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'prompt-caching-2024-07-31',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userContent }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Error de API (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text ?? '';
}

function parseGastos(text: string): DetectedGasto[] {
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error('Respuesta inválida de la IA');

  const arr = JSON.parse(cleaned.slice(start, end + 1));
  if (!Array.isArray(arr)) throw new Error('Respuesta inválida de la IA');

  return arr.map((item: any, idx: number) => ({
    id: `ai-${Date.now()}-${idx}`,
    categoria: String(item.categoria ?? ''),
    monto: Math.round(Math.abs(Number(item.monto) || 0)),
    descripcion: String(item.descripcion ?? '').slice(0, 35),
    confianza: Math.min(1, Math.max(0, Number(item.confianza) || 0.5)),
  }));
}

export async function analyzeText(text: string, categories: AllCategory[]): Promise<DetectedGasto[]> {
  const systemPrompt = buildSystemPrompt(categories);
  const userContent = [{ type: 'text', text }];

  let rawText: string;
  try {
    rawText = await callAnthropic(systemPrompt, userContent);
  } catch (e) {
    throw e;
  }

  try {
    return parseGastos(rawText);
  } catch {
    // Retry once on bad JSON
    rawText = await callAnthropic(systemPrompt, userContent);
    return parseGastos(rawText);
  }
}

export async function transcribeAudio(uri: string): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';
  if (!apiKey) throw new Error('Falta configurar la API key de OpenAI');

  const formData = new FormData();
  formData.append('file', { uri, name: 'recording.m4a', type: 'audio/m4a' } as any);
  formData.append('model', 'whisper-1');
  formData.append('language', 'es');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}` },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Error de Whisper (${res.status}): ${err}`);
  }

  const data = await res.json();
  return (data.text ?? '').trim();
}

export async function analyzeImage(base64: string, mediaType: string, categories: AllCategory[]): Promise<DetectedGasto[]> {
  const systemPrompt = buildSystemPrompt(categories);
  const userContent = [
    {
      type: 'image',
      source: { type: 'base64', media_type: mediaType, data: base64 },
    },
    { type: 'text', text: 'Analizá este ticket o factura y detectá todos los gastos.' },
  ];

  let rawText: string;
  try {
    rawText = await callAnthropic(systemPrompt, userContent);
  } catch (e) {
    throw e;
  }

  try {
    return parseGastos(rawText);
  } catch {
    rawText = await callAnthropic(systemPrompt, userContent);
    return parseGastos(rawText);
  }
}

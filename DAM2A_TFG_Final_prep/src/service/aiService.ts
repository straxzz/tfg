import { ClothingItem, UserData } from '@/src/types';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

const CATEGORIES = ['Camisetas', 'Pantalones', 'Zapatos', 'Sudaderas', 'Chaquetas', 'Accesorios', 'Otros'];
const COLOR_IDS = ['blanco', 'negro', 'gris', 'beige', 'marino', 'azul', 'verde', 'rojo', 'rosa', 'amarillo', 'naranja', 'marron', 'morado'];

export interface ClothingAnalysis {
  name: string;
  brand: string;
  category: string;
  color: string;
}

// redimensionamos antes de enviar para no gastar tokens de más (~4K → ~300 tokens)
const MAX_PX = 512;

async function uriToBase64(uri: string): Promise<{ data: string; mimeType: string }> {
  let dataUrl: string;

  if (uri.startsWith('data:')) {
    dataUrl = uri;
  } else {
    const response = await fetch(uri);
    const blob = await response.blob();
    dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_PX / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas no disponible'));

      ctx.drawImage(img, 0, 0, w, h);
      const resized = canvas.toDataURL('image/jpeg', 0.8);
      const data = resized.split(',')[1];
      resolve({ data, mimeType: 'image/jpeg' });
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

// 429 = rate limit → reintentamos una vez. RESOURCE_EXHAUSTED = cuota diaria, no tiene sentido reintentar
async function callGemini(body: object, retries = 1): Promise<any> {
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (res.status === 429) {
    let errBody: any = {};
    try {
      errBody = await res.clone().json();
    } catch { /* no era JSON, ignorar */ }
    const reason: string = errBody?.error?.status ?? '';
    const message: string = errBody?.error?.message ?? '';
    const isQuotaExhausted = reason === 'RESOURCE_EXHAUSTED';

    if (isQuotaExhausted) {
      throw new Error(
        'Cuota diaria de Gemini agotada. La funcion de IA estara disponible manana o con una nueva clave API.',
      );
    }

    if (retries > 0) {
      await new Promise((r) => setTimeout(r, 3000));
      return callGemini(body, retries - 1);
    }

    throw new Error(`Limite de solicitudes: ${message || reason || res.status}. Espera unos segundos e intentalo de nuevo.`);
  }

  if (res.status === 503 && retries > 0) {
    await new Promise((r) => setTimeout(r, 3000));
    return callGemini(body, retries - 1);
  }

  if (!res.ok) {
    throw new Error(`Error de Gemini (${res.status}). Intentalo de nuevo en unos segundos.`);
  }

  return res.json();
}

export async function analyzeClothing(imageUri: string): Promise<ClothingAnalysis> {
  if (!API_KEY) throw new Error('Clave de Gemini no configurada');

  const { data: base64, mimeType } = await uriToBase64(imageUri);

  const prompt =
    `Analiza esta imagen de ropa y devuelve SOLO un objeto JSON valido, sin texto adicional ni bloques de codigo, con estos campos exactos:\n` +
    `{"name":"nombre descriptivo en espanol","brand":"marca si es visible o cadena vacia, si no hay marca escribe cadena vacia","category":"una de: ${CATEGORIES.join(', ')}","color":"uno de exactamente: ${COLOR_IDS.join(', ')}"}`;

  const body = {
    contents: [
      {
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: base64 } },
        ],
      },
    ],
    generationConfig: { temperature: 0.1, maxOutputTokens: 150, thinkingConfig: { thinkingBudget: 0 } },
  };

  const data = await callGemini(body);
  const raw = (data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '') as string;
  const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  let parsed: any;
  try {
    parsed = JSON.parse(clean);
  } catch {
    throw new Error('La IA no devolvio un JSON valido');
  }

  // gemini a veces devuelve "azul marino" en vez de "marino", buscamos coincidencia parcial como fallback
  const rawColor = typeof parsed.color === 'string' ? parsed.color.toLowerCase().trim() : '';
  const matchedColor =
    COLOR_IDS.find((id) => id === rawColor) ??
    COLOR_IDS.find((id) => rawColor.includes(id)) ??
    '';

  return {
    name: typeof parsed.name === 'string' ? parsed.name : '',
    brand: typeof parsed.brand === 'string' ? parsed.brand : '',
    category: CATEGORIES.includes(parsed.category) ? parsed.category : 'Otros',
    color: matchedColor,
  };
}

/**
 * Sugerencia de outfit rápida (texto).
 */
export async function getOutfitSuggestion(
  clothes: ClothingItem[],
  userData?: UserData | null,
): Promise<string> {
  if (!API_KEY || clothes.length === 0) return '';

  const list = clothes
    .slice(0, 15)
    .map((item) => {
      const parts: string[] = [item.category];
      if (item.color) parts.push(item.color);
      if (item.size) parts.push(`talla ${item.size}`);
      return `- ${item.name} (${parts.join(', ')})`;
    })
    .join('\n');

  const profileLines: string[] = [];
  if (userData?.gender) {
    const genderMap: Record<string, string> = {
      woman: 'mujer',
      man: 'hombre',
      nonbinary: 'no binario',
      prefer_not_to_say: 'prefiere no decirlo',
    };
    profileLines.push(`Género: ${genderMap[userData.gender] ?? userData.gender}`);
  }
  if (userData?.heightCm) profileLines.push(`Altura: ${userData.heightCm} cm`);
  if (userData?.weightKg) profileLines.push(`Peso: ${userData.weightKg} kg`);
  if (userData?.styleTags?.length) profileLines.push(`Estilo preferido: ${userData.styleTags.join(', ')}`);
  const profileContext = profileLines.length > 0
    ? `Perfil del usuario: ${profileLines.join('. ')}.\n\n`
    : '';

  const body = {
    contents: [
      {
        parts: [
          {
            text:
              `${profileContext}Tengo las siguientes prendas en mi armario:\n${list}\n\n` +
              `Sugiere un outfit completo para hoy eligiendo algunas de ellas. ` +
              `Ten en cuenta el perfil del usuario si esta disponible. ` +
              `Se breve (maximo 2-3 frases), concreto y en espanol. Sin emojis.`,
          },
        ],
      },
    ],
    generationConfig: { temperature: 0.7, maxOutputTokens: 120, thinkingConfig: { thinkingBudget: 0 } },
  };

  try {
    const data = await callGemini(body);
    return (data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '').trim();
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Outfit con teoría del color
// ---------------------------------------------------------------------------

export interface OutfitCandidate {
  id: string;
  name: string;
  category: string;
  color?: string;
  size?: string;
  sourceType: 'wardrobe' | 'marketplace';
  sourceLabel: string; // "Tu armario" | "De @nombre"
  image: string;
}

export interface OutfitResult {
  selectedIds: string[];
  description: string;
}

export async function getDetailedOutfitSuggestion(
  candidates: OutfitCandidate[],
  userData?: UserData | null,
): Promise<OutfitResult> {
  if (!API_KEY || candidates.length === 0) return { selectedIds: [], description: '' };

  const list = candidates
    .map((c) => {
      let entry = `{"id":"${c.id}","name":"${c.name}","category":"${c.category}"`;
      if (c.color) entry += `,"color":"${c.color}"`;
      if (c.size) entry += `,"size":"${c.size}"`;
      entry += '}';
      return entry;
    })
    .join(',');

  const profileLines: string[] = [];
  if (userData?.gender) {
    const genderMap: Record<string, string> = {
      woman: 'mujer',
      man: 'hombre',
      nonbinary: 'no binario',
      prefer_not_to_say: 'prefiere no decirlo',
    };
    profileLines.push(`genero: ${genderMap[userData.gender] ?? userData.gender}`);
  }
  if (userData?.heightCm) profileLines.push(`altura: ${userData.heightCm} cm`);
  if (userData?.weightKg) profileLines.push(`peso: ${userData.weightKg} kg`);
  if (userData?.styleTags?.length) profileLines.push(`estilo preferido: ${userData.styleTags.join(', ')}`);
  const profileContext = profileLines.length > 0
    ? `El usuario tiene el siguiente perfil: ${profileLines.join(', ')}. Ten esto en cuenta al elegir el outfit. `
    : '';

  const body = {
    contents: [
      {
        parts: [
          {
            text:
              `Eres un estilista experto en teoria del color. ` +
              `${profileContext}` +
              `Dado este inventario de prendas en formato JSON, crea UN outfit completo y coordinado ` +
              `aplicando principios de combinacion de colores (complementarios, analogos o neutros). ` +
              `El outfit debe incluir al menos parte superior y parte inferior (o vestido/mono). ` +
              `Puedes incluir calzado y accesorios si los hay. Elige entre 2 y 5 prendas. ` +
              `Devuelve SOLO un objeto JSON valido sin texto adicional: ` +
              `{"ids":["id1","id2"],"descripcion":"explicacion breve en espanol de por que combinan bien"}\n` +
              `Inventario disponible: [${list}]`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 300,
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  try {
    const data = await callGemini(body);
    const raw = (data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '') as string;
    const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(clean);
    return {
      selectedIds: Array.isArray(parsed.ids) ? parsed.ids : [],
      description: typeof parsed.descripcion === 'string' ? parsed.descripcion : '',
    };
  } catch {
    return { selectedIds: [], description: '' };
  }
}
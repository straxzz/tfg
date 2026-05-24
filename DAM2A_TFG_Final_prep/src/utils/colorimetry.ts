/**
 * colorimetry.ts — Sistema de recomendacion de colores para Virtual Closet.
 *
 * Usa combinaciones de moda (fashion colorimetry) en lugar de teoria de color
 * pura, ya que el resultado es mas util para el usuario final.
 *
 * Paleta de 13 colores base + tabla de combinaciones validadas por estilo.
 */

// ---------------------------------------------------------------------------
// Paleta
// ---------------------------------------------------------------------------
export interface GarmentColor {
  id: string;
  name: string;
  hex: string;
}

export const GARMENT_COLORS: GarmentColor[] = [
  { id: 'blanco',   name: 'Blanco',   hex: '#F5F5F5' },
  { id: 'negro',    name: 'Negro',    hex: '#1A1A1A' },
  { id: 'gris',     name: 'Gris',     hex: '#9B9B9B' },
  { id: 'beige',    name: 'Beige',    hex: '#E8D9C5' },
  { id: 'marino',   name: 'Marino',   hex: '#1B3A5C' },
  { id: 'azul',     name: 'Azul',     hex: '#4A7FB5' },
  { id: 'verde',    name: 'Verde',    hex: '#5A8A6A' },
  { id: 'rojo',     name: 'Rojo',     hex: '#C0392B' },
  { id: 'rosa',     name: 'Rosa',     hex: '#E8A0B4' },
  { id: 'amarillo', name: 'Amarillo', hex: '#F5C842' },
  { id: 'naranja',  name: 'Naranja',  hex: '#E07B39' },
  { id: 'marron',   name: 'Marron',   hex: '#8B6347' },
  { id: 'morado',   name: 'Morado',   hex: '#7B68A8' },
];

// ---------------------------------------------------------------------------
// Combinaciones fashion
// ---------------------------------------------------------------------------
const COLOR_PAIRINGS: Record<string, string[]> = {
  blanco:   ['negro', 'marino', 'rojo', 'azul'],
  negro:    ['blanco', 'rojo', 'gris', 'azul'],
  gris:     ['marino', 'negro', 'rojo', 'blanco'],
  beige:    ['marino', 'marron', 'verde', 'negro'],
  marino:   ['blanco', 'beige', 'rojo', 'gris'],
  azul:     ['blanco', 'amarillo', 'naranja', 'gris'],
  verde:    ['beige', 'marron', 'blanco', 'negro'],
  rojo:     ['negro', 'blanco', 'gris', 'marino'],
  rosa:     ['blanco', 'marino', 'gris', 'negro'],
  amarillo: ['marino', 'gris', 'marron', 'blanco'],
  naranja:  ['marino', 'verde', 'marron', 'blanco'],
  marron:   ['beige', 'verde', 'naranja', 'blanco'],
  morado:   ['gris', 'beige', 'blanco', 'negro'],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export const getColorById = (id: string): GarmentColor | undefined =>
  GARMENT_COLORS.find((c) => c.id === id);

/** Devuelve hasta 4 colores que combinan bien con el dado. */
export const getPairings = (colorId: string): GarmentColor[] => {
  const ids = COLOR_PAIRINGS[colorId] ?? ['negro', 'blanco', 'gris', 'beige'];
  return ids.map((id) => getColorById(id)).filter(Boolean) as GarmentColor[];
};

/**
 * Determina si el texto encima de un fondo de color debe ser claro u oscuro.
 * Calcula luminancia relativa (WCAG).
 */
export const getContrastText = (hex: string): '#1A1A1A' | '#F5F5F5' => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.35 ? '#1A1A1A' : '#F5F5F5';
};

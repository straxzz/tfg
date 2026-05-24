/**
 * Sistema de diseño · Virtual Closet
 * Tokens de tipografía, espaciado, bordes y sombras.
 *
 * Tipografía:
 *   - Display / títulos: serif (Georgia) — tono editorial.
 *   - Cuerpo / UI: system sans-serif por defecto.
 */

import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// Familias
// ---------------------------------------------------------------------------
export const Fonts = {
  serif: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'Georgia',
  }) as string,
  serifItalic: Platform.select({
    ios: 'Georgia-Italic',
    android: 'serif',
    default: 'Georgia',
  }) as string,
  sans: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'System',
  }) as string,
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'Menlo',
  }) as string,
};

// ---------------------------------------------------------------------------
// Escala tipográfica (no usar fontWeight bold con serif italic — queda raro)
// ---------------------------------------------------------------------------
export const Type = {
  display: {
    fontFamily: Fonts.serif,
    fontSize: 44,
    lineHeight: 50,
    letterSpacing: -0.5,
    fontWeight: '400' as const,
  },
  h1: {
    fontFamily: Fonts.serif,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.3,
    fontWeight: '400' as const,
  },
  h2: {
    fontFamily: Fonts.serif,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.2,
    fontWeight: '400' as const,
  },
  h3: {
    fontFamily: Fonts.serif,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '400' as const,
  },
  // Etiqueta editorial (uppercase tracking)
  eyebrow: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 2,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
  },
  bodyLg: {
    fontFamily: Fonts.sans,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  body: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400' as const,
  },
  bodyMedium: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500' as const,
  },
  small: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
  },
  smallMedium: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500' as const,
  },
  caption: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
  },
  // Botón
  button: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
};

// ---------------------------------------------------------------------------
// Espaciado (escala 4)
// ---------------------------------------------------------------------------
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 56,
  '5xl': 72,
  '6xl': 96,
};

// ---------------------------------------------------------------------------
// Radios — minimalista, contornos definidos
// ---------------------------------------------------------------------------
export const Radii = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 999,
};

// ---------------------------------------------------------------------------
// Sombras (uso muy puntual; preferimos bordes finos)
// ---------------------------------------------------------------------------
export const Shadow = {
  none: {},
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
};

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------
export const Layout = {
  screenPadding: Spacing.xl, // 24
  headerTopOffset: 56,       // espacio para status bar + cabecera
  hairline: 1,               // grosor de línea fina
};

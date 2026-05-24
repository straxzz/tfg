/**
 * Paleta editorial minimalista para Virtual Closet.
 * Inspirada en revistas de moda contemporáneas (Vogue, Apple).
 *
 * Filosofía:
 *  - Blancos/negros dominantes con grises calibrados.
 *  - Sin colores saturados como acento principal: el contraste es el protagonista.
 *  - Estados (error/success) atenuados para no romper el tono editorial.
 */

export const Colors = {
  light: {
    // Capas
    background: '#FAFAFA',          // Fondo de pantalla (off-white)
    backgroundSecondary: '#F4F4F4', // Bandejas, fondos secundarios
    surface: '#FFFFFF',              // Tarjetas, modales
    surfaceElevated: '#FFFFFF',

    // Texto
    text: '#0A0A0A',                 // Casi negro, mejor que el negro puro
    textSecondary: '#6B6B6B',        // Gris medio
    textMuted: '#9C9C9C',            // Gris suave (placeholders, captions)

    // Acento (todo el sistema usa el mismo color — minimalista)
    primary: '#0A0A0A',
    primaryText: '#FAFAFA',
    primarySoft: '#1A1A1A',          // Hover/pressed sutil

    // Líneas
    border: '#E8E8E8',
    borderStrong: '#D4D4D4',

    // Estados
    error: '#B42318',
    errorBg: '#FEF3F2',
    success: '#067647',
    successBg: '#ECFDF3',
    warning: '#B54708',

    // Iconos auxiliares (tonos neutros)
    tint: '#0A0A0A',
    icon: '#6B6B6B',
    tabIconDefault: '#9C9C9C',
    tabIconSelected: '#0A0A0A',

    // Acentos sutiles para badges (mantener compatibilidad con código previo)
    iconBgBlue: '#F4F4F4',
    iconBlue: '#0A0A0A',
    iconBgGreen: '#F4F4F4',
    iconGreen: '#0A0A0A',

    // Sombra editorial muy ligera
    shadow: 'rgba(10, 10, 10, 0.06)',
    overlay: 'rgba(10, 10, 10, 0.45)',
  },
  dark: {
    // Capas
    background: '#0B0B0B',
    backgroundSecondary: '#141414',
    surface: '#161616',
    surfaceElevated: '#1C1C1C',

    // Texto
    text: '#FAFAFA',
    textSecondary: '#A3A3A3',
    textMuted: '#6B6B6B',

    // Acento
    primary: '#FAFAFA',
    primaryText: '#0A0A0A',
    primarySoft: '#E5E5E5',

    // Líneas
    border: '#262626',
    borderStrong: '#3A3A3A',

    // Estados
    error: '#F97066',
    errorBg: '#2C0F0C',
    success: '#47CD89',
    successBg: '#0E2A1F',
    warning: '#F79009',

    // Iconos
    tint: '#FAFAFA',
    icon: '#A3A3A3',
    tabIconDefault: '#6B6B6B',
    tabIconSelected: '#FAFAFA',

    // Acentos sutiles
    iconBgBlue: '#1C1C1C',
    iconBlue: '#FAFAFA',
    iconBgGreen: '#1C1C1C',
    iconGreen: '#FAFAFA',

    // Sombras
    shadow: 'rgba(0, 0, 0, 0.5)',
    overlay: 'rgba(0, 0, 0, 0.65)',
  },
};

export type ColorScheme = typeof Colors.light;

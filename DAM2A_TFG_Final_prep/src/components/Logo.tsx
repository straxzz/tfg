/**
 * Logo de Virtual Closet.
 *
 * Identidad: monograma "VC" en serif + wordmark "VIRTUAL · CLOSET" tracked.
 * Sin dependencias externas (solo View + Text).
 *
 * Variantes:
 *   - "monogram" → solo "VC" en serif (cuadrado, ideal para splash o avatares).
 *   - "wordmark" → solo el texto.
 *   - "stacked"  → monograma sobre wordmark (vertical, splash).
 *   - "inline"   → monograma a la izquierda + wordmark a la derecha.
 *
 * Respeta el tema claro/oscuro automáticamente.
 */

import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { Fonts } from '@/src/constants/theme';
import { TextStyled } from './Typography';

type Variant = 'monogram' | 'wordmark' | 'stacked' | 'inline';

export interface LogoProps {
  variant?: Variant;
  size?: number;
  tint?: string;
  accent?: string;
  style?: StyleProp<ViewStyle>;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'stacked',
  size = 64,
  tint,
  accent,
  style,
}) => {
  const colors = useThemeColor();
  const primary = tint ?? colors.text;
  const secondary = accent ?? colors.textMuted;

  if (variant === 'wordmark') {
    return <Wordmark size={size * 0.32} color={primary} style={style} />;
  }

  if (variant === 'monogram') {
    return <Monogram size={size} primary={primary} secondary={secondary} style={style} />;
  }

  if (variant === 'inline') {
    return (
      <View style={[styles.inline, style]}>
        <Monogram size={size} primary={primary} secondary={secondary} />
        <View style={{ marginLeft: size * 0.32 }}>
          <Wordmark size={size * 0.28} color={primary} />
        </View>
      </View>
    );
  }

  // stacked (default)
  return (
    <View style={[styles.stacked, style]}>
      <Monogram size={size} primary={primary} secondary={secondary} />
      <View style={{ marginTop: size * 0.28 }}>
        <Wordmark size={size * 0.22} color={primary} />
      </View>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Monograma — "VC" superpuesto en serif (estilo editorial)
// ---------------------------------------------------------------------------
const Monogram = ({
  size,
  primary,
  secondary,
  style,
}: {
  size: number;
  primary: string;
  secondary: string;
  style?: StyleProp<ViewStyle>;
}) => {
  return (
    <View style={[{ width: size, height: size }, styles.monoWrap, style]}>
      {/* Anillo exterior sutil — referencia "armario circular" */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1,
          borderColor: secondary,
          opacity: 0.35,
        }}
      />
      {/* C atrás (más grande) */}
      <TextStyled
        style={{
          position: 'absolute',
          fontFamily: Fonts.serif,
          fontSize: size * 0.78,
          lineHeight: size * 0.78,
          color: secondary,
          left: size * 0.22,
          top: size * 0.08,
        }}
      >
        C
      </TextStyled>
      {/* V delante */}
      <TextStyled
        style={{
          position: 'absolute',
          fontFamily: Fonts.serif,
          fontSize: size * 0.78,
          lineHeight: size * 0.78,
          color: primary,
          left: size * 0.06,
          top: size * 0.08,
        }}
      >
        V
      </TextStyled>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Wordmark — "VIRTUAL · CLOSET"
// ---------------------------------------------------------------------------
const Wordmark = ({
  size,
  color,
  style,
}: {
  size: number;
  color: string;
  style?: StyleProp<ViewStyle>;
}) => {
  return (
    <View style={[styles.wordmarkRow, style]}>
      <TextStyled
        style={{
          fontFamily: Fonts.sans,
          fontSize: size,
          lineHeight: size * 1.1,
          letterSpacing: size * 0.22,
          fontWeight: '600',
          color,
        }}
      >
        VIRTUAL
      </TextStyled>
      <View
        style={{
          width: size * 0.45,
          height: 1,
          backgroundColor: color,
          marginHorizontal: size * 0.5,
          opacity: 0.4,
        }}
      />
      <TextStyled
        style={{
          fontFamily: Fonts.sans,
          fontSize: size,
          lineHeight: size * 1.1,
          letterSpacing: size * 0.22,
          fontWeight: '600',
          color,
        }}
      >
        CLOSET
      </TextStyled>
    </View>
  );
};

const styles = StyleSheet.create({
  stacked: { alignItems: 'center' },
  inline: { flexDirection: 'row', alignItems: 'center' },
  monoWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

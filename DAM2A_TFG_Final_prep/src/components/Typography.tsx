/**
 * Componentes tipográficos editoriales.
 *
 * Variantes serif (Georgia): display, h1, h2, h3
 * Variantes sans-serif (System): eyebrow, bodyLg, body, bodyMedium, small,
 * smallMedium, caption, button.
 *
 * Cuando `italic` es true:
 *   - Si la variante es serif → usa Fonts.serifItalic + fontStyle italic.
 *   - Si la variante es sans  → solo aplica fontStyle italic.
 */

import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { Fonts, Type } from '@/src/constants/theme';
import { useThemeColor } from '@/src/hooks/useThemeColor';

type Variant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'eyebrow'
  | 'bodyLg'
  | 'body'
  | 'bodyMedium'
  | 'small'
  | 'smallMedium'
  | 'caption'
  | 'button';

type ColorKey =
  | 'text'
  | 'textSecondary'
  | 'textMuted'
  | 'primary'
  | 'primaryText'
  | 'error'
  | 'success';

const SERIF_VARIANTS: ReadonlyArray<Variant> = ['display', 'h1', 'h2', 'h3'];

export interface TextStyledProps extends TextProps {
  variant?: Variant;
  color?: ColorKey | string;
  align?: 'left' | 'center' | 'right';
  italic?: boolean;
}

export const TextStyled: React.FC<TextStyledProps> = ({
  variant = 'body',
  color = 'text',
  align,
  italic,
  style,
  children,
  ...rest
}) => {
  const colors = useThemeColor();
  const resolvedColor = color in colors ? (colors as any)[color] : color;
  const variantStyle = Type[variant] as TextStyle;

  const italicStyle: TextStyle | null = italic
    ? SERIF_VARIANTS.includes(variant)
      ? { fontFamily: Fonts.serifItalic, fontStyle: 'italic' }
      : { fontStyle: 'italic' }
    : null;

  return (
    <Text
      {...rest}
      style={[
        variantStyle,
        { color: resolvedColor },
        align ? { textAlign: align } : null,
        italicStyle,
        style,
      ]}
    >
      {children}
    </Text>
  );
};

// Atajos --------------------------------------------------------------------
export const Display = (p: Omit<TextStyledProps, 'variant'>) => (
  <TextStyled variant="display" {...p} />
);
export const H1 = (p: Omit<TextStyledProps, 'variant'>) => (
  <TextStyled variant="h1" {...p} />
);
export const H2 = (p: Omit<TextStyledProps, 'variant'>) => (
  <TextStyled variant="h2" {...p} />
);
export const H3 = (p: Omit<TextStyledProps, 'variant'>) => (
  <TextStyled variant="h3" {...p} />
);
export const Eyebrow = (p: Omit<TextStyledProps, 'variant'>) => (
  <TextStyled variant="eyebrow" color="textSecondary" {...p} />
);
export const Body = (p: Omit<TextStyledProps, 'variant'>) => (
  <TextStyled variant="body" {...p} />
);
export const Small = (p: Omit<TextStyledProps, 'variant'>) => (
  <TextStyled variant="small" color="textSecondary" {...p} />
);
export const Caption = (p: Omit<TextStyledProps, 'variant'>) => (
  <TextStyled variant="caption" color="textMuted" {...p} />
);

/**
 * <Italic> — span en cursiva pensado para anidarse dentro de un título serif.
 * Hereda el tamaño y color del padre, solo cambia la familia a Georgia Italic.
 */
export const Italic: React.FC<TextProps> = ({ style, children, ...rest }) => (
  <Text
    {...rest}
    style={[{ fontFamily: Fonts.serifItalic, fontStyle: 'italic' }, style]}
  >
    {children}
  </Text>
);

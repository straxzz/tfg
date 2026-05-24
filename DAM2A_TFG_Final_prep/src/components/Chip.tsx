/**
 * Chip de filtro/categoría minimalista.
 * Línea inferior cuando está seleccionado (estilo editorial), nada de píldoras de color.
 */

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { Spacing, Type } from '@/src/constants/theme';
import { TextStyled } from './Typography';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Estilo "block" — chip cuadrado con borde y fondo. */
  block?: boolean;
}

export const Chip: React.FC<ChipProps> = ({ label, selected, onPress, block }) => {
  const colors = useThemeColor();

  if (block) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.block,
          {
            backgroundColor: selected ? colors.primary : 'transparent',
            borderColor: selected ? colors.primary : colors.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <TextStyled
          style={[
            Type.smallMedium,
            { color: selected ? colors.primaryText : colors.text, letterSpacing: 0.3 },
          ]}
        >
          {label}
        </TextStyled>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} style={styles.lineWrapper}>
      <TextStyled
        style={[
          Type.smallMedium,
          {
            color: selected ? colors.text : colors.textSecondary,
            letterSpacing: 0.5,
          },
        ]}
      >
        {label}
      </TextStyled>
      <View
        style={[
          styles.underline,
          { backgroundColor: selected ? colors.text : 'transparent' },
        ]}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  lineWrapper: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    alignItems: 'center',
  },
  underline: {
    height: 1,
    width: '100%',
    marginTop: Spacing.sm,
  },
  block: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm + 2,
    borderRadius: 999,
    borderWidth: 1,
  },
});

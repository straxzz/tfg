/**
 * Tarjeta editorial minimalista.
 * - Fondo de superficie + borde fino.
 * - Sin sombras pesadas.
 */

import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { Radii, Spacing } from '@/src/constants/theme';

export interface CardProps {
  onPress?: () => void;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  bordered?: boolean;
  flat?: boolean;
}

export const Card: React.FC<CardProps> = ({
  onPress,
  children,
  style,
  padding = Spacing.lg,
  bordered = true,
  flat = false,
}) => {
  const colors = useThemeColor();
  const baseStyle = [
    styles.base,
    {
      backgroundColor: flat ? 'transparent' : colors.surface,
      borderColor: bordered ? colors.border : 'transparent',
      borderWidth: bordered ? 1 : 0,
      padding,
    },
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [...baseStyle, { opacity: pressed ? 0.92 : 1 }]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={baseStyle as any}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: Radii.md,
  },
});

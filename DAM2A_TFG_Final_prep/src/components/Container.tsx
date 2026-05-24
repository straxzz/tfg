/**
 * Container responsive.
 *
 * - En móvil ocupa todo el ancho.
 * - A partir de tablet (>=640px) limita el contenido a un max-width
 *   y lo centra horizontalmente — ideal para el modo web/desktop.
 *
 * Acepta dos modos:
 *   - "padded" (default) → aplica también padding horizontal del breakpoint.
 *   - "raw" → solo centra y limita ancho, sin padding (útil para FlatList numColumns).
 */

import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useBreakpoint } from '@/src/hooks/useBreakpoint';

export interface ContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  /** Sobrescribe el max-width calculado. */
  maxWidth?: number;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  style,
  padded = true,
  maxWidth,
}) => {
  const { contentMaxWidth, screenPadding } = useBreakpoint();
  const cap = maxWidth ?? contentMaxWidth;
  return (
    <View
      style={[
        styles.outer,
        {
          paddingHorizontal: padded ? screenPadding : 0,
        },
        style,
      ]}
    >
      <View style={[styles.inner, { maxWidth: cap }]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    alignItems: 'center',
  },
  inner: {
    width: '100%',
  },
});

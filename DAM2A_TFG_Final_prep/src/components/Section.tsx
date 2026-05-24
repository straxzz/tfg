/**
 * Sección con eyebrow + título serif + contenido.
 * Reutilizable para todas las pantallas.
 */

import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { Spacing } from '@/src/constants/theme';
import { Eyebrow, H2, Small } from './Typography';

export interface SectionProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  spacing?: number;
}

export const Section: React.FC<SectionProps> = ({
  eyebrow,
  title,
  description,
  style,
  children,
  spacing = Spacing['2xl'],
}) => {
  return (
    <View style={[{ marginBottom: spacing }, style]}>
      {(eyebrow || title || description) && (
        <View style={{ marginBottom: Spacing.base }}>
          {eyebrow ? <Eyebrow style={{ marginBottom: Spacing.sm }}>{eyebrow}</Eyebrow> : null}
          {title ? <H2>{title}</H2> : null}
          {description ? (
            <Small style={{ marginTop: Spacing.sm }}>{description}</Small>
          ) : null}
        </View>
      )}
      {children}
    </View>
  );
};

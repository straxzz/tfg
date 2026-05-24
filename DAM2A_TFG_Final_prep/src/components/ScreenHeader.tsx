/**
 * Cabecera estándar de pantalla (estilo editorial).
 *
 * Patrón:
 *   eyebrow (opcional, uppercase)
 *   Título grande serif
 *   Subtítulo opcional sans
 *
 * Acciones a la derecha (icono o texto).
 */

import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Layout, Spacing } from '@/src/constants/theme';
import { Eyebrow, H1, Small } from './Typography';

export interface ScreenHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  left?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  topOffset?: number;
  spacingBottom?: number;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  eyebrow,
  title,
  subtitle,
  right,
  left,
  style,
  topOffset = Layout.headerTopOffset,
  spacingBottom = Spacing.xl,
}) => {
  return (
    <View style={[styles.wrapper, { paddingTop: topOffset, paddingBottom: spacingBottom }, style]}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          {eyebrow ? <Eyebrow style={{ marginBottom: Spacing.sm }}>{eyebrow}</Eyebrow> : null}
          <H1>{title}</H1>
          {subtitle ? (
            <Small style={{ marginTop: Spacing.sm }}>{subtitle}</Small>
          ) : null}
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
      {left ? <View style={styles.left}>{left}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: Layout.screenPadding,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  right: {
    marginLeft: Spacing.base,
  },
  left: {
    marginTop: Spacing.base,
  },
});

/**
 * Page — wrapper raíz responsive para cada pantalla.
 *
 * Aplica:
 *   - Background del tema.
 *   - Padding lateral según breakpoint.
 *   - Max-width centrado en tablet/desktop/wide.
 *   - Padding superior estándar (configurable).
 *
 * Variantes de scroll:
 *   - scroll = "vertical"  → envuelve en ScrollView vertical (default).
 *   - scroll = "none"      → solo View (útil cuando dentro hay FlatList que ya scrollea).
 */

import React from 'react';
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { useBreakpoint } from '@/src/hooks/useBreakpoint';
import { Layout, Spacing } from '@/src/constants/theme';

export interface PageProps {
  children: React.ReactNode;
  scroll?: 'vertical' | 'none';
  /** Si false, aplica solo max-width sin padding lateral. */
  padded?: boolean;
  topOffset?: number;
  bottomOffset?: number;
  /** KeyboardAvoidingView wrapper para formularios. */
  keyboardAvoiding?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
}

export const Page: React.FC<PageProps> = ({
  children,
  scroll = 'vertical',
  padded = true,
  topOffset = Layout.headerTopOffset,
  bottomOffset = Spacing['4xl'],
  keyboardAvoiding = false,
  contentStyle,
  style,
}) => {
  const colors = useThemeColor();
  const { contentMaxWidth, screenPadding } = useBreakpoint();

  const centerStyle: ViewStyle = {
    width: '100%',
    maxWidth: contentMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: padded ? screenPadding : 0,
    paddingTop: topOffset,
    paddingBottom: bottomOffset,
  };

  const inner = (
    <View style={[centerStyle, contentStyle]}>{children}</View>
  );

  if (scroll === 'vertical') {
    const body = (
      <ScrollView
        style={[{ flex: 1, backgroundColor: colors.background }, style]}
        contentContainerStyle={{ flexGrow: 1, alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {inner}
      </ScrollView>
    );
    if (keyboardAvoiding) {
      return (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, backgroundColor: colors.background }}
        >
          {body}
        </KeyboardAvoidingView>
      );
    }
    return body;
  }

  return (
    <View style={[styles.noScroll, { backgroundColor: colors.background }, style]}>
      {inner}
    </View>
  );
};

const styles = StyleSheet.create({
  noScroll: {
    flex: 1,
    alignItems: 'center',
  },
});

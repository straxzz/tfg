/**
 * Input editorial. Sin caja, solo línea inferior fina.
 * Soporta etiqueta superior, error inline y prefijo/sufijo (icono o texto).
 */

import React, { useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { Spacing, Type } from '@/src/constants/theme';
import { TextStyled } from './Typography';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  leftAdornment?: React.ReactNode;
  rightAdornment?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  leftAdornment,
  rightAdornment,
  style,
  onFocus,
  onBlur,
  ...rest
}) => {
  const colors = useThemeColor();
  const [focused, setFocused] = useState(false);

  const lineColor = error
    ? colors.error
    : focused
    ? colors.text
    : colors.border;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <TextStyled variant="eyebrow" color="textSecondary" style={styles.label}>
          {label}
        </TextStyled>
      )}
      <View style={[styles.row, { borderBottomColor: lineColor }]}>
        {leftAdornment ? <View style={styles.adornment}>{leftAdornment}</View> : null}
        <TextInput
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          placeholderTextColor={colors.textMuted}
          style={[
            Type.bodyLg,
            { color: colors.text, paddingVertical: Spacing.md, flex: 1 },
            style,
          ]}
        />
        {rightAdornment ? <View style={styles.adornment}>{rightAdornment}</View> : null}
      </View>
      {error ? (
        <TextStyled variant="caption" color="error" style={{ marginTop: Spacing.xs }}>
          {error}
        </TextStyled>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  label: {
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  adornment: {
    paddingHorizontal: Spacing.xs,
  },
});

/**
 * Botón editorial.
 *
 * Variantes:
 *   - primary  → fondo sólido (acento)
 *   - outline  → solo borde fino
 *   - ghost    → sin fondo ni borde, con underline opcional
 *   - danger   → para acciones destructivas
 */

import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { Radii, Spacing, Type } from '@/src/constants/theme';
import { TextStyled } from './Typography';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading,
  disabled,
  fullWidth = true,
  style,
}) => {
  const colors = useThemeColor();
  const isDisabled = disabled || loading;

  // Tamaños
  const heights: Record<Size, number> = { sm: 40, md: 52, lg: 58 };
  const padX: Record<Size, number> = { sm: 16, md: 20, lg: 24 };

  // Estilos por variante
  let bg = colors.primary;
  let labelColor = colors.primaryText;
  let borderColor = 'transparent';
  let borderWidth = 0;

  if (variant === 'outline') {
    bg = 'transparent';
    labelColor = colors.text;
    borderColor = colors.borderStrong;
    borderWidth = 1;
  } else if (variant === 'ghost') {
    bg = 'transparent';
    labelColor = colors.text;
  } else if (variant === 'danger') {
    bg = 'transparent';
    labelColor = colors.error;
    borderColor = colors.error;
    borderWidth = 1;
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg,
          borderColor,
          borderWidth,
          height: heights[size],
          paddingHorizontal: padX[size],
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={labelColor} />
      ) : (
        <View style={styles.row}>
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={size === 'lg' ? 20 : 18}
              color={labelColor}
              style={{ marginRight: Spacing.sm }}
            />
          )}
          <TextStyled
            style={[Type.button, { color: labelColor }]}
          >
            {label}
          </TextStyled>
          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={size === 'lg' ? 20 : 18}
              color={labelColor}
              style={{ marginLeft: Spacing.sm }}
            />
          )}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

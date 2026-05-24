import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/src/hooks/useThemeColor';

export interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  size?: number;
  variant?: 'plain' | 'surface' | 'outline';
  color?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  size = 22,
  variant = 'plain',
  color,
}) => {
  const colors = useThemeColor();
  const tint = color ?? colors.text;

  const variantStyle =
    variant === 'surface'
      ? { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }
      : variant === 'outline'
      ? { backgroundColor: 'transparent', borderColor: colors.border, borderWidth: 1 }
      : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variantStyle,
        { opacity: pressed ? 0.7 : 1 },
      ]}
      hitSlop={8}
    >
      <Ionicons name={icon} size={size} color={tint} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

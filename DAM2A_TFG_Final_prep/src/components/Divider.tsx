import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { Spacing } from '@/src/constants/theme';

export interface DividerProps {
  vertical?: boolean;
  spacing?: number;
  style?: StyleProp<ViewStyle>;
}

export const Divider: React.FC<DividerProps> = ({ vertical, spacing = Spacing.lg, style }) => {
  const colors = useThemeColor();
  if (vertical) {
    return (
      <View
        style={[
          { width: 1, backgroundColor: colors.border, marginHorizontal: spacing },
          style,
        ]}
      />
    );
  }
  return (
    <View
      style={[
        { height: 1, backgroundColor: colors.border, marginVertical: spacing },
        style,
      ]}
    />
  );
};

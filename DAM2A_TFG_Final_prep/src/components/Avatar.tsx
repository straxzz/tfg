import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { Fonts } from '@/src/constants/theme';
import { TextStyled } from './Typography';

export interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  bordered?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({ uri, name = '', size = 48, bordered = false }) => {
  const colors = useThemeColor();
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const dim = { width: size, height: size, borderRadius: size / 2 };
  const borderProps = bordered ? { borderWidth: 1, borderColor: colors.border } : null;

  if (uri) {
    return <Image source={{ uri }} style={[dim, borderProps]} />;
  }
  return (
    <View
      style={[
        dim,
        styles.fallback,
        { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
        borderProps,
      ]}
    >
      <TextStyled
        style={{
          fontFamily: Fonts.serif,
          fontSize: size * 0.42,
          color: colors.text,
        }}
      >
        {initial}
      </TextStyled>
    </View>
  );
};

const styles = StyleSheet.create({
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
});

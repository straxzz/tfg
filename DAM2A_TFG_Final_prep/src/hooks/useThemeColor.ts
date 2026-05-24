import { Colors } from '@/src/constants/colors';
import { useTheme } from '@/src/context/themeContext';

export function useThemeColor() {
  const { theme } = useTheme(); 
  return Colors[theme];
}
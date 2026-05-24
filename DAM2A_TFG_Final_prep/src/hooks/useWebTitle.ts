import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Platform } from 'react-native';

/**
 * Setea document.title en web cada vez que la pantalla recibe foco.
 * Usa useFocusEffect para que funcione al volver a un tab ya montado.
 */
export function useWebTitle(title: string) {
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'web') {
        document.title = title;
      }
    }, [title]),
  );
}

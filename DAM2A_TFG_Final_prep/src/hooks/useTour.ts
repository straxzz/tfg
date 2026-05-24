/**
 * useTour — gestiona si el tour de una pantalla debe mostrarse.
 *
 * Persiste el flag "visto" en localStorage (web) o en memoria (native).
 * Espera 800 ms tras el montaje para que las animaciones de entrada terminen.
 */
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

// Fallback in-memory para native (se reinicia con la app)
const _seen = new Set<string>();

function _getItem(key: string): boolean {
  if (Platform.OS === 'web') {
    try { return localStorage.getItem(key) === '1'; } catch { return false; }
  }
  return _seen.has(key);
}

function _setItem(key: string): void {
  if (Platform.OS === 'web') {
    try { localStorage.setItem(key, '1'); } catch {}
  } else {
    _seen.add(key);
  }
}

export function useTour(screenKey: string) {
  const storageKey = `vc_tour_${screenKey}`;
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Pequeño delay para que terminen las animaciones de entrada (FadeIn)
    const t = setTimeout(() => {
      if (!_getItem(storageKey)) setShouldShow(true);
    }, 900);
    return () => clearTimeout(t);
  }, [storageKey]);

  const markSeen = useCallback(() => {
    _setItem(storageKey);
    setShouldShow(false);
  }, [storageKey]);

  return { shouldShow, markSeen };
}

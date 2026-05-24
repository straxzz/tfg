/**
 * index.tsx — Router de autenticación.
 *
 * Firebase restaura la sesión de forma asíncrona desde localStorage,
 * por lo que auth.currentUser es null en el primer render síncrono.
 * Usamos onAuthStateChanged para esperar a que Firebase resuelva
 * el estado real y luego enrutamos:
 *
 *   · Sesión activa  → /(tabs)/home
 *   · Sin sesión     → /login
 *
 * El BootSplash (1700 ms) cubre este tiempo de espera, así que
 * el usuario nunca ve un parpadeo.
 */

import { auth } from '@/src/config/firebase';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect } from 'react';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // onAuthStateChanged dispara una vez de forma inmediata con el estado actual
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe(); // Solo necesitamos la primera emisión al arrancar
      router.replace(user ? '/(tabs)/home' : '/login');
    });
    return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null; // El BootSplash cubre la pantalla mientras esto resuelve
}

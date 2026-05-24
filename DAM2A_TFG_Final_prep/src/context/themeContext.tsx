import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { auth, db } from '../config/firebase';


type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: 'light' | 'dark'; // El tema visual final (solo puede ser uno de estos dos)
  userPreference: ThemeType; // La preferencia guardada (puede ser 'system')
  setThemePreference: (pref: ThemeType) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  userPreference: 'system',
  setThemePreference: async () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useColorScheme(); // Detecta si el móvil está en modo noche
  const [userPreference, setUserPreference] = useState<ThemeType>('light'); // Por defecto light para login
  const [user, setUser] = useState<any>(null);

  // 1. Escuchar autenticación
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        // Si no hay usuario (Login), forzamos Light
        setUserPreference('light');
      }
    });
    return () => unsubAuth();
  }, []);

  // 2. Escuchar cambios en la base de datos (SOLO SI HAY USUARIO)
  useEffect(() => {
    if (user) {
      const docRef = doc(db, 'users', user.uid);
      const unsubFirestore = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Si el usuario tiene preferencia guardada, la usamos. Si no, 'system'
          setUserPreference(data.themePreference || 'system');
        }
      });
      return () => unsubFirestore();
    }
  }, [user]);

  // 3. Función para guardar la preferencia
  const setThemePreference = async (pref: ThemeType) => {
    if (user) {
      // Guardamos en Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        themePreference: pref
      });
      // El estado local se actualizará solo gracias al onSnapshot de arriba
    }
  };

  // 4. Calcular el tema final visual
  // Si no hay usuario -> SIEMPRE LIGHT
  // Si hay usuario y es 'system' -> Usamos lo que diga el móvil
  // Si hay usuario y es 'dark'/'light' -> Usamos eso
  const activeTheme = !user 
    ? 'light' 
    : (userPreference === 'system' ? (systemScheme || 'light') : userPreference);

  return (
    <ThemeContext.Provider value={{ theme: activeTheme, userPreference, setThemePreference }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { ThemeProvider, useTheme } from '@/src/context/themeContext';
import { BootSplash } from '@/src/components/BootSplash';

const SPLASH_MIN_DURATION = 1700;

export const unstable_settings = {
  initialRouteName: 'index',
};

function RootLayoutNav() {
  const { theme } = useTheme();
  const [splashVisible, setSplashVisible] = useState(true);
  const [splashMounted, setSplashMounted] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setSplashVisible(false), SPLASH_MIN_DURATION);
    return () => clearTimeout(t);
  }, []);

  return (
    <NavigationThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen
          name="login"
          options={{
            gestureEnabled: false,
            title: 'Iniciar sesión · Virtual Closet',
          }}
        />
        <Stack.Screen name="(tabs)" options={{ title: 'Virtual Closet' }} />
        <Stack.Screen
          name="onboarding"
          options={{
            gestureEnabled: false,
            animation: 'fade',
            title: 'Bienvenida · Virtual Closet',
          }}
        />
        <Stack.Screen
          name="profile-setup"
          options={{
            gestureEnabled: false,
            animation: 'slide_from_bottom',
            title: 'Completa tu perfil · Virtual Closet',
          }}
        />
      </Stack>

      {splashMounted && (
        <BootSplash
          visible={splashVisible}
          onFinished={() => setSplashMounted(false)}
        />
      )}

      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
  );
}
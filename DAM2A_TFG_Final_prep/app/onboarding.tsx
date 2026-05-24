/**
 * Onboarding — flujo de bienvenida para usuarios nuevos.
 *
 * 4 slides con fade + slide-up al entrar. Se muestra solo al registrarse
 * por primera vez (login.tsx redirige aquí tras createUserWithEmailAndPassword
 * o Google sign-up). El botón "EMPEZAR" lleva a /(tabs)/home.
 */

import { useThemeColor } from '@/src/hooks/useThemeColor';
import { useBreakpoint } from '@/src/hooks/useBreakpoint';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {
  Button,
  Display,
  Eyebrow,
  Italic,
  Small,
  TextStyled,
} from '@/src/components';
import { Fonts, Radii, Spacing } from '@/src/constants/theme';
import { Logo } from '@/src/components/Logo';

// ---------------------------------------------------------------------------
// Contenido de los slides
// ---------------------------------------------------------------------------
interface Slide {
  eyebrow: string;
  title: React.ReactNode;
  body: string;
  icon?: keyof typeof Ionicons.glyphMap;
  showLogo?: boolean;
}

const SLIDES: Slide[] = [
  {
    showLogo: true,
    eyebrow: 'BIENVENIDA',
    title: (
      <>
        Tu armario{'\n'}
        <Italic>digital.</Italic>
      </>
    ),
    body: 'Organiza cada prenda, crea outfits y conecta con personas que comparten tu estilo.',
  },
  {
    icon: 'shirt-outline',
    eyebrow: 'PASO 1 · AÑADIR ROPA',
    title: (
      <>
        Añade prendas{'\n'}
        <Italic>en segundos.</Italic>
      </>
    ),
    body: 'Haz una foto y la IA detecta automáticamente la categoría, el color y la marca. Sin esfuerzo.',
  },
  {
    icon: 'sparkles-outline',
    eyebrow: 'PASO 2 · IA + COLOR',
    title: (
      <>
        Outfits con{'\n'}
        <Italic>teoría del color.</Italic>
      </>
    ),
    body: 'Combina prendas de tu armario o de la comunidad siguiendo principios de colorimetría. La IA hace el trabajo.',
  },
  {
    icon: 'people-outline',
    eyebrow: 'PASO 3 · COMUNIDAD',
    title: (
      <>
        Conecta y{'\n'}
        <Italic>descubre.</Italic>
      </>
    ),
    body: 'Sigue a otros, comparte tus looks y compra o vende prendas en el marketplace integrado.',
  },
];

// ---------------------------------------------------------------------------
// Pantalla
// ---------------------------------------------------------------------------
export default function OnboardingScreen() {
  const colors = useThemeColor();
  const { isDesktop } = useBreakpoint();
  const [current, setCurrent] = useState(0);
  const isLast = current === SLIDES.length - 1;

  // Animación de contenido entre slides
  const contentOpacity = useSharedValue(1);
  const contentY       = useSharedValue(0);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const animateToSlide = (next: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    // Fade-out hacia arriba
    contentOpacity.value = withTiming(0, { duration: 180, easing: Easing.in(Easing.ease) });
    contentY.value       = withTiming(-10, { duration: 180, easing: Easing.in(Easing.ease) });

    timerRef.current = setTimeout(() => {
      setCurrent(next);
      // Preparar posición inicial abajo
      contentY.value = 16;
      // Fade-in desde abajo
      contentOpacity.value = withTiming(1, { duration: 340, easing: Easing.out(Easing.cubic) });
      contentY.value       = withTiming(0, { duration: 340, easing: Easing.out(Easing.cubic) });
    }, 200);
  };

  const handleNext = () => {
    if (isLast) {
      router.replace('/(tabs)/home');
    } else {
      animateToSlide(current + 1);
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)/home');
  };

  const contentStyle = useAnimatedStyle(() => ({
    opacity:   contentOpacity.value,
    transform: [{ translateY: contentY.value }],
  }));

  const slide = SLIDES[current];
  const iconSize = isDesktop ? 72 : 56;
  const titleSize = isDesktop ? 50 : 42;
  const titleLine = isDesktop ? 58 : 48;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />

      {/* Botón Omitir — top right */}
      {!isLast && (
        <Pressable
          onPress={handleSkip}
          style={styles.skipBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <TextStyled style={[styles.skipText, { color: colors.textMuted }]}>
            Omitir
          </TextStyled>
        </Pressable>
      )}

      {/* Contenido animado del slide */}
      <View style={[styles.content, isDesktop && styles.contentDesktop]}>
        <Animated.View style={[styles.slideInner, contentStyle]}>
          {/* Icono o Logo */}
          {slide.showLogo ? (
            <View style={[styles.iconWrap, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
              <Logo variant="mark" size={iconSize * 0.7} />
            </View>
          ) : (
            <View style={[styles.iconWrap, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
              <Ionicons name={slide.icon!} size={iconSize * 0.6} color={colors.text} />
            </View>
          )}

          {/* Texto */}
          <View style={styles.textBlock}>
            <Eyebrow style={{ letterSpacing: 2 }}>{slide.eyebrow}</Eyebrow>
            <Display
              style={{
                marginTop: Spacing.md,
                fontSize: titleSize,
                lineHeight: titleLine,
              }}
            >
              {slide.title}
            </Display>
            <Small
              style={{
                marginTop: Spacing.lg,
                color: colors.textSecondary,
                lineHeight: 22,
                maxWidth: 360,
              }}
            >
              {slide.body}
            </Small>
          </View>
        </Animated.View>
      </View>

      {/* Footer: dots + botón */}
      <View style={[styles.footer, isDesktop && styles.footerDesktop]}>
        {/* Dots de progreso */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <Pressable
              key={i}
              onPress={() => i !== current && animateToSlide(i)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: i === current ? colors.text : colors.border,
                    width: i === current ? 20 : 6,
                  },
                ]}
              />
            </Pressable>
          ))}
        </View>

        <Button
          label={isLast ? 'EMPEZAR' : 'SIGUIENTE'}
          onPress={handleNext}
          size="lg"
          icon={isLast ? 'checkmark' : 'arrow-forward'}
          iconPosition="right"
          style={{ marginTop: Spacing.xl }}
        />

        {/* Espaciador para safe-area */}
        <View style={{ height: Spacing['2xl'] }} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Estilos
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  skipBtn: {
    position: 'absolute',
    top: 60,
    right: Spacing['2xl'],
    zIndex: 10,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingTop: 100,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  contentDesktop: {
    paddingTop: 80,
  },
  slideInner: {
    flex: 1,
    justifyContent: 'center',
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: Radii.xl ?? 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  textBlock: {
    maxWidth: 400,
  },
  footer: {
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing.xl,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  footerDesktop: {
    paddingBottom: Spacing['3xl'],
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    height: 20,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});

/**
 * BootSplash — pantalla de carga in-app con animación de marca.
 *
 * Secuencia (~1700 ms):
 *   0  ms  → Anillo: scale 0.7→1 + fade                (400 ms)
 *   50 ms  → V entra girando desde la izquierda        (620 ms, out-cubic)
 *  100 ms  → C entra girando desde la derecha          (620 ms, out-cubic)
 *  680 ms  → Micro-bounce del monograma completo       (260 ms)
 *  920 ms  → Wordmark sube y aparece                   (420 ms)
 * 1200 ms  → Eyebrow aparece                           (380 ms)
 *   0  ms  → Barra de progreso se rellena              (1600 ms)
 */

import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useThemeColor } from '@/src/hooks/useThemeColor';
import { Fonts, Spacing } from '@/src/constants/theme';
import { TextStyled } from './Typography';

export interface BootSplashProps {
  visible: boolean;
  onFinished?: () => void;
}

const SIZE = 110;

export const BootSplash: React.FC<BootSplashProps> = ({ visible, onFinished }) => {
  const colors = useThemeColor();

  // Contenedor general — fade-out al ocultar
  const containerOpacity = useSharedValue(1);

  // Anillo exterior
  const ringOpacity = useSharedValue(0);
  const ringScale   = useSharedValue(0.7);

  // Letra V — entra desde la izquierda con giro
  const vX      = useSharedValue(-SIZE * 0.75);
  const vRotate = useSharedValue(-155);

  // Letra C — entra desde la derecha con giro contrario
  const cX      = useSharedValue(SIZE * 0.75);
  const cRotate = useSharedValue(155);

  // Bounce del monograma completo al juntarse
  const vcScale = useSharedValue(1);

  // Wordmark — sube y aparece
  const wordmarkOpacity = useSharedValue(0);
  const wordmarkY       = useSharedValue(18);

  // Eyebrow
  const eyebrowOpacity = useSharedValue(0);

  // Barra de progreso
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      const eOut = Easing.out(Easing.cubic);

      // Anillo
      ringOpacity.value = withTiming(1, { duration: 400, easing: eOut });
      ringScale.value   = withTiming(1, { duration: 400, easing: eOut });

      // V — desde la izquierda, girando
      vX.value      = withDelay(50,  withTiming(0, { duration: 620, easing: eOut }));
      vRotate.value = withDelay(50,  withTiming(0, { duration: 620, easing: eOut }));

      // C — desde la derecha, girando en sentido contrario
      cX.value      = withDelay(100, withTiming(0, { duration: 620, easing: eOut }));
      cRotate.value = withDelay(100, withTiming(0, { duration: 620, easing: eOut }));

      // Bounce al juntarse
      vcScale.value = withDelay(
        680,
        withSequence(
          withTiming(1.09, { duration: 90,  easing: Easing.out(Easing.ease) }),
          withTiming(0.96, { duration: 90,  easing: Easing.in(Easing.ease)  }),
          withTiming(1,    { duration: 130, easing: Easing.out(Easing.cubic) }),
        ),
      );

      // Wordmark
      wordmarkOpacity.value = withDelay(920,  withTiming(1, { duration: 420, easing: eOut }));
      wordmarkY.value       = withDelay(920,  withTiming(0, { duration: 420, easing: eOut }));

      // Eyebrow
      eyebrowOpacity.value  = withDelay(1200, withTiming(1, { duration: 380, easing: eOut }));

      // Progreso
      progress.value = withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.cubic) });

    } else {
      containerOpacity.value = withTiming(0, {
        duration: 360,
        easing: Easing.in(Easing.ease),
      });
      const t = setTimeout(() => onFinished?.(), 380);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // ── Estilos animados ──────────────────────────────────────────────────────

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity:   ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  const vcScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: vcScale.value }],
  }));

  const vStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: vX.value },
      { rotate: (vRotate.value.toString() + 'deg') as unknown as string },
    ],
  }));

  const cStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: cX.value },
      { rotate: (cRotate.value.toString() + 'deg') as unknown as string },
    ],
  }));

  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity:   wordmarkOpacity.value,
    transform: [{ translateY: wordmarkY.value }],
  }));

  const eyebrowStyle = useAnimatedStyle(() => ({
    opacity: eyebrowOpacity.value,
  }));

  const progressStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
  }));

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[styles.root, { backgroundColor: colors.background }, containerStyle]}
    >
      <View style={styles.center}>

        {/* Monograma VC */}
        <Animated.View style={[{ width: SIZE, height: SIZE }, vcScaleStyle]}>

          {/* Anillo exterior sutil */}
          <Animated.View
            style={[
              styles.ring,
              { borderColor: colors.textMuted, width: SIZE, height: SIZE, borderRadius: SIZE / 2 },
              ringStyle,
            ]}
          />

          {/* C — fondo, color secundario, entra desde la derecha */}
          <Animated.View
            style={[
              styles.letterWrap,
              { left: SIZE * 0.22, top: SIZE * 0.08 },
              cStyle,
            ]}
          >
            <TextStyled
              style={{
                fontFamily: Fonts.serif,
                fontSize:   SIZE * 0.78,
                lineHeight: SIZE * 0.78,
                color:      colors.textMuted,
              }}
            >
              C
            </TextStyled>
          </Animated.View>

          {/* V — frente, color principal, entra desde la izquierda */}
          <Animated.View
            style={[
              styles.letterWrap,
              { left: SIZE * 0.06, top: SIZE * 0.08 },
              vStyle,
            ]}
          >
            <TextStyled
              style={{
                fontFamily: Fonts.serif,
                fontSize:   SIZE * 0.78,
                lineHeight: SIZE * 0.78,
                color:      colors.text,
              }}
            >
              V
            </TextStyled>
          </Animated.View>

        </Animated.View>

        {/* Wordmark */}
        <Animated.View style={[styles.wordmarkWrap, wordmarkStyle]}>
          <View style={styles.wordmarkRow}>
            <TextStyled style={[styles.wordmarkText, { color: colors.text }]}>
              VIRTUAL
            </TextStyled>
            <View style={[styles.wordmarkDivider, { backgroundColor: colors.text }]} />
            <TextStyled style={[styles.wordmarkText, { color: colors.text }]}>
              CLOSET
            </TextStyled>
          </View>
        </Animated.View>

        {/* Eyebrow */}
        <Animated.View style={[styles.eyebrowWrap, eyebrowStyle]}>
          <TextStyled style={[styles.eyebrow, { color: colors.textMuted }]}>
            EST. 2025 — TU ARMARIO DIGITAL
          </TextStyled>
        </Animated.View>

      </View>

      {/* Barra de progreso */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressBg, { backgroundColor: colors.border }]} />
        <Animated.View
          style={[
            styles.progressFill,
            { backgroundColor: colors.text, transformOrigin: 'left center' as any },
            progressStyle,
          ]}
        />
      </View>
    </Animated.View>
  );
};

const { width } = Dimensions.get('window');
const BAR_W = Math.min(width * 0.4, 280);

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    opacity: 0.35,
  },
  letterWrap: {
    position: 'absolute',
  },
  wordmarkWrap: {
    marginTop: SIZE * 0.32,
    alignItems: 'center',
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordmarkText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    letterSpacing: 3,
    fontWeight: '600',
  },
  wordmarkDivider: {
    width: 18,
    height: 1,
    marginHorizontal: 8,
    opacity: 0.4,
  },
  eyebrowWrap: {
    marginTop: Spacing['2xl'],
  },
  eyebrow: {
    fontFamily: Fonts.sans,
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: '500',
  },
  progressTrack: {
    position: 'absolute',
    bottom: Spacing['4xl'],
    left: 0,
    right: 0,
    alignItems: 'center',
    height: 1,
  },
  progressBg: {
    position: 'absolute',
    width: BAR_W,
    height: 1,
    opacity: 0.5,
  },
  progressFill: {
    position: 'absolute',
    width: BAR_W,
    height: 1,
    transform: [{ scaleX: 0 }],
  },
});

/**
 * FadeIn — wrapper animado que hace fade + slide-up al montar.
 *
 * Uso:
 *   <FadeIn delay={120}>
 *     <MiComponente />
 *   </FadeIn>
 *
 * Props:
 *   delay    — ms de espera antes de iniciar (para stagger), default 0
 *   duration — duración de la animación en ms, default 480
 *   fromY    — desplazamiento vertical inicial (px), default 14
 */

import React, { useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  fromY?: number;
  style?: StyleProp<ViewStyle>;
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  duration = 480,
  fromY = 14,
  style,
}) => {
  const opacity    = useSharedValue(0);
  const translateY = useSharedValue(fromY);

  useEffect(() => {
    const cfg = { duration, easing: Easing.out(Easing.cubic) };
    opacity.value    = withDelay(delay, withTiming(1, cfg));
    translateY.value = withDelay(delay, withTiming(0, cfg));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[animStyle, style]}>
      {children}
    </Animated.View>
  );
};

/**
 * TourOverlay — spotlight interactivo para el tour de primera visita.
 *
 * Si `ref` de un paso es null o el elemento no está montado (p.ej. sección
 * vacía para usuario nuevo), muestra la tarjeta centrada sin spotlight.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { Fonts, Spacing } from '@/src/constants/theme';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { Small } from './Typography';

export interface TourStep {
  /** Ref al elemento a resaltar. Si es null/undefined → overlay sin spotlight. */
  ref?: React.RefObject<View | null>;
  title: string;
  body: string;
  pad?: number;
}

interface Props {
  steps: TourStep[];
  onSkip: () => void;
  onDone: () => void;
}

interface Rect { x: number; y: number; w: number; h: number }

const MAX_RETRIES = 6;

export const TourOverlay: React.FC<Props> = ({ steps, onSkip, onDone }) => {
  const colors = useThemeColor();
  const [current, setCurrent] = useState(0);
  const [rect, setRect]   = useState<Rect | null>(null);
  const fadeCard = useRef(new Animated.Value(0)).current;
  const retries  = useRef(0);

  const step  = steps[current];
  const PAD   = step.pad ?? 12;
  const isLast = current === steps.length - 1;
  const { width: SW, height: SH } = Dimensions.get('window');

  // Mide el elemento del paso actual; si no hay ref o falla → rect = null (sin spotlight)
  useEffect(() => {
    fadeCard.setValue(0);
    setRect(null);
    retries.current = 0;

    if (!step.ref) {
      // Sin ref → mostrar directamente sin spotlight
      Animated.timing(fadeCard, { toValue: 1, duration: 260, useNativeDriver: true }).start();
      return;
    }

    const tryMeasure = () => {
      const node = step.ref!.current as any;
      if (!node) {
        // Nodo no montado → mostrar sin spotlight
        Animated.timing(fadeCard, { toValue: 1, duration: 260, useNativeDriver: true }).start();
        return;
      }
      node.measureInWindow((x: number, y: number, w: number, h: number) => {
        if ((w === 0 && h === 0) && retries.current < MAX_RETRIES) {
          retries.current += 1;
          setTimeout(tryMeasure, 150);
          return;
        }
        if (w > 0 && h > 0) setRect({ x, y, w, h });
        // Si sigue siendo 0×0 tras reintentos → sin spotlight (rect = null)
        Animated.timing(fadeCard, { toValue: 1, duration: 260, useNativeDriver: true }).start();
      });
    };

    const t = setTimeout(tryMeasure, 80);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const handleNext = () => {
    if (isLast) { onDone(); return; }
    setCurrent(c => c + 1);
  };

  const tooltipBelow = rect ? (rect.y + rect.h / 2) < SH * 0.5 : false;
  const tooltipPos   = rect
    ? (tooltipBelow
        ? { top: Math.min(rect.y + rect.h + PAD + 16, SH - 220) }
        : { bottom: Math.max(SH - (rect.y - PAD - 16), 20) })
    : { top: SH * 0.38 }; // centrado si no hay spotlight

  return (
    <Modal transparent animationType="fade" visible statusBarTranslucent onRequestClose={onSkip}>

      {/* ── Spotlight (4 rectángulos) o overlay completo ── */}
      {rect ? (
        <>
          <View style={[s.dark, { top: 0, left: 0, right: 0, height: Math.max(0, rect.y - PAD) }]} />
          <View style={[s.dark, { top: rect.y + rect.h + PAD, left: 0, right: 0, bottom: 0 }]} />
          <View style={[s.dark, { top: rect.y - PAD, left: 0, width: Math.max(0, rect.x - PAD), height: rect.h + PAD * 2 }]} />
          <View style={[s.dark, { top: rect.y - PAD, left: rect.x + rect.w + PAD, right: 0, height: rect.h + PAD * 2 }]} />
          <View style={{
            position: 'absolute',
            top: rect.y - PAD, left: rect.x - PAD,
            width: rect.w + PAD * 2, height: rect.h + PAD * 2,
            borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)',
          }} />
        </>
      ) : (
        // Sin elemento medible → overlay completo, tarjeta centrada
        <View style={[s.dark, StyleSheet.absoluteFillObject]} />
      )}

      {/* ── Tarjeta del globo ── */}
      <Animated.View style={[
        s.card, tooltipPos,
        { backgroundColor: colors.background, borderColor: colors.border, opacity: fadeCard },
      ]}>
        {/* Flecha solo si hay spotlight */}
        {rect && (
          <>
            <View style={[s.arrow, tooltipBelow ? [s.arrowUp,   { borderBottomColor: colors.border }]
                                                 : [s.arrowDown, { borderTopColor:    colors.border }]]} />
            <View style={[s.arrowInner, tooltipBelow ? [s.arrowUpInner,   { borderBottomColor: colors.background }]
                                                      : [s.arrowDownInner, { borderTopColor:    colors.background }]]} />
          </>
        )}

        {/* Puntos de progreso */}
        <View style={s.dots}>
          {steps.map((_, i) => (
            <View key={i} style={[s.dot, {
              backgroundColor: i === current ? colors.text : colors.border,
              width: i === current ? 18 : 6,
            }]} />
          ))}
        </View>

        <Small style={[s.title, { color: colors.text, fontFamily: Fonts.serif }]}>
          {step.title}
        </Small>
        <Small style={[s.body, { color: colors.textSecondary }]}>
          {step.body}
        </Small>

        <View style={s.row}>
          <Pressable onPress={onSkip} hitSlop={8}>
            <Small style={{ color: colors.textMuted }}>Omitir</Small>
          </Pressable>
          <Pressable onPress={handleNext} style={[s.nextBtn, { backgroundColor: colors.text }]}>
            <Small style={{ color: colors.primaryText, fontFamily: Fonts.sans, fontWeight: '600', letterSpacing: 0.5 }}>
              {isLast ? 'Mi perfil →' : 'Siguiente →'}
            </Small>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
};

const s = StyleSheet.create({
  dark: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.72)' },
  card: {
    position: 'absolute', left: 20, right: 20,
    borderRadius: 14, padding: 20, borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.18,
    shadowRadius: 20, shadowOffset: { width: 0, height: 6 }, elevation: 12,
  },
  dots: { flexDirection: 'row', gap: 5, marginBottom: Spacing.md },
  dot:  { height: 6, borderRadius: 3 },
  title: { fontSize: 17, lineHeight: 24, marginBottom: Spacing.sm },
  body:  { lineHeight: 20, marginBottom: Spacing.xl },
  row:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nextBtn: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 2, borderRadius: 20 },
  arrow:      { position: 'absolute', left: 28, width: 0, height: 0, borderLeftWidth: 9, borderRightWidth: 9, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  arrowUp:    { top: -9,    borderBottomWidth: 9 },
  arrowDown:  { bottom: -9, borderTopWidth: 9 },
  arrowInner: { position: 'absolute', left: 29, width: 0, height: 0, borderLeftWidth: 8, borderRightWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  arrowUpInner:   { top: -7,    borderBottomWidth: 8 },
  arrowDownInner: { bottom: -7, borderTopWidth: 8 },
});

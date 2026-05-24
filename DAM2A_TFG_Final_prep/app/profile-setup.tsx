/**
 * profile-setup.tsx — Completar perfil personal (primera visita).
 */

import { auth } from '@/src/config/firebase';
import { updateUser } from '@/src/service/userService';
import type { Gender, StyleTag } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import {
  Button,
  Caption,
  Display,
  Eyebrow,
  Italic,
  Page,
  Small,
  TextStyled,
} from '@/src/components';
import { Fonts, Radii, Spacing } from '@/src/constants/theme';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { useWebTitle } from '@/src/hooks/useWebTitle';

// ─── Opciones ────────────────────────────────────────────────────────────────

const GENDER_OPTIONS: { key: Gender; label: string }[] = [
  { key: 'woman',             label: 'Mujer'              },
  { key: 'man',               label: 'Hombre'             },
  { key: 'prefer_not_to_say', label: 'Prefiero no decir'  },
];

const STYLE_OPTIONS: StyleTag[] = [
  'Casual', 'Formal', 'Deportivo', 'Elegante',
  'Bohemio', 'Minimalista', 'Vintage', 'Streetwear',
];

// ─── Componente ──────────────────────────────────────────────────────────────

export default function ProfileSetupScreen() {
  const colors = useThemeColor();
  useWebTitle('Completa tu perfil · Virtual Closet');

  const [gender,  setGender]  = useState<Gender | null>(null);
  const [height,  setHeight]  = useState('');
  const [weight,  setWeight]  = useState('');
  const [styleSel, setStyleSel] = useState<StyleTag[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleStyle = (tag: StyleTag) =>
    setStyleSel(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag],
    );

  const handleSave = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) { router.replace('/(tabs)/home'); return; }
    setLoading(true);
    try {
      const patch: Record<string, unknown> = { profileCompleted: true };
      if (gender)             patch.gender    = gender;
      if (height.trim())      patch.heightCm  = Number(height.trim());
      if (weight.trim())      patch.weightKg  = Number(weight.trim());
      if (styleSel.length)    patch.styleTags = styleSel;
      await updateUser(uid, patch as any);
    } catch (e) {
      console.error('[PROFILE-SETUP]', e);
    } finally {
      setLoading(false);
      router.replace('/(tabs)/home');
    }
  };

  const handleSkip = () => {
    const uid = auth.currentUser?.uid;
    if (uid) updateUser(uid, { profileCompleted: true } as any).catch(() => {});
    router.replace('/(tabs)/home');
  };

  return (
    <Page keyboardAvoiding topOffset={Spacing['4xl']} contentStyle={{ maxWidth: 520 }}>

      {/* ── Cabecera ── */}
      <Eyebrow style={{ marginBottom: Spacing.sm }}>PERSONALIZACIÓN</Eyebrow>
      <Display style={{ marginBottom: Spacing.base }}>
        Cuéntanos{'\n'}
        <Italic>sobre ti.</Italic>
      </Display>
      <Small style={{ color: colors.textSecondary, marginBottom: Spacing['3xl'] }}>
        Ayuda a la IA a recomendarte outfits a tu medida.{'\n'}Todo es completamente opcional.
      </Small>

      {/* ── Género ── */}
      <Block label="GÉNERO">
        <View style={s.genderRow}>
          {GENDER_OPTIONS.map(opt => {
            const active = gender === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => setGender(active ? null : opt.key)}
                style={({ pressed }) => [
                  s.genderBtn,
                  {
                    borderColor:     active ? colors.text : colors.border,
                    backgroundColor: active ? colors.text : colors.backgroundSecondary,
                    flex: 1,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                {active && (
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={colors.primaryText}
                    style={{ marginBottom: 4 }}
                  />
                )}
                <Small
                  style={{
                    color: active ? colors.primaryText : colors.textSecondary,
                    textAlign: 'center',
                    fontFamily: Fonts.sans,
                    fontWeight: active ? '600' : '400',
                  }}
                >
                  {opt.label}
                </Small>
              </Pressable>
            );
          })}
        </View>
      </Block>

      {/* ── Medidas ── */}
      <Block label="MEDIDAS (OPCIONAL)">
        <View style={s.measuresRow}>
          <MeasureInput
            label="Altura (cm)"
            placeholder="170"
            value={height}
            onChangeText={v => setHeight(v.replace(/[^0-9]/g, ''))}
            colors={colors}
          />
          <View style={{ width: Spacing.lg }} />
          <MeasureInput
            label="Peso (kg)"
            placeholder="60"
            value={weight}
            onChangeText={v => setWeight(v.replace(/[^0-9]/g, ''))}
            colors={colors}
          />
        </View>
        <Caption style={{ color: colors.textMuted, marginTop: Spacing.sm }}>
          Solo para ajustar recomendaciones de tallas y siluetas.
        </Caption>
      </Block>

      {/* ── Estilo ── */}
      <Block label="MI ESTILO (ELIGE VARIOS)">
        <View style={s.tagsWrap}>
          {STYLE_OPTIONS.map(tag => {
            const active = styleSel.includes(tag);
            return (
              <Pressable
                key={tag}
                onPress={() => toggleStyle(tag)}
                style={({ pressed }) => [
                  s.tagChip,
                  {
                    borderColor:     active ? colors.text : colors.border,
                    backgroundColor: active ? colors.text : colors.backgroundSecondary,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                {/* Espacio fijo para el tick: evita que la chip cambie de tamaño */}
                <View style={{ width: 18, alignItems: 'center' }}>
                  {active && (
                    <Ionicons name="checkmark" size={13} color={colors.primaryText} />
                  )}
                </View>
                <TextStyled
                  style={{
                    fontSize: 13,
                    fontFamily: Fonts.sans,
                    fontWeight: active ? '600' : '400',
                    color: active ? colors.primaryText : colors.textSecondary,
                  }}
                >
                  {tag}
                </TextStyled>
              </Pressable>
            );
          })}
        </View>
      </Block>

      {/* ── Botones ── */}
      <View style={{ height: Spacing['2xl'] }} />
      <Button
        label="GUARDAR Y EMPEZAR"
        onPress={handleSave}
        loading={loading}
        size="lg"
        icon="arrow-forward"
        iconPosition="right"
      />
      <Pressable onPress={handleSkip} style={s.skipBtn}>
        <Small style={{ color: colors.textMuted }}>Completar más tarde</Small>
      </Pressable>

    </Page>
  );
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: Spacing['2xl'] }}>
      <Eyebrow style={{ marginBottom: Spacing.md }}>{label}</Eyebrow>
      {children}
    </View>
  );
}

function MeasureInput({
  label, placeholder, value, onChangeText, colors,
}: {
  label: string; placeholder: string; value: string;
  onChangeText: (v: string) => void; colors: any;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Caption style={{ color: colors.textMuted, marginBottom: Spacing.xs }}>{label}</Caption>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        maxLength={3}
        style={{
          borderWidth: 1,
          borderRadius: Radii.sm,
          borderColor: colors.border,
          backgroundColor: colors.backgroundSecondary,
          color: colors.text,
          fontFamily: Fonts.sans,
          fontSize: 16,
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.md,
          textAlign: 'center',
        }}
      />
    </View>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  genderRow: {
    flexDirection: 'row',
    columnGap: 10,
  },
  genderBtn: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radii.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 68,
  },
  measuresRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 8,
    columnGap: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  skipBtn: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing['2xl'],
    paddingVertical: Spacing.sm,
  },
});

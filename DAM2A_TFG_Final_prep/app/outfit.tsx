import { useThemeColor } from '@/src/hooks/useThemeColor';
import { useWebTitle } from '@/src/hooks/useWebTitle';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { auth } from '@/src/config/firebase';
import { getDetailedOutfitSuggestion, OutfitCandidate, OutfitResult } from '@/src/service/aiService';
import { getClothes } from '@/src/service/clothingService';
import { getAvailableListings } from '@/src/service/marketplaceService';
import { getUser } from '@/src/service/userService';
import { UserData } from '@/src/types';
import { GARMENT_COLORS } from '@/src/utils/colorimetry';
import {
  Button,
  Eyebrow,
  H1,
  Page,
  Section,
  Small,
  TextStyled,
} from '@/src/components';
import { Radii, Spacing } from '@/src/constants/theme';

type Mode = 'wardrobe' | 'marketplace';

export default function OutfitScreen() {
  const colors = useThemeColor();
  useWebTitle('Crear outfit · Virtual Closet');
  const user = auth.currentUser;

  const [mode, setMode] = useState<Mode>('wardrobe');
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<OutfitCandidate[]>([]);
  const [result, setResult] = useState<OutfitResult | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);

  // Cargar perfil del usuario una vez al montar para pasarlo a la IA
  React.useEffect(() => {
    if (user) {
      getUser(user.uid).then(setUserData).catch(() => {});
    }
  }, [user?.uid]);

  const selectedItems = result
    ? candidates.filter((c) => result.selectedIds.includes(c.id))
    : [];

  const handleGenerate = async () => {
    if (!user) return;
    setLoading(true);
    setResult(null);
    try {
      let items: OutfitCandidate[] = [];

      if (mode === 'wardrobe') {
        const clothes = await getClothes(user.uid);
        items = clothes.map((c) => ({
          id: c.id,
          name: c.name,
          category: c.category,
          color: c.color,
          size: c.size,
          sourceType: 'wardrobe' as const,
          sourceLabel: 'Tu armario',
          image: c.image,
        }));
      } else {
        const listings = await getAvailableListings(user.uid);
        items = listings.map((l) => ({
          id: l.id,
          name: l.name,
          category: l.category,
          sourceType: 'marketplace' as const,
          sourceLabel: `De ${l.sellerName}`,
          image: l.image,
        }));
      }

      if (items.length < 2) {
        Alert.alert(
          'Pocas prendas',
          mode === 'wardrobe'
            ? 'Añade al menos 2 prendas a tu armario para generar un outfit.'
            : 'No hay suficientes prendas disponibles en la tienda ahora mismo.',
        );
        setLoading(false);
        return;
      }

      setCandidates(items);
      const outfitResult = await getDetailedOutfitSuggestion(items, userData);

      if (outfitResult.selectedIds.length === 0) {
        Alert.alert('Sin resultado', 'La IA no pudo generar un outfit. Intentalo de nuevo.');
      } else {
        setResult(outfitResult);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'No se pudo generar el outfit.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Page scrollable>
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
          <View>
            <Eyebrow>IA · TEORÍA DEL COLOR</Eyebrow>
            <H1>Crear outfit</H1>
          </View>
        </View>

        {/* Mode selector */}
        <Section eyebrow="FUENTE DE PRENDAS" spacing={Spacing['2xl']}>
          <View style={styles.modeRow}>
            <Pressable
              style={[
                styles.modeBtn,
                {
                  backgroundColor: mode === 'wardrobe' ? colors.primary : colors.backgroundSecondary,
                  borderColor: mode === 'wardrobe' ? colors.primary : colors.border,
                },
              ]}
              onPress={() => { setMode('wardrobe'); setResult(null); }}
            >
              <Ionicons
                name="shirt-outline"
                size={18}
                color={mode === 'wardrobe' ? colors.primaryText : colors.textSecondary}
              />
              <TextStyled
                variant="smallMedium"
                style={{
                  color: mode === 'wardrobe' ? colors.primaryText : colors.textSecondary,
                  marginLeft: Spacing.sm,
                  letterSpacing: 0.8,
                }}
              >
                MI ARMARIO
              </TextStyled>
            </Pressable>

            <Pressable
              style={[
                styles.modeBtn,
                {
                  backgroundColor: mode === 'marketplace' ? colors.primary : colors.backgroundSecondary,
                  borderColor: mode === 'marketplace' ? colors.primary : colors.border,
                  marginLeft: Spacing.md,
                },
              ]}
              onPress={() => { setMode('marketplace'); setResult(null); }}
            >
              <Ionicons
                name="storefront-outline"
                size={18}
                color={mode === 'marketplace' ? colors.primaryText : colors.textSecondary}
              />
              <TextStyled
                variant="smallMedium"
                style={{
                  color: mode === 'marketplace' ? colors.primaryText : colors.textSecondary,
                  marginLeft: Spacing.sm,
                  letterSpacing: 0.8,
                }}
              >
                TIENDA/COMUNIDAD
              </TextStyled>
            </Pressable>
          </View>

          <Small style={{ color: colors.textMuted, marginTop: Spacing.md }}>
            {mode === 'wardrobe'
              ? 'La IA elige prendas de tu armario y las combina usando teoría del color.'
              : 'La IA elige prendas disponibles en la tienda y te indica de quién son.'}
          </Small>
        </Section>

        {/* Generate button */}
        <Button
          label={loading ? 'ANALIZANDO COMBINACIONES...' : 'GENERAR OUTFIT CON IA'}
          onPress={handleGenerate}
          loading={loading}
          style={{ marginBottom: Spacing['2xl'] }}
        />

        {/* Loading */}
        {loading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.text} />
            <Small style={{ color: colors.textMuted, marginTop: Spacing.md, textAlign: 'center' }}>
              Analizando colores y combinaciones...
            </Small>
          </View>
        )}

        {/* Results */}
        {!loading && result && selectedItems.length > 0 && (
          <Section eyebrow="OUTFIT SUGERIDO" spacing={0}>
            {/* Description */}
            <View
              style={[
                styles.descriptionBox,
                { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
              ]}
            >
              <Ionicons name="sparkles-outline" size={16} color={colors.textMuted} />
              <Small style={{ color: colors.textSecondary, marginLeft: Spacing.sm, flex: 1 }}>
                {result.description}
              </Small>
            </View>

            {/* Item cards */}
            {selectedItems.map((item) => {
              const colorDef = item.color
                ? GARMENT_COLORS.find((c) => c.id === item.color)
                : null;

              return (
                <View
                  key={item.id}
                  style={[
                    styles.card,
                    { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
                  ]}
                >
                  <Image
                    source={{ uri: item.image }}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                  <View style={styles.cardInfo}>
                    <TextStyled variant="bodyMedium" style={{ color: colors.text }}>
                      {item.name}
                    </TextStyled>
                    <Small style={{ color: colors.textMuted, marginTop: 2 }}>
                      {item.category}
                      {colorDef ? ` · ${colorDef.name}` : ''}
                      {item.size ? ` · ${item.size}` : ''}
                    </Small>
                    {/* Source badge */}
                    <View
                      style={[
                        styles.sourceBadge,
                        {
                          backgroundColor:
                            item.sourceType === 'wardrobe'
                              ? colors.backgroundSecondary
                              : colors.backgroundSecondary,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          item.sourceType === 'wardrobe' ? 'shirt-outline' : 'storefront-outline'
                        }
                        size={11}
                        color={colors.textMuted}
                      />
                      <Small
                        style={{
                          color: colors.textMuted,
                          marginLeft: 4,
                          fontSize: 10,
                          letterSpacing: 0.5,
                        }}
                      >
                        {item.sourceLabel.toUpperCase()}
                      </Small>
                    </View>

                    {/* Color swatch */}
                    {colorDef && (
                      <View style={styles.colorRow}>
                        <View
                          style={[
                            styles.colorDot,
                            { backgroundColor: colorDef.hex, borderColor: colors.border },
                          ]}
                        />
                      </View>
                    )}
                  </View>
                </View>
              );
            })}

            {/* Regenerate */}
            <Button
              label="GENERAR OTRO OUTFIT"
              variant="outline"
              onPress={handleGenerate}
              style={{ marginTop: Spacing.xl }}
            />
          </Section>
        )}
      </Page>
    </>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing['2xl'],
    gap: Spacing.lg,
  },
  backBtn: {
    paddingTop: 6,
  },
  modeRow: {
    flexDirection: 'row',
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.sm,
    borderWidth: 1,
  },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  descriptionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: Radii.sm,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  card: {
    flexDirection: 'row',
    borderRadius: Radii.md,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  cardImage: {
    width: 110,
    height: 110,
  },
  cardInfo: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'center',
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: Radii.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    marginTop: Spacing.sm,
  },
  colorRow: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
  },
});

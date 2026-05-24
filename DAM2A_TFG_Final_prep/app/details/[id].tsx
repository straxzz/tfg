import { useThemeColor } from '@/src/hooks/useThemeColor';
import { useWebTitle } from '@/src/hooks/useWebTitle';
import { useBreakpoint } from '@/src/hooks/useBreakpoint';
import { deleteClothing, getClothingById } from '@/src/service/clothingService';
import { ClothingItem } from '@/src/types';
import { getColorById, getPairings } from '@/src/utils/colorimetry';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import {
  Button,
  Caption,
  Divider,
  Eyebrow,
  IconButton,
  Small,
  TextStyled,
} from '@/src/components';
import { Fonts, Layout, Spacing } from '@/src/constants/theme';

export default function DetailScreen() {
  const { id, readOnly } = useLocalSearchParams();
  const isReadOnly = readOnly === 'true';
  const colors = useThemeColor();
  const { isDesktop, contentMaxWidth, screenPadding, width } = useBreakpoint();
  const [item, setItem] = useState<ClothingItem | null>(null);
  useWebTitle(item ? `${item.name} · Virtual Closet` : 'Prenda · Virtual Closet');
  const [loading, setLoading] = useState(true);

  const heroHeight = isDesktop ? 560 : Math.min(width, 480) * 1.1;
  const heroWidthDesktop = Math.min(540, contentMaxWidth * 0.5);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const data = await getClothingById(id as string);
        if (data) setItem(data);
        else {
          Alert.alert('Error', 'La prenda no existe');
          router.back();
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  const handleDelete = async () => {
    Alert.alert('Eliminar prenda', 'Seguro? Esta accion no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            await deleteClothing(id as string, item!.image);
            router.replace('/wardrobe');
          } catch {
            Alert.alert('Error', 'No se pudo eliminar.');
            setLoading(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <ActivityIndicator size="small" color={colors.text} />
      </View>
    );
  }

  if (!item) return null;

  const date = item.createdAt?.toDate?.()?.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // Colorimetry data
  const itemColor = item.color ? getColorById(item.color) : null;
  const pairingColors = item.color ? getPairings(item.color) : [];

  const ColorimetryBlock = itemColor ? (
    <View style={{ marginTop: Spacing['2xl'] }}>
      <Divider spacing={0} />
      <View style={{ marginTop: Spacing.xl }}>
        <Eyebrow style={{ marginBottom: Spacing.md }}>COLORIMETRIA</Eyebrow>
        <Small style={{ color: colors.textSecondary, marginBottom: Spacing.lg }}>
          Combinaciones recomendadas para esta prenda.
        </Small>

        {/* Current color */}
        <View style={styles.colorRow}>
          <View style={[styles.colorDot, { backgroundColor: itemColor.hex, borderColor: colors.border }]} />
          <View>
            <Caption>COLOR DE LA PRENDA</Caption>
            <TextStyled variant="bodyMedium" style={{ color: colors.text }}>
              {itemColor.name}
            </TextStyled>
          </View>
        </View>

        {/* Pairings */}
        {pairingColors.length > 0 && (
          <View style={{ marginTop: Spacing.lg }}>
            <Caption style={{ marginBottom: Spacing.md }}>COMBINA CON</Caption>
            <View style={styles.swatchRow}>
              {pairingColors.map((pc) => (
                <View key={pc.id} style={styles.swatchItem}>
                  <View
                    style={[
                      styles.swatch,
                      {
                        backgroundColor: pc.hex,
                        borderColor: colors.border,
                      },
                    ]}
                  />
                  <TextStyled
                    style={{
                      fontSize: 10,
                      color: colors.textMuted,
                      marginTop: 4,
                      textAlign: 'center',
                      fontFamily: Fonts.sans,
                      letterSpacing: 0.5,
                    }}
                    numberOfLines={1}
                  >
                    {pc.name.toUpperCase()}
                  </TextStyled>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  ) : null;

  const InfoBlock = (
    <View
      style={{
        paddingHorizontal: isDesktop ? 0 : screenPadding,
        paddingTop: isDesktop ? 0 : Spacing['2xl'],
        flex: 1,
      }}
    >
      <Eyebrow>{item.category?.toUpperCase()}</Eyebrow>
      <TextStyled
        style={{
          fontFamily: Fonts.serif,
          fontSize: isDesktop ? 44 : 38,
          lineHeight: isDesktop ? 50 : 44,
          color: colors.text,
          marginTop: Spacing.sm,
        }}
      >
        {item.name}
      </TextStyled>

      {item.brand ? (
        <TextStyled
          style={{
            fontFamily: Fonts.serifItalic,
            fontStyle: 'italic',
            fontSize: 17,
            color: colors.textSecondary,
            marginTop: Spacing.xs,
          }}
        >
          {item.brand}
        </TextStyled>
      ) : null}

      <Divider spacing={Spacing.xl} />

      <View>
        <View style={[styles.specRow, { borderBottomColor: colors.border }]}>
          <Caption style={{ flex: 1 }}>CATEGORIA</Caption>
          <TextStyled variant="bodyMedium" style={{ color: colors.text }}>
            {item.category}
          </TextStyled>
        </View>

        {item.size ? (
          <View style={[styles.specRow, { borderBottomColor: colors.border }]}>
            <Caption style={{ flex: 1 }}>TALLA</Caption>
            <TextStyled variant="bodyMedium" style={{ color: colors.text }}>
              {item.size}
            </TextStyled>
          </View>
        ) : null}

        {item.brand ? (
          <View style={[styles.specRow, { borderBottomColor: colors.border }]}>
            <Caption style={{ flex: 1 }}>MARCA</Caption>
            <TextStyled variant="bodyMedium" style={{ color: colors.text }}>
              {item.brand}
            </TextStyled>
          </View>
        ) : null}

        {item.price != null ? (
          <View style={[styles.specRow, { borderBottomColor: colors.border }]}>
            <Caption style={{ flex: 1 }}>PRECIO</Caption>
            <TextStyled variant="bodyMedium" style={{ color: colors.text }}>
              {Number.isInteger(item.price)
                ? `${item.price} €`
                : `${item.price.toFixed(2)} €`}
            </TextStyled>
          </View>
        ) : null}

        {date ? (
          <View style={[styles.specRow, { borderBottomColor: colors.border }]}>
            <Caption style={{ flex: 1 }}>ANADIDO EL</Caption>
            <TextStyled variant="bodyMedium" style={{ color: colors.text }}>
              {date}
            </TextStyled>
          </View>
        ) : null}
      </View>

      {ColorimetryBlock}

      {!isReadOnly && (
        <View style={{ marginTop: Spacing['2xl'] }}>
          <Button
            label="EDITAR PRENDA"
            icon="create-outline"
            size="lg"
            onPress={() =>
              router.push({ pathname: '/edit/[id]', params: { id: id as string } })
            }
          />
          <View style={{ height: Spacing.md }} />
          <Button
            label="ELIMINAR"
            variant="danger"
            icon="trash-outline"
            size="lg"
            onPress={handleDelete}
          />
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: item ? `${item.name} · Virtual Closet` : 'Prenda · Virtual Closet' }} />
      <View style={styles.backFloating}>
        <View style={{ backgroundColor: colors.background, borderRadius: 22 }}>
          <IconButton
            icon="arrow-back"
            onPress={() => router.back()}
            variant="surface"
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Spacing['4xl'],
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: contentMaxWidth,
            flexDirection: isDesktop ? 'row' : 'column',
            paddingHorizontal: isDesktop ? screenPadding : 0,
            paddingTop: isDesktop ? Layout.headerTopOffset : 0,
            alignItems: 'flex-start',
          }}
        >
          <View
            style={[
              styles.hero,
              {
                width: isDesktop ? heroWidthDesktop : '100%',
                height: heroHeight,
                backgroundColor: colors.backgroundSecondary,
              },
            ]}
          >
            <Image source={{ uri: item.image }} style={styles.heroImage} />
          </View>

          {isDesktop && <View style={{ width: Spacing['3xl'] }} />}

          {InfoBlock}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backFloating: {
    position: 'absolute',
    top: Layout.headerTopOffset,
    left: Layout.screenPadding,
    zIndex: 10,
  },
  hero: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  swatchItem: {
    alignItems: 'center',
    width: 52,
  },
  swatch: {
    width: 52,
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
  },
});

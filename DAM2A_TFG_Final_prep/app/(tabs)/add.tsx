import { useThemeColor } from '@/src/hooks/useThemeColor';
import { useWebTitle } from '@/src/hooks/useWebTitle';
import { useBreakpoint } from '@/src/hooks/useBreakpoint';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { auth } from '@/src/config/firebase';
import { addClothing } from '@/src/service/clothingService';
import { ClothingCategory } from '@/src/types';
import { GARMENT_COLORS, getContrastText } from '@/src/utils/colorimetry';
import { analyzeClothing } from '@/src/service/aiService';

import {
  Button,
  Chip,
  Eyebrow,
  H1,
  Input,
  Italic,
  Page,
  Section,
  Small,
  TextStyled,
} from '@/src/components';
import { Radii, Spacing } from '@/src/constants/theme';

const CATEGORIES = [
  'Camisetas',
  'Pantalones',
  'Zapatos',
  'Sudaderas',
  'Chaquetas',
  'Accesorios',
  'Otros',
];

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'ÚNICA'];

export default function AddScreen() {
  const colors = useThemeColor();
  useWebTitle('Añadir prenda · Virtual Closet');
  const { isDesktop } = useBreakpoint();
  const user = auth.currentUser;

  const [image, setImage] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ClothingCategory | ''>('');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCooldown, setAiCooldown] = useState(false);
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
    };
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted')
      return Alert.alert('Permiso', 'Necesitamos acceso a la camara');
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handleAnalyze = async () => {
    if (!image || aiLoading || aiCooldown) return;
    setAiLoading(true);
    try {
      const result = await analyzeClothing(image);
      if (result.name) setName(result.name);
      if (result.brand) setBrand(result.brand);
      if (result.category) setSelectedCategory(result.category as ClothingCategory);
      if (result.color) setSelectedColor(result.color);
    } catch (err: any) {
      Alert.alert('Error de IA', err.message ?? 'No se pudo analizar la imagen.');
    } finally {
      setAiLoading(false);
      setAiCooldown(true);
      cooldownTimer.current = setTimeout(() => setAiCooldown(false), 10000);
    }
  };

  const handleClear = () => {
    setImage(null);
    setName('');
    setBrand('');
    setSelectedCategory('');
    setSelectedColor(null);
    setSelectedSize(null);
    setPrice('');
    setAiCooldown(false);
    if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
  };

  const handleSave = async () => {
    if (!image || !name || !selectedCategory)
      return Alert.alert('Faltan datos', 'Completa la foto, el nombre y la categoria.');
    if (!user) return Alert.alert('Error', 'No hay usuario.');

    setLoading(true);
    try {
      const parsedPrice = price.trim() ? parseFloat(price.replace(',', '.')) : undefined;
      if (parsedPrice !== undefined && isNaN(parsedPrice)) {
        return Alert.alert('Precio no válido', 'Introduce un número. Ejemplo: 29,95');
      }
      await addClothing(
        {
          name,
          brand,
          category: selectedCategory,
          imageUri: image,
          price: parsedPrice,
          color: selectedColor ?? undefined,
          size: selectedSize ?? undefined,
        },
        user.uid,
        image
      );
      Alert.alert('Listo', 'Prenda anadida al armario.');
      setImage(null);
      setName('');
      setBrand('');
      setSelectedCategory('');
      setSelectedColor(null);
      setSelectedSize(null);
      setPrice('');
      router.navigate('/wardrobe');
    } catch (error: any) {
      console.error('ERROR:', error);
      Alert.alert('Error', error.message || 'Fallo la subida');
    } finally {
      setLoading(false);
    }
  };

  const ImageBlock = (
    <Section eyebrow="01 - IMAGEN" spacing={isDesktop ? 0 : Spacing.xl}>
      <View
        style={[
          styles.imageContainer,
          {
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.border,
            height: isDesktop ? 400 : 220,
          },
        ]}
      >
        {image ? (
          <View style={{ width: '100%', height: '100%' }}>
            <Image source={{ uri: image }} style={styles.previewImage} resizeMode="cover" />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => setImage(null)}
            >
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.imageButtons}>
            <Pressable style={styles.pickButton} onPress={takePhoto}>
              <Ionicons name="camera-outline" size={26} color={colors.text} />
              <TextStyled
                variant="smallMedium"
                style={{ color: colors.text, marginTop: Spacing.sm, letterSpacing: 1 }}
              >
                CAMARA
              </TextStyled>
            </Pressable>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Pressable style={styles.pickButton} onPress={pickImage}>
              <Ionicons name="images-outline" size={26} color={colors.textSecondary} />
              <TextStyled
                variant="smallMedium"
                style={{
                  color: colors.textSecondary,
                  marginTop: Spacing.sm,
                  letterSpacing: 1,
                }}
              >
                GALERIA
              </TextStyled>
            </Pressable>
          </View>
        )}
      </View>
      {image && (
        <Pressable
          style={[
            styles.aiButton,
            {
              backgroundColor: aiCooldown ? colors.backgroundSecondary : colors.primary,
              opacity: aiLoading ? 0.7 : 1,
            },
          ]}
          onPress={handleAnalyze}
          disabled={aiLoading || aiCooldown}
        >
          <Ionicons name="sparkles-outline" size={16} color={aiCooldown ? colors.textMuted : colors.primaryText} />
          <TextStyled
            variant="smallMedium"
            style={{ color: aiCooldown ? colors.textMuted : colors.primaryText, marginLeft: Spacing.sm, letterSpacing: 1 }}
          >
            {aiLoading ? 'ANALIZANDO...' : aiCooldown ? 'ANALIZADO ✓' : 'ANALIZAR CON IA'}
          </TextStyled>
        </Pressable>
      )}
    </Section>
  );

  const DetailsBlock = (
    <>
      <Section eyebrow="02 - DETALLES" spacing={Spacing.xl}>
        <Input
          label="Nombre"
          placeholder="Camisa blanca de lino"
          value={name}
          onChangeText={setName}
        />
        <View style={{ height: Spacing.xl }} />
        <Input
          label="Marca (opcional)"
          placeholder="Zara, COS, vintage..."
          value={brand}
          onChangeText={setBrand}
        />
        <View style={{ height: Spacing.xl }} />
        <Input
          label="Precio (opcional)"
          placeholder="0,00"
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
          rightAdornment={
            <TextStyled style={{ color: colors.textSecondary }}>€</TextStyled>
          }
        />
      </Section>

      <Section eyebrow="03 - CATEGORIA" spacing={Spacing.xl}>
        <View style={styles.categoriesGrid}>
          {CATEGORIES.map((cat) => (
            <Chip
              key={cat}
              label={cat}
              selected={selectedCategory === cat}
              onPress={() => setSelectedCategory(cat as ClothingCategory)}
              block
            />
          ))}
        </View>
      </Section>

      <Section eyebrow="04 - COLOR" spacing={Spacing['2xl']}>
        <Small style={{ marginBottom: Spacing.lg }}>
          Selecciona el color principal de la prenda para obtener sugerencias de combinacion.
        </Small>
        <View style={styles.colorGrid}>
          {GARMENT_COLORS.map((gc) => {
            const isSelected = selectedColor === gc.id;
            return (
              <Pressable
                key={gc.id}
                onPress={() => setSelectedColor(isSelected ? null : gc.id)}
                style={({ pressed }) => [
                  styles.colorSwatch,
                  {
                    backgroundColor: gc.hex,
                    borderColor: isSelected ? colors.text : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                {isSelected && (
                  <Ionicons
                    name="checkmark"
                    size={14}
                    color={getContrastText(gc.hex)}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
        {selectedColor && (
          <View style={styles.colorLabelRow}>
            <View
              style={[
                styles.colorLabelDot,
                { backgroundColor: GARMENT_COLORS.find(c => c.id === selectedColor)?.hex },
              ]}
            />
            <TextStyled variant="smallMedium" style={{ color: colors.textSecondary }}>
              {GARMENT_COLORS.find(c => c.id === selectedColor)?.name ?? ''}
            </TextStyled>
            <Pressable onPress={() => setSelectedColor(null)} style={{ marginLeft: Spacing.sm }}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </Pressable>
          </View>
        )}
      </Section>

      <Section eyebrow="05 - TALLA" spacing={Spacing['2xl']}>
        <Small style={{ marginBottom: Spacing.lg }}>
          Opcional. Ayuda a la IA a personalizar las sugerencias de outfit.
        </Small>
        <View style={styles.categoriesGrid}>
          {SIZE_OPTIONS.map((sz) => (
            <Chip
              key={sz}
              label={sz}
              selected={selectedSize === sz}
              onPress={() => setSelectedSize(selectedSize === sz ? null : sz)}
            />
          ))}
        </View>
      </Section>

      <Button
        label="GUARDAR EN EL ARMARIO"
        onPress={handleSave}
        loading={loading}
        size="lg"
        icon="arrow-forward"
        iconPosition="right"
      />
    </>
  );

  return (
    <Page>
      <Stack.Screen options={{ title: 'Añadir prenda · Virtual Closet' }} />
      <View style={styles.headerWrap}>
        <Eyebrow>NUEVA PIEZA</Eyebrow>
        <H1 style={{ marginTop: Spacing.sm }}>
          Anadir <Italic>prenda</Italic>
        </H1>
        <Small style={{ marginTop: Spacing.sm, maxWidth: 360 }}>
          Sube una foto y describe la pieza. Cuanta mas informacion, mas facil sera encontrarla.
        </Small>
      </View>

      {isDesktop ? (
        <View style={styles.twoCols}>
          <View style={{ flex: 1 }}>{ImageBlock}</View>
          <View style={{ width: Spacing['2xl'] }} />
          <View style={{ flex: 1 }}>{DetailsBlock}</View>
        </View>
      ) : (
        <>
          {ImageBlock}
          {DetailsBlock}
        </>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  headerWrap: { marginBottom: Spacing['2xl'] },
  twoCols: { flexDirection: 'row', alignItems: 'flex-start' },
  imageContainer: {
    borderRadius: Radii.md,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
  },
  pickButton: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  divider: { width: 1, height: 40 },
  previewImage: { width: '100%', height: '100%' },
  removeImageButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  colorLabelDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radii.sm,
  },
});

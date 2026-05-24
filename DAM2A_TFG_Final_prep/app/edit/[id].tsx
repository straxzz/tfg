import { auth, db, storage } from '@/src/config/firebase';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { useBreakpoint } from '@/src/hooks/useBreakpoint';
import { getClothingById, updateClothing, uploadImage } from '@/src/service/clothingService';
import { ClothingCategory, ClothingItem } from '@/src/types';
import { GARMENT_COLORS } from '@/src/utils/colorimetry';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  Button,
  Chip,
  Eyebrow,
  H1,
  IconButton,
  Input,
  Italic,
  Page,
  Section,
  Small,
  TextStyled,
} from '@/src/components';
import { Radii, Spacing } from '@/src/constants/theme';

const CATEGORIES: ClothingCategory[] = [
  'Camisetas',
  'Pantalones',
  'Zapatos',
  'Sudaderas',
  'Chaquetas',
  'Accesorios',
  'Otros',
];

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'ÚNICA'];

export default function EditScreen() {
  const { id } = useLocalSearchParams();
  const colors = useThemeColor();
  const { isDesktop } = useBreakpoint();
  const user = auth.currentUser;

  const [item, setItem] = useState<ClothingItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [originalImageUrl, setOriginalImageUrl] = useState('');
  const [newImageUri, setNewImageUri] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ClothingCategory | ''>('');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [price, setPrice] = useState('');

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const data = await getClothingById(id as string);
        if (!data) {
          Alert.alert('Error', 'La prenda no existe');
          router.back();
          return;
        }
        setItem(data);
        setOriginalImageUrl(data.image);
        setName(data.name);
        setBrand(data.brand || '');
        setSelectedCategory(data.category);
        setSelectedColor(data.color ?? null);
        setSelectedSize(data.size ?? null);
        setPrice(data.price !== undefined ? String(data.price) : '');
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'No se pudo cargar la prenda');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });
    if (!result.canceled) setNewImageUri(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permiso', 'Necesitamos la camara');
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });
    if (!result.canceled) setNewImageUri(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!name.trim() || !selectedCategory)
      return Alert.alert('Faltan datos', 'Nombre y categoria son obligatorios.');
    if (!user) return;
    setSaving(true);
    try {
      if (newImageUri) {
        const finalImageUrl = await uploadImage(newImageUri, user.uid);
        await updateDoc(doc(db, 'clothes', id as string), { image: finalImageUrl });
        if (originalImageUrl) {
          try {
            await deleteObject(ref(storage, originalImageUrl));
          } catch {}
        }
      }

      const parsedPrice = price.trim() ? parseFloat(price.replace(',', '.')) : undefined;
      await updateClothing(id as string, {
        name: name.trim(),
        brand: brand.trim(),
        category: selectedCategory,
        price: parsedPrice,
        color: selectedColor,
        size: selectedSize,
      });

      Alert.alert('Listo', 'Prenda actualizada.');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Page scroll="none">
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: Spacing['4xl'],
          }}
        >
          <ActivityIndicator size="small" color={colors.text} />
        </View>
      </Page>
    );
  }

  const displayUri = newImageUri || originalImageUrl;

  const ImageBlock = (
    <Section eyebrow="01 - IMAGEN" spacing={isDesktop ? 0 : Spacing.xl}>
      <View
        style={[
          styles.imageContainer,
          {
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.border,
            height: isDesktop ? 420 : 240,
          },
        ]}
      >
        <Image source={{ uri: displayUri }} style={styles.previewImage} />
        {newImageUri ? (
          <TouchableOpacity
            style={styles.removeImageButton}
            onPress={() => setNewImageUri(null)}
          >
            <Ionicons name="close" size={18} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={styles.changeButtons}>
            <Pressable
              style={[styles.changeBtn, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
              onPress={takePhoto}
            >
              <Ionicons name="camera" size={16} color="#fff" />
            </Pressable>
            <Pressable
              style={[styles.changeBtn, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
              onPress={pickImage}
            >
              <Ionicons name="images" size={16} color="#fff" />
            </Pressable>
          </View>
        )}
      </View>
    </Section>
  );

  const FormBlock = (
    <>
      <Section eyebrow="02 - DETALLES" spacing={Spacing.xl}>
        <Input label="Nombre" value={name} onChangeText={setName} placeholder="Nombre" />
        <View style={{ height: Spacing.xl }} />
        <Input label="Marca" value={brand} onChangeText={setBrand} placeholder="Opcional" />
        <View style={{ height: Spacing.xl }} />
        <Input
          label="Precio"
          value={price}
          onChangeText={setPrice}
          placeholder="Opcional"
          keyboardType="decimal-pad"
          rightAdornment={<TextStyled style={{ color: colors.textSecondary }}>€</TextStyled>}
        />
      </Section>

      <Section eyebrow="03 - CATEGORIA" spacing={Spacing.xl}>
        <View style={styles.categoriesGrid}>
          {CATEGORIES.map((cat) => (
            <Chip
              key={cat}
              label={cat}
              selected={selectedCategory === cat}
              onPress={() => setSelectedCategory(cat)}
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
                    color={gc.hex === '#F5F5F5' || gc.hex === '#F5C842' || gc.hex === '#E8D9C5' || gc.hex === '#E8A0B4' ? '#000' : '#fff'}
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
              block
            />
          ))}
        </View>
      </Section>

      <Button
        label="GUARDAR CAMBIOS"
        size="lg"
        loading={saving}
        onPress={handleSave}
        icon="checkmark"
        iconPosition="right"
      />
    </>
  );

  return (
    <Page>
      <View style={styles.headerRow}>
        <IconButton icon="arrow-back" onPress={() => router.back()} variant="outline" />
        <View style={{ flex: 1, marginLeft: Spacing.base }}>
          <Eyebrow>EDITAR</Eyebrow>
          <H1 style={{ marginTop: Spacing.xs }}>
            {item?.name && item.name.length < 14 ? item.name : <Italic>Detalles</Italic>}
          </H1>
        </View>
      </View>

      {isDesktop ? (
        <View style={styles.twoCols}>
          <View style={{ flex: 1 }}>{ImageBlock}</View>
          <View style={{ width: Spacing['2xl'] }} />
          <View style={{ flex: 1 }}>{FormBlock}</View>
        </View>
      ) : (
        <>
          {ImageBlock}
          {FormBlock}
        </>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  twoCols: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  imageContainer: {
    borderRadius: Radii.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
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
  changeButtons: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    gap: 8,
  },
  changeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
});

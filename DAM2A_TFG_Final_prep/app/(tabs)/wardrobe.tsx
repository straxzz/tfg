import { auth } from '@/src/config/firebase';
import { useWebTitle } from '@/src/hooks/useWebTitle';
import { getClothes } from '@/src/service/clothingService';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { useBreakpoint } from '@/src/hooks/useBreakpoint';
import { ClothingItem } from '@/src/types';
import { getColorById } from '@/src/utils/colorimetry';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Button,
  Caption,
  Chip,
  Eyebrow,
  H1,
  Italic,
  Small,
  TextStyled,
} from '@/src/components';
import { Fonts, Radii, Spacing } from '@/src/constants/theme';

const CATEGORIES = ['Todo', 'Camisetas', 'Pantalones', 'Zapatos', 'Sudaderas', 'Chaquetas', 'Accesorios', 'Otros'];

type SortKey = 'newest' | 'oldest' | 'az' | 'price_asc' | 'price_desc';
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'newest',     label: 'Más reciente' },
  { key: 'oldest',     label: 'Más antiguo'  },
  { key: 'az',         label: 'A → Z'         },
  { key: 'price_asc',  label: 'Precio ↑'      },
  { key: 'price_desc', label: 'Precio ↓'      },
];

export default function WardrobeScreen() {
  const colors = useThemeColor();
  useWebTitle('Armario · Virtual Closet');
  const { contentMaxWidth, screenPadding, gridColumns, width } = useBreakpoint();
  const user = auth.currentUser;

  const [clothes, setClothes]         = useState<ClothingItem[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [search, setSearch]           = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todo');
  const [sortBy, setSortBy]           = useState<SortKey>('newest');
  const [listView, setListView]       = useState(false);
  const [showSort, setShowSort]       = useState(false);

  const COL_GAP      = Spacing.base;
  const containerW   = Math.min(width, contentMaxWidth) - screenPadding * 2;
  const cardWidth    = (containerW - COL_GAP * (gridColumns - 1)) / gridColumns;

  const fetchClothes = async () => {
    if (!user) return;
    try {
      const list = await getClothes(user.uid);
      setClothes(list);
    } catch {
      Alert.alert('Error', 'No se pudo cargar el armario.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchClothes(); }, []);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchClothes(); }, []);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const cats   = new Set(clothes.map((c) => c.category).filter(Boolean));
    const valued = clothes.filter((c) => c.price != null);
    const total  = valued.reduce((s, c) => s + (c.price ?? 0), 0);
    const brands = new Set(clothes.map((c) => c.brand).filter(Boolean));
    return { cats: cats.size, value: total, brands: brands.size, valued: valued.length };
  }, [clothes]);

  // ── Filter + Sort ─────────────────────────────────────────────────────────
  const filteredClothes = useMemo(() => {
    let list = clothes.filter((item) => {
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.brand || '').toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCategory === 'Todo' || item.category === selectedCategory;
      return matchSearch && matchCat;
    });
    switch (sortBy) {
      case 'newest':     list = [...list].sort((a, b) => (!a.createdAt || !b.createdAt) ? 0 : b.createdAt.toMillis() - a.createdAt.toMillis()); break;
      case 'oldest':     list = [...list].sort((a, b) => (!a.createdAt || !b.createdAt) ? 0 : a.createdAt.toMillis() - b.createdAt.toMillis()); break;
      case 'az':         list = [...list].sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'price_asc':  list = [...list].sort((a, b) => (a.price ?? 0) - (b.price ?? 0)); break;
      case 'price_desc': list = [...list].sort((a, b) => (b.price ?? 0) - (a.price ?? 0)); break;
    }
    return list;
  }, [clothes, search, selectedCategory, sortBy]);

  const activeSortLabel = SORT_OPTIONS.find((o) => o.key === sortBy)?.label ?? '';

  // ── Render: grid card ─────────────────────────────────────────────────────
  const renderGridItem = ({ item, index }: { item: ClothingItem; index: number }) => {
    const isLast = (index + 1) % gridColumns === 0;
    const colorData = item.color ? getColorById(item.color) : null;
    return (
      <Pressable
        onPress={() => router.push({ pathname: '/details/[id]', params: { id: item.id } })}
        style={({ pressed }) => [styles.card, { width: cardWidth, marginRight: isLast ? 0 : COL_GAP, opacity: pressed ? 0.9 : 1 }]}
      >
        <View style={[styles.imageWrap, { backgroundColor: colors.backgroundSecondary, height: cardWidth * 1.25 }]}>
          {item.image
            ? <Image source={{ uri: item.image }} style={styles.image} />
            : <Ionicons name="image-outline" size={28} color={colors.textMuted} />}
        </View>
        <View style={{ paddingTop: Spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
            <Eyebrow style={{ color: colors.textMuted, flex: 1 }}>{(item.category || '').toUpperCase()}</Eyebrow>
            {colorData && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colorData.hex, borderWidth: 0.5, borderColor: colors.border }} />}
          </View>
          <TextStyled style={{ fontFamily: Fonts.serif, fontSize: 17, lineHeight: 22, marginTop: 4, color: colors.text }} numberOfLines={1}>
            {item.name}
          </TextStyled>
          <View style={styles.cardMeta}>
            <Caption numberOfLines={1} style={{ flex: 1 }}>{item.brand || 'Sin marca'}</Caption>
            {item.price != null && (
              <Caption style={{ color: colors.text, fontWeight: '600' }}>
                {Number.isInteger(item.price) ? `${item.price} €` : `${item.price.toFixed(2)} €`}
              </Caption>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  // ── Render: list row ──────────────────────────────────────────────────────
  const renderListItem = ({ item }: { item: ClothingItem }) => {
    const colorData = item.color ? getColorById(item.color) : null;
    return (
      <Pressable
        onPress={() => router.push({ pathname: '/details/[id]', params: { id: item.id } })}
        style={({ pressed }) => [styles.listRow, { borderBottomColor: colors.border, opacity: pressed ? 0.85 : 1 }]}
      >
        <View style={[styles.listThumb, { backgroundColor: colors.backgroundSecondary }]}>
          {item.image
            ? <Image source={{ uri: item.image }} style={styles.listThumbImg} />
            : <Ionicons name="image-outline" size={22} color={colors.textMuted} />}
        </View>
        <View style={{ flex: 1, marginLeft: Spacing.md }}>
          <TextStyled style={{ fontFamily: Fonts.serif, fontSize: 17, color: colors.text }} numberOfLines={1}>
            {item.name}
          </TextStyled>
          <Caption style={{ marginTop: 2 }} numberOfLines={1}>{item.brand || 'Sin marca'}</Caption>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs }}>
            <View style={[styles.catTag, { borderColor: colors.border }]}>
              <Small style={{ color: colors.textSecondary }}>{item.category}</Small>
            </View>
            {colorData && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colorData.hex, borderWidth: 0.5, borderColor: colors.border }} />
                <Small style={{ color: colors.textMuted }}>{colorData.name}</Small>
              </View>
            )}
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', gap: Spacing.sm }}>
          {item.price != null && (
            <TextStyled style={{ fontFamily: Fonts.sans, fontSize: 14, fontWeight: '600', color: colors.text }}>
              {Number.isInteger(item.price) ? `${item.price} €` : `${item.price.toFixed(2)} €`}
            </TextStyled>
          )}
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </View>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center' }}>
      <Stack.Screen options={{ title: 'Armario · Virtual Closet' }} />

      {/* ── Header ── */}
      <View style={{ width: '100%', maxWidth: contentMaxWidth, paddingHorizontal: screenPadding, paddingTop: Spacing['3xl'] + Spacing.lg, paddingBottom: Spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Eyebrow>{clothes.length} {clothes.length === 1 ? 'PIEZA' : 'PIEZAS'}</Eyebrow>
            <H1 style={{ marginTop: Spacing.sm }}>Mi <Italic>armario</Italic></H1>
          </View>
          {/* View toggle */}
          <TouchableOpacity
            onPress={() => setListView((v) => !v)}
            style={[styles.toggleBtn, { borderColor: colors.border }]}
          >
            <Ionicons name={listView ? 'grid-outline' : 'list-outline'} size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* ── Stats row ── */}
        {clothes.length > 0 && (
          <View style={[styles.statsRow, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}>
            <View style={styles.statCell}>
              <TextStyled style={[styles.statNum, { color: colors.text }]}>{stats.cats}</TextStyled>
              <Caption>Categorías</Caption>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statCell}>
              <TextStyled style={[styles.statNum, { color: colors.text }]}>{stats.brands}</TextStyled>
              <Caption>Marcas</Caption>
            </View>
            {stats.valued > 0 && (
              <>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statCell}>
                  <TextStyled style={[styles.statNum, { color: colors.text }]}>
                    {stats.value % 1 === 0 ? `${stats.value}€` : `${stats.value.toFixed(0)}€`}
                  </TextStyled>
                  <Caption>Valor est.</Caption>
                </View>
              </>
            )}
          </View>
        )}

        {/* ── Search ── */}
        <View style={[styles.searchBox, { borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
          <TextInput
            placeholder="Buscar prenda o marca..."
            placeholderTextColor={colors.textMuted}
            style={{ flex: 1, marginLeft: Spacing.sm, fontFamily: Fonts.sans, fontSize: 15, color: colors.text, paddingVertical: Spacing.sm }}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Category + Sort bar ── */}
      <View style={{ width: '100%', maxWidth: contentMaxWidth, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: screenPadding, gap: Spacing.xl, paddingRight: Spacing.md }}
          >
            {CATEGORIES.map((cat) => (
              <Chip key={cat} label={cat} selected={selectedCategory === cat} onPress={() => setSelectedCategory(cat)} />
            ))}
          </ScrollView>
          {/* Sort button */}
          <Pressable
            onPress={() => setShowSort(true)}
            style={[styles.sortBtn, { borderLeftColor: colors.border, paddingHorizontal: screenPadding }]}
          >
            <Ionicons name="funnel-outline" size={16} color={colors.text} />
          </Pressable>
        </View>
      </View>

      {/* ── Content ── */}
      {loading ? (
        <ActivityIndicator size="small" color={colors.text} style={{ marginTop: Spacing['3xl'] }} />
      ) : (
        <FlatList
          key={listView ? 'list' : `grid-${gridColumns}`}
          data={filteredClothes}
          keyExtractor={(item) => item.id}
          renderItem={listView ? renderListItem : renderGridItem}
          numColumns={listView ? 1 : gridColumns}
          contentContainerStyle={{
            paddingHorizontal: listView ? 0 : screenPadding,
            paddingTop: Spacing.xl,
            paddingBottom: Spacing['4xl'],
            width: '100%',
            maxWidth: contentMaxWidth,
            alignSelf: 'center',
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { borderColor: colors.border }]}>
                <Ionicons name="shirt-outline" size={28} color={colors.textMuted} />
              </View>
              <TextStyled style={{ fontFamily: Fonts.serif, fontSize: 22, color: colors.text, marginTop: Spacing.lg }}>
                {clothes.length === 0 ? 'Aún no hay piezas' : 'Sin resultados'}
              </TextStyled>
              <Small style={{ marginTop: Spacing.sm, textAlign: 'center', maxWidth: 260 }}>
                {clothes.length === 0
                  ? 'Empieza añadiendo tu primera prenda al armario.'
                  : 'Prueba con otra búsqueda o categoría.'}
              </Small>
              {clothes.length === 0 && (
                <Button label="AÑADIR PRIMERA PRENDA" onPress={() => router.push('/add')} size="md" fullWidth={false} style={{ marginTop: Spacing.xl }} />
              )}
            </View>
          }
        />
      )}

      {/* ── Sort modal ── */}
      <Modal visible={showSort} transparent animationType="fade" onRequestClose={() => setShowSort(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowSort(false)}>
          <View style={[styles.sortSheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Eyebrow style={{ marginBottom: Spacing.lg }}>ORDENAR POR</Eyebrow>
            {SORT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.key}
                onPress={() => { setSortBy(opt.key); setShowSort(false); }}
                style={[styles.sortOption, { borderBottomColor: colors.border }]}
              >
                <TextStyled style={{ fontFamily: Fonts.sans, fontSize: 15, color: colors.text }}>
                  {opt.label}
                </TextStyled>
                {sortBy === opt.key && <Ionicons name="checkmark" size={18} color={colors.text} />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, borderWidth: 1, borderRadius: Radii.sm, marginTop: Spacing.xl, height: 44 },
  toggleBtn: { width: 40, height: 40, borderRadius: Radii.sm, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  statsRow: { flexDirection: 'row', borderRadius: Radii.sm, borderWidth: 1, marginTop: Spacing.lg, overflow: 'hidden' },
  statCell: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md },
  statNum: { fontFamily: Fonts.serif, fontSize: 20, lineHeight: 24 },
  statDivider: { width: 1, marginVertical: Spacing.sm },
  sortBtn: { paddingVertical: Spacing.md, borderLeftWidth: 1, alignItems: 'center', justifyContent: 'center' },
  card: { marginBottom: Spacing.xl },
  imageWrap: { width: '100%', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderRadius: Radii.sm },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.xs },
  listRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xl, borderBottomWidth: 1 },
  listThumb: { width: 72, height: 88, borderRadius: Radii.sm, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  listThumbImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  catTag: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: 999, borderWidth: 1 },
  emptyState: { alignItems: 'center', paddingTop: Spacing['4xl'] },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sortSheet: { borderTopLeftRadius: 16, borderTopRightRadius: 16, borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing['4xl'] },
  sortOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.lg, borderBottomWidth: 1 },
});

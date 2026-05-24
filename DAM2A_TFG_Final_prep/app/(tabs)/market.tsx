import { auth } from '@/src/config/firebase';
import { useWebTitle } from '@/src/hooks/useWebTitle';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { useBreakpoint } from '@/src/hooks/useBreakpoint';
import { getClothes } from '@/src/service/clothingService';
import { getUser } from '@/src/service/userService';
import {
  createListing,
  deleteListing,
  getAvailableListings,
  getMyListings,
  getMyPurchases,
} from '@/src/service/marketplaceService';
import { ClothingCategory, ClothingItem, MarketplaceListing, Purchase } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
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
  View,
} from 'react-native';
import {
  Avatar,
  Button,
  Caption,
  Chip,
  Divider,
  Eyebrow,
  H1,
  Italic,
  Page,
  Small,
  TextStyled,
} from '@/src/components';
import { Fonts, Radii, Spacing } from '@/src/constants/theme';

type Tab = 'explore' | 'sell' | 'purchases';

const formatPrice = (n: number) => (n % 1 === 0 ? `${n}` : n.toFixed(2));

export default function MarketScreen() {
  const colors = useThemeColor();
  useWebTitle('Tienda · Virtual Closet');
  const { isDesktop, isTablet, contentMaxWidth, screenPadding, gridColumns, width } = useBreakpoint();
  const isWide = isDesktop || isTablet;
  const user = auth.currentUser;
  const { defaultTab } = useLocalSearchParams<{ defaultTab?: string }>();

  const [activeTab, setActiveTab] = useState<Tab>((defaultTab as Tab) ?? 'explore');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Explore
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  // Sell
  const [myListings, setMyListings] = useState<MarketplaceListing[]>([]);
  const [myClothes, setMyClothes] = useState<ClothingItem[]>([]);
  // Purchases
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  // Modal para poner en venta
  const [showSellModal, setShowSellModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [salePrice, setSalePrice] = useState('');
  const [saleDesc, setSaleDesc] = useState('');
  const [selling, setSelling] = useState(false);

  // ─── Cargar datos ──────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [avail, mine, clothes, buys] = await Promise.all([
        getAvailableListings(user.uid),
        getMyListings(user.uid),
        getClothes(user.uid),
        getMyPurchases(user.uid),
      ]);
      setListings(avail);
      setMyListings(mine);
      setMyClothes(clothes);
      setPurchases(buys);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  // ─── Poner en venta ────────────────────────────────────────────────────────
  const openSellModal = (item: ClothingItem) => {
    setSelectedItem(item);
    setSalePrice(item.price ? String(item.price) : '');
    setSaleDesc('');
    setShowSellModal(true);
  };

  const handlePublish = async () => {
    if (!user || !selectedItem) return;
    const price = parseFloat(salePrice.replace(',', '.'));
    if (!salePrice || isNaN(price) || price <= 0) {
      Alert.alert('Precio inválido', 'Introduce un precio válido mayor que 0.');
      return;
    }
    setSelling(true);
    try {
      const userData = await getUser(user.uid);
      const sellerName = userData?.firstName
        ? `${userData.firstName} ${userData.lastName || ''}`.trim()
        : user.email?.split('@')[0] ?? 'Usuario';
      await createListing({
        clothingId: selectedItem.id,
        sellerId: user.uid,
        sellerName,
        sellerPhoto: userData?.photoURL ?? null,
        name: selectedItem.name,
        brand: selectedItem.brand,
        category: selectedItem.category,
        image: selectedItem.image,
        price,
        description: saleDesc.trim() || undefined,
      });
      setShowSellModal(false);
      setActiveTab('sell');
      load();
    } catch {
      Alert.alert('Error', 'No se pudo publicar la prenda.');
    } finally {
      setSelling(false);
    }
  };

  // ─── Comprar (simulado) — navega a pantalla de pago ──────────────────────
  const handleBuy = (listing: MarketplaceListing) => {
    router.push({
      pathname: '/checkout/[id]',
      params: {
        id:          listing.id,
        clothingId:  listing.clothingId  ?? '',
        sellerId:    listing.sellerId,
        sellerName:  listing.sellerName,
        sellerPhoto: listing.sellerPhoto ?? '',
        name:        listing.name,
        brand:       listing.brand       ?? '',
        category:    listing.category    ?? '',
        color:       listing.color       ?? '',
        size:        listing.size        ?? '',
        image:       listing.image       ?? '',
        price:       String(listing.price),
        description: listing.description ?? '',
      },
    });
  };

  // ─── Retirar listado ───────────────────────────────────────────────────────
  const handleRemoveListing = async (listing: MarketplaceListing) => {
    const ok = window.confirm(`¿Retirar "${listing.name}" del mercado?`);
    if (!ok) return;
    try {
      await deleteListing(listing.id);
      load();
    } catch {
      Alert.alert('Error', 'No se pudo retirar el anuncio.');
    }
  };

  // ─── Layout helpers ────────────────────────────────────────────────────────
  const COL_GAP = Spacing.base;
  const cols = Math.min(gridColumns, 2);
  const containerW = Math.min(width, contentMaxWidth) - screenPadding * 2;
  const cardW = (containerW - COL_GAP * (cols - 1)) / cols;

  // ─── Componentes de listado ────────────────────────────────────────────────
  const ListingCard = ({ item, isMine = false }: { item: MarketplaceListing; isMine?: boolean }) => (
    <View
      style={[
        styles.listingCard,
        {
          width: cardW,
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={[styles.listingImg, { backgroundColor: colors.background }]}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.listingImgFill} />
        ) : (
          <Ionicons name="shirt-outline" size={32} color={colors.textMuted} />
        )}
        {item.status === 'sold' && (
          <View style={[styles.soldBadge, { backgroundColor: colors.primary }]}>
            <TextStyled style={{ color: colors.primaryText, fontSize: 10, fontFamily: Fonts.sans, fontWeight: '700' }}>
              VENDIDO
            </TextStyled>
          </View>
        )}
      </View>

      <View style={{ padding: Spacing.md }}>
        <Eyebrow style={{ color: colors.textMuted }}>{(item.category ?? '').toUpperCase()}</Eyebrow>
        <TextStyled style={{ fontFamily: Fonts.serif, fontSize: 16, lineHeight: 20, color: colors.text, marginTop: 2 }} numberOfLines={1}>
          {item.name}
        </TextStyled>
        {item.brand ? (
          <TextStyled style={{ fontFamily: Fonts.serifItalic, fontSize: 12, color: colors.textSecondary, marginTop: 1 }} numberOfLines={1}>
            {item.brand}
          </TextStyled>
        ) : null}

        {!isMine && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm, gap: 6 }}>
            <Avatar uri={item.sellerPhoto} name={item.sellerName} size={18} />
            <Caption numberOfLines={1} style={{ flex: 1 }}>{item.sellerName}</Caption>
          </View>
        )}

        <View style={[styles.priceRow, { marginTop: Spacing.sm }]}>
          <TextStyled style={{ fontFamily: Fonts.serif, fontSize: 20, color: colors.text }}>
            {formatPrice(item.price)} <TextStyled style={{ fontSize: 14, color: colors.textSecondary }}>€</TextStyled>
          </TextStyled>
        </View>

        {item.description ? (
          <Small style={{ color: colors.textSecondary, marginTop: Spacing.xs }} numberOfLines={2}>
            {item.description}
          </Small>
        ) : null}

        <View style={{ marginTop: Spacing.md }}>
          {isMine ? (
            item.status === 'available' ? (
              <Button label="RETIRAR" variant="outline" size="sm" icon="close-outline" onPress={() => handleRemoveListing(item)} />
            ) : (
              <View style={[styles.soldTag, { borderColor: colors.border }]}>
                <Ionicons name="checkmark-circle-outline" size={14} color={colors.textMuted} />
                <Caption style={{ marginLeft: 4 }}>Vendido</Caption>
              </View>
            )
          ) : (
            item.status === 'available' ? (
              <Button label="COMPRAR" size="sm" icon="bag-outline" onPress={() => handleBuy(item)} />
            ) : (
              <View style={[styles.soldTag, { borderColor: colors.border }]}>
                <Caption>No disponible</Caption>
              </View>
            )
          )}
        </View>
      </View>
    </View>
  );

  // ─── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="small" color={colors.text} />
      </View>
    );
  }

  // Filtrar prendas que ya están en venta
  const listedClothingIds = new Set(myListings.filter(l => l.status === 'available').map(l => l.clothingId));
  const availableToSell = myClothes.filter(c => !listedClothingIds.has(c.id));

  return (
    <Page>
      <Stack.Screen options={{ title: 'Tienda · Virtual Closet' }} />

      {/* Cabecera */}
      <View style={styles.header}>
        <H1>
          <Italic>Tienda</Italic>
        </H1>
        <Small style={{ color: colors.textSecondary, marginTop: Spacing.xs }}>
          Compra y vende prendas de otros usuarios. (Simulación)
        </Small>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        {(['explore', 'sell', 'purchases'] as Tab[]).map(tab => {
          const labels: Record<Tab, string> = { explore: 'Explorar', sell: 'Vender', purchases: 'Compras' };
          const icons: Record<Tab, string> = { explore: 'storefront-outline', sell: 'pricetag-outline', purchases: 'bag-check-outline' };
          const active = activeTab === tab;
          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, active && { borderBottomColor: colors.text, borderBottomWidth: 2 }]}
            >
              <Ionicons name={icons[tab] as any} size={16} color={active ? colors.text : colors.textMuted} />
              <TextStyled style={{ fontFamily: Fonts.sans, fontSize: 12, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', color: active ? colors.text : colors.textMuted, marginLeft: 5 }}>
                {labels[tab]}
              </TextStyled>
            </Pressable>
          );
        })}
      </View>

      {/* ── EXPLORAR ─────────────────────────────────────────────────────── */}
      {activeTab === 'explore' && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
          contentContainerStyle={{ paddingTop: Spacing.xl, paddingBottom: Spacing['4xl'] }}
        >
          {listings.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="storefront-outline" size={40} color={colors.textMuted} />
              <TextStyled style={{ fontFamily: Fonts.serif, fontSize: 20, color: colors.text, marginTop: Spacing.md }}>
                Nada por aquí
              </TextStyled>
              <Small style={{ color: colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center' }}>
                Cuando otros usuarios pongan prendas en venta aparecerán aquí.
              </Small>
            </View>
          ) : (
            <View style={[styles.grid, { gap: COL_GAP }]}>
              {listings.map(l => <ListingCard key={l.id} item={l} />)}
            </View>
          )}
        </ScrollView>
      )}

      {/* ── VENDER ───────────────────────────────────────────────────────── */}
      {activeTab === 'sell' && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
          contentContainerStyle={{ paddingTop: Spacing.xl, paddingBottom: Spacing['4xl'] }}
        >
          {/* Mis anuncios activos */}
          {myListings.length > 0 && (
            <>
              <Eyebrow style={{ marginBottom: Spacing.md }}>MIS ANUNCIOS</Eyebrow>
              <View style={[styles.grid, { gap: COL_GAP, marginBottom: Spacing['2xl'] }]}>
                {myListings.map(l => <ListingCard key={l.id} item={l} isMine />)}
              </View>
              <Divider spacing={Spacing.xl} />
            </>
          )}

          {/* Prendas disponibles para vender */}
          <Eyebrow style={{ marginBottom: Spacing.md }}>PONER EN VENTA</Eyebrow>
          {availableToSell.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="shirt-outline" size={36} color={colors.textMuted} />
              <Small style={{ color: colors.textSecondary, marginTop: Spacing.md, textAlign: 'center' }}>
                No tienes prendas disponibles para vender.{'\n'}
                Añade primero ropa a tu armario.
              </Small>
              <View style={{ marginTop: Spacing.lg }}>
                <Button label="AÑADIR PRENDA" icon="add-outline" size="sm" onPress={() => router.push('/add')} />
              </View>
            </View>
          ) : (
            <View style={[styles.grid, { gap: COL_GAP }]}>
              {availableToSell.map(item => (
                <Pressable
                  key={item.id}
                  onPress={() => openSellModal(item)}
                  style={({ pressed }) => [
                    styles.clothesTile,
                    {
                      width: cardW,
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <View style={[styles.listingImg, { backgroundColor: colors.background }]}>
                    {item.image ? (
                      <Image source={{ uri: item.image }} style={styles.listingImgFill} />
                    ) : (
                      <Ionicons name="shirt-outline" size={28} color={colors.textMuted} />
                    )}
                    <View style={styles.addOverlay}>
                      <Ionicons name="pricetag-outline" size={20} color="#fff" />
                    </View>
                  </View>
                  <View style={{ padding: Spacing.sm }}>
                    <TextStyled style={{ fontFamily: Fonts.serif, fontSize: 14, color: colors.text }} numberOfLines={1}>
                      {item.name}
                    </TextStyled>
                    <Caption numberOfLines={1}>{item.category}</Caption>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* ── COMPRAS ──────────────────────────────────────────────────────── */}
      {activeTab === 'purchases' && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
          contentContainerStyle={{ paddingTop: Spacing.xl, paddingBottom: Spacing['4xl'] }}
        >
          {purchases.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="bag-outline" size={40} color={colors.textMuted} />
              <TextStyled style={{ fontFamily: Fonts.serif, fontSize: 20, color: colors.text, marginTop: Spacing.md }}>
                Sin compras aún
              </TextStyled>
              <Small style={{ color: colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center' }}>
                Tus compras simuladas aparecerán aquí.
              </Small>
            </View>
          ) : (
            purchases.map(p => {
              const date = p.createdAt?.toDate?.()?.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
              return (
                <View
                  key={p.id}
                  style={[styles.purchaseRow, { borderBottomColor: colors.border }]}
                >
                  <View style={[styles.purchaseImg, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                    {p.itemImage ? (
                      <Image source={{ uri: p.itemImage }} style={styles.listingImgFill} />
                    ) : (
                      <Ionicons name="shirt-outline" size={22} color={colors.textMuted} />
                    )}
                  </View>
                  <View style={{ flex: 1, marginLeft: Spacing.md }}>
                    <TextStyled style={{ fontFamily: Fonts.serif, fontSize: 16, color: colors.text }} numberOfLines={1}>
                      {p.itemName}
                    </TextStyled>
                    <Caption style={{ marginTop: 2 }}>Vendedor: {p.sellerName}</Caption>
                    {date ? <Caption style={{ marginTop: 1 }}>{date}</Caption> : null}
                  </View>
                  <TextStyled style={{ fontFamily: Fonts.serif, fontSize: 18, color: colors.text, marginLeft: Spacing.md }}>
                    {formatPrice(p.price)} €
                  </TextStyled>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* ── MODAL PONER EN VENTA ─────────────────────────────────────────── */}
      <Modal visible={showSellModal} transparent animationType="slide" onRequestClose={() => setShowSellModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <TextStyled style={{ fontFamily: Fonts.serif, fontSize: 22, color: colors.text }}>
                Poner en venta
              </TextStyled>
              <Pressable onPress={() => setShowSellModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            {selectedItem && (
              <View style={[styles.modalPreview, { borderColor: colors.border }]}>
                <View style={[styles.modalImg, { backgroundColor: colors.backgroundSecondary }]}>
                  {selectedItem.image ? (
                    <Image source={{ uri: selectedItem.image }} style={styles.listingImgFill} />
                  ) : (
                    <Ionicons name="shirt-outline" size={28} color={colors.textMuted} />
                  )}
                </View>
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <TextStyled style={{ fontFamily: Fonts.serif, fontSize: 17, color: colors.text }}>{selectedItem.name}</TextStyled>
                  <Caption>{selectedItem.category}</Caption>
                  {selectedItem.brand ? <Caption>{selectedItem.brand}</Caption> : null}
                </View>
              </View>
            )}

            <Divider spacing={Spacing.md} />

            <Eyebrow style={{ marginBottom: Spacing.sm }}>PRECIO DE VENTA (€)</Eyebrow>
            <TextInput
              value={salePrice}
              onChangeText={setSalePrice}
              placeholder="ej: 25"
              keyboardType="decimal-pad"
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.backgroundSecondary }]}
              placeholderTextColor={colors.textMuted}
            />

            <Eyebrow style={{ marginTop: Spacing.md, marginBottom: Spacing.sm }}>DESCRIPCIÓN (opcional)</Eyebrow>
            <TextInput
              value={saleDesc}
              onChangeText={setSaleDesc}
              placeholder="Estado de la prenda, talla, notas…"
              multiline
              numberOfLines={3}
              style={[styles.input, styles.inputMulti, { borderColor: colors.border, color: colors.text, backgroundColor: colors.backgroundSecondary }]}
              placeholderTextColor={colors.textMuted}
            />

            <View style={{ marginTop: Spacing.lg }}>
              <Button label={selling ? 'Publicando…' : 'PUBLICAR EN TIENDA'} icon="pricetag-outline" size="lg" onPress={handlePublish} />
            </View>
          </View>
        </View>
      </Modal>
    </Page>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: Spacing.xl },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: Spacing.xs,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  listingCard: {
    borderRadius: Radii.md,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.base,
  },
  listingImg: {
    width: '100%',
    aspectRatio: 0.85,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  listingImgFill: { width: '100%', height: '100%', resizeMode: 'cover' },
  soldBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  soldTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radii.sm,
  },
  clothesTile: {
    borderRadius: Radii.md,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.base,
  },
  addOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 36,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
    paddingHorizontal: Spacing['2xl'],
  },
  purchaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
  },
  purchaseImg: {
    width: 64,
    height: 72,
    borderRadius: Radii.sm,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: Spacing.xl,
    paddingBottom: Spacing['4xl'],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: Spacing.md,
  },
  modalImg: {
    width: 64,
    height: 72,
    borderRadius: Radii.sm,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    fontFamily: Fonts.sans,
  },
  inputMulti: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: Spacing.sm,
  },
});

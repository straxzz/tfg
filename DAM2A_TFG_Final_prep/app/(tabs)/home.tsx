import { auth, db } from '@/src/config/firebase';
import { useWebTitle } from '@/src/hooks/useWebTitle';
import { getClothes } from '@/src/service/clothingService';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { useBreakpoint } from '@/src/hooks/useBreakpoint';
import { getUser } from '@/src/service/userService';
import { ClothingItem } from '@/src/types';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

type FeedItem = ClothingItem & { ownerName: string; ownerUid: string };
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  Avatar,
  TourOverlay,
  Card,
  Display,
  Eyebrow,
  FadeIn,
  H3,
  Italic,
  Page,
  Section,
  Small,
  TextStyled,
} from '@/src/components';
import { Fonts, Spacing } from '@/src/constants/theme';

const formatPrice = (n: number) => (n % 1 === 0 ? `${n}` : n.toFixed(2));

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export default function HomeScreen() {
  const [username, setUsername] = useState('');
  const [totalClothes, setTotalClothes] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [recentClothes, setRecentClothes] = useState<ClothingItem[]>([]);
  const [forgottenClothes, setForgottenClothes] = useState<ClothingItem[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [friendFeed, setFriendFeed] = useState<FeedItem[]>([]);

  
  const [tourVisible, setTourVisible] = useState(false);
  const statsRef   = useRef<View>(null);
  const actionsRef = useRef<View>(null);
  const recentRef  = useRef<View>(null);
  const colors = useThemeColor();
  useWebTitle('Inicio · Virtual Closet');
  const { isDesktop, isTablet } = useBreakpoint();
  const isWide = isDesktop || isTablet;

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user?.email) setUsername(user.email.split('@')[0]);
      else setUsername('Usuario');
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      const fetchStats = async () => {
        if (!currentUser) return;
        try {
          const [clothes, fetchedUser] = await Promise.all([
            getClothes(currentUser.uid),
            getUser(currentUser.uid),
          ]);
          setTotalClothes(clothes.length);
          const sum = clothes.reduce((acc, item) => acc + (item.price ?? 0), 0);
          setTotalValue(sum);
          setUserData(fetchedUser);
          setUserPhoto(fetchedUser?.photoURL ?? null);
          if (fetchedUser?.firstName) setUsername(fetchedUser.firstName);

          
          if (!fetchedUser?.profileCompleted) {
            setTourVisible(true);
          }

          const now = Date.now();

          const sorted = [...clothes].sort((a, b) => {
            if (!a.createdAt || !b.createdAt) return 0;
            return b.createdAt.toMillis() - a.createdAt.toMillis();
          });
          setRecentClothes(sorted.slice(0, 4));

          // mezclamos para que parezca diferente cada vez
          const forgotten = clothes
            .filter((item) => {
              if (!item.createdAt) return false;
              return now - item.createdAt.toMillis() > THIRTY_DAYS_MS;
            })
            .sort(() => Math.random() - 0.5)
            .slice(0, 6);
          setForgottenClothes(forgotten);

          
          try {
            const uid = currentUser.uid;
            const [sentSnap, recvSnap] = await Promise.all([
              getDocs(query(collection(db, 'friend_requests'), where('fromUid', '==', uid), where('status', '==', 'accepted'))),
              getDocs(query(collection(db, 'friend_requests'), where('toUid',   '==', uid), where('status', '==', 'accepted'))),
            ]);
            const friendUids = new Set<string>();
            sentSnap.forEach(d => friendUids.add(d.data().toUid));
            recvSnap.forEach(d => friendUids.add(d.data().fromUid));

            if (friendUids.size > 0) {
              const uidsArr = [...friendUids].slice(0, 10);
              
              const nameMap: Record<string, string> = {};
              await Promise.all(uidsArr.map(async (fuid) => {
                try {
                  const snap = await getDoc(doc(db, 'users', fuid));
                  if (snap.exists()) {
                    const d = snap.data();
                    nameMap[fuid] = d.firstName || d.email?.split('@')[0] || 'Usuario';
                  }
                } catch { /* ignorar */ }
              }));
              
              const clothesSnap = await getDocs(query(collection(db, 'clothes'), where('userId', 'in', uidsArr)));
              const feedItems: FeedItem[] = clothesSnap.docs
                .map(d => ({ id: d.id, ...(d.data() as ClothingItem), ownerName: nameMap[d.data().userId] ?? 'Usuario', ownerUid: d.data().userId }))
                .filter(i => !!i.createdAt)
                .sort((a, b) => b.createdAt!.toMillis() - a.createdAt!.toMillis())
                .slice(0, 14);
              setFriendFeed(feedItems);
            } else {
              setFriendFeed([]);
            }
          } catch (feedErr) {
            console.error('feed:', feedErr);
          }
        } catch (error) {
          console.error(error);
        }
      };
      fetchStats();
    }, [currentUser])
  );

  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const titleSize = isDesktop ? 56 : isTablet ? 50 : 44;
  const titleLine = isDesktop ? 64 : isTablet ? 58 : 50;
  const numSize = isDesktop ? 44 : 38;
  const numLine = isDesktop ? 50 : 44;
  const recentCardSize = isWide ? 140 : 110;
  const forgottenCardSize = isWide ? 120 : 96;

  return (
    <Page>
      <Stack.Screen options={{ title: 'Inicio · Virtual Closet' }} />
      <FadeIn delay={0} duration={520}>
      <View style={styles.heroRow}>
        <View style={{ flex: 1 }}>
          <Eyebrow>{today}</Eyebrow>
          <Display
            style={{
              marginTop: Spacing.sm,
              textTransform: 'lowercase',
              fontSize: titleSize,
              lineHeight: titleLine,
            }}
          >
            {'Hola,\n'}
            <Italic>{username || 'tu'}.</Italic>
          </Display>
        </View>
        <Pressable onPress={() => router.push('/(tabs)/profile')} hitSlop={8}>
          <Avatar uri={userPhoto} name={username} size={isDesktop ? 64 : 52} bordered />
        </Pressable>
      </View>

      <Small style={{ marginTop: Spacing.base, maxWidth: 400, marginBottom: Spacing['3xl'] }}>
        Tu armario digital esta al dia. Anade nuevas piezas o explora lo que ya tienes.
      </Small>
      </FadeIn>

      <FadeIn delay={90} duration={520}>
      <View ref={statsRef} style={[styles.statsRow, { borderColor: colors.border }]}>
        <View style={[styles.statCol, { borderRightColor: colors.border }]}>
          <Eyebrow>PRENDAS</Eyebrow>
          <TextStyled
            style={{
              fontFamily: Fonts.serif,
              fontSize: numSize,
              lineHeight: numLine,
              marginTop: Spacing.xs,
              color: colors.text,
            }}
          >
            {totalClothes}
          </TextStyled>
        </View>
        <View style={styles.statCol}>
          <Eyebrow>VALOR ESTIMADO</Eyebrow>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: Spacing.xs }}>
            <TextStyled
              style={{
                fontFamily: Fonts.serif,
                fontSize: numSize,
                lineHeight: numLine,
                color: colors.text,
              }}
            >
              {totalValue > 0 ? formatPrice(totalValue) : '0'}
            </TextStyled>
            <TextStyled
              style={{
                fontFamily: Fonts.serif,
                fontSize: isDesktop ? 24 : 22,
                color: colors.textSecondary,
                marginLeft: 4,
              }}
            >
              {' €'}
            </TextStyled>
          </View>
        </View>
      </View>
      </FadeIn>

      <FadeIn delay={180} duration={520}>
      <View ref={actionsRef}>
      <Section eyebrow="QUE QUIERES HACER" spacing={Spacing.xl}>
        <View style={[styles.actionsWrap, isDesktop && styles.actionsWrapDesktop]}>
          <Pressable
            onPress={() => router.push('/add')}
            style={({ pressed }) => [
              styles.actionPrimary,
              isDesktop && { flex: 1 },
              { backgroundColor: colors.primary, opacity: pressed ? 0.92 : 1 },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Eyebrow style={{ color: colors.primaryText, opacity: 0.6 }}>
                NUEVA INCORPORACION
              </Eyebrow>
              <H3 style={{ color: colors.primaryText, marginTop: Spacing.sm }}>
                Anadir una prenda
              </H3>
              <Small style={{ color: colors.primaryText, opacity: 0.6, marginTop: Spacing.xs }}>
                Foto + detalles - 30 segundos
              </Small>
            </View>
            <View style={[styles.arrow, { borderColor: colors.primaryText }]}>
              <Ionicons name="arrow-forward" size={18} color={colors.primaryText} />
            </View>
          </Pressable>

          <View style={isDesktop ? styles.gapH : styles.gapV} />

          <Card
            onPress={() => router.push('/wardrobe')}
            padding={Spacing.lg}
            style={isDesktop ? { flex: 1 } : undefined}
          >
            <View style={styles.cardRow}>
              <View style={{ flex: 1 }}>
                <Eyebrow>EXPLORAR</Eyebrow>
                <H3 style={{ marginTop: Spacing.sm }}>Mi armario</H3>
                <Small style={{ marginTop: Spacing.xs }}>
                  Filtra por categoria, busca y organiza
                </Small>
              </View>
              <Ionicons name="arrow-forward" size={20} color={colors.text} />
            </View>
          </Card>

          <View style={isDesktop ? styles.gapH : styles.gapV} />

          <Card
            onPress={() => router.push('/social')}
            padding={Spacing.lg}
            style={isDesktop ? { flex: 1 } : undefined}
          >
            <View style={styles.cardRow}>
              <View style={{ flex: 1 }}>
                <Eyebrow>COMUNIDAD</Eyebrow>
                <H3 style={{ marginTop: Spacing.sm }}>Social</H3>
                <Small style={{ marginTop: Spacing.xs }}>
                  Conecta y comparte estilos
                </Small>
              </View>
              <Ionicons name="arrow-forward" size={20} color={colors.text} />
            </View>
          </Card>

          <View style={isDesktop ? styles.gapH : styles.gapV} />

          <Card
            onPress={() => router.push('/outfit')}
            padding={Spacing.lg}
            style={isDesktop ? { flex: 1 } : undefined}
          >
            <View style={styles.cardRow}>
              <View style={{ flex: 1 }}>
                <Eyebrow>IA · TEORÍA DEL COLOR</Eyebrow>
                <H3 style={{ marginTop: Spacing.sm }}>Crear outfit</H3>
                <Small style={{ marginTop: Spacing.xs }}>
                  Combina prendas de tu armario o de la tienda
                </Small>
              </View>
              <Ionicons name="sparkles-outline" size={20} color={colors.text} />
            </View>
          </Card>
        </View>
      </Section>
      </View>
      </FadeIn>
      {totalClothes === 0 && (
        <FadeIn delay={270} duration={520}>
        <Section eyebrow="POR DONDE EMPEZAR" spacing={Spacing['3xl']}>
          {/* Añadir primera prenda */}
          <Pressable
            onPress={() => router.push('/add')}
            style={({ pressed }) => [
              emptySuggestionStyle(colors, pressed),
              { backgroundColor: colors.primary },
            ]}
          >
            <View style={{ flex: 1 }}>
              <H3 style={{ color: colors.primaryText }}>Añade tu primera prenda</H3>
              <Small style={{ color: colors.primaryText, opacity: 0.7, marginTop: Spacing.xs }}>
                Haz una foto o sube una imagen de tu ropa
              </Small>
            </View>
            <Ionicons name="camera-outline" size={28} color={colors.primaryText} style={{ opacity: 0.8 }} />
          </Pressable>

          <View style={{ height: Spacing.md }} />

          {/* Explorar tienda */}
          <Pressable
            onPress={() => router.push('/(tabs)/market')}
            style={({ pressed }) => [emptySuggestionStyle(colors, pressed)]}
          >
            <View style={{ flex: 1 }}>
              <H3>Explora la tienda</H3>
              <Small style={{ color: colors.textSecondary, marginTop: Spacing.xs }}>
                Descubre prendas de otras usuarias
              </Small>
            </View>
            <Ionicons name="storefront-outline" size={26} color={colors.textMuted} />
          </Pressable>

          <View style={{ height: Spacing.md }} />

          {/* Completar perfil si no está completo */}
          {!userData?.profileCompleted && (
            <Pressable
              onPress={() => router.push('/profile-setup')}
              style={({ pressed }) => [emptySuggestionStyle(colors, pressed)]}
            >
              <View style={{ flex: 1 }}>
                <H3>Completa tu perfil</H3>
                <Small style={{ color: colors.textSecondary, marginTop: Spacing.xs }}>
                  Género, talla y estilo para recomendaciones de IA
                </Small>
              </View>
              <Ionicons name="person-outline" size={26} color={colors.textMuted} />
            </Pressable>
          )}
        </Section>
        </FadeIn>
      )}
      {recentClothes.length > 0 && (
        <FadeIn delay={270} duration={520}>
        <View ref={recentRef}>
        <Section eyebrow="ULTIMAS ANADIDAS" spacing={(forgottenClothes.length > 0 || friendFeed.length > 0) ? Spacing['3xl'] : 0}>
          {isWide ? (
            <View style={styles.recentRow}>
              {recentClothes.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() =>
                    router.push({ pathname: '/details/[id]', params: { id: item.id } })
                  }
                  style={({ pressed }) => [
                    styles.recentCard,
                    { flex: 1, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <View
                    style={[
                      styles.recentImage,
                      {
                        backgroundColor: colors.backgroundSecondary,
                        borderColor: colors.border,
                        height: recentCardSize * 1.2,
                      },
                    ]}
                  >
                    {item.image ? (
                      <Image source={{ uri: item.image }} style={styles.recentImg} />
                    ) : (
                      <Ionicons name="image-outline" size={24} color={colors.textMuted} />
                    )}
                  </View>
                  <Eyebrow style={{ marginTop: Spacing.sm, color: colors.textMuted }}>
                    {(item.category || '').toUpperCase()}
                  </Eyebrow>
                  <TextStyled
                    style={{
                      fontFamily: Fonts.serif,
                      fontSize: 15,
                      lineHeight: 20,
                      color: colors.text,
                      marginTop: 2,
                    }}
                    numberOfLines={1}
                  >
                    {item.name}
                  </TextStyled>
                </Pressable>
              ))}
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: Spacing.md, paddingRight: Spacing.sm }}
            >
              {recentClothes.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() =>
                    router.push({ pathname: '/details/[id]', params: { id: item.id } })
                  }
                  style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
                >
                  <View
                    style={[
                      styles.recentImage,
                      {
                        width: recentCardSize,
                        backgroundColor: colors.backgroundSecondary,
                        borderColor: colors.border,
                        height: recentCardSize * 1.2,
                      },
                    ]}
                  >
                    {item.image ? (
                      <Image source={{ uri: item.image }} style={styles.recentImg} />
                    ) : (
                      <Ionicons name="image-outline" size={24} color={colors.textMuted} />
                    )}
                  </View>
                  <Eyebrow
                    style={{ marginTop: Spacing.sm, color: colors.textMuted, maxWidth: recentCardSize }}
                  >
                    {(item.category || '').toUpperCase()}
                  </Eyebrow>
                  <TextStyled
                    style={{
                      fontFamily: Fonts.serif,
                      fontSize: 14,
                      lineHeight: 18,
                      color: colors.text,
                      marginTop: 2,
                      maxWidth: recentCardSize,
                    }}
                    numberOfLines={1}
                  >
                    {item.name}
                  </TextStyled>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </Section>
        </View>
        </FadeIn>
      )}
      {friendFeed.length > 0 && (
        <FadeIn delay={310} duration={520}>
        <Section eyebrow="DE TUS CONTACTOS" spacing={forgottenClothes.length > 0 ? Spacing['3xl'] : 0}>
          <Small style={{ marginBottom: Spacing.lg, color: colors.textSecondary }}>
            Subidas recientes de personas que sigues.
          </Small>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: Spacing.md, paddingRight: Spacing.sm }}
          >
            {friendFeed.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => router.push({ pathname: '/details/[id]', params: { id: item.id, readOnly: 'true' } })}
                style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
              >
                <View
                  style={[
                    styles.recentImage,
                    {
                      width: recentCardSize,
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.border,
                      height: recentCardSize * 1.2,
                    },
                  ]}
                >
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.recentImg} />
                  ) : (
                    <Ionicons name="image-outline" size={24} color={colors.textMuted} />
                  )}
                </View>
                <Eyebrow style={{ marginTop: Spacing.sm, color: colors.textMuted, maxWidth: recentCardSize }}>
                  {(item.ownerName || '').toUpperCase()}
                </Eyebrow>
                <TextStyled
                  style={{ fontFamily: Fonts.serif, fontSize: 14, lineHeight: 18, color: colors.text, marginTop: 2, maxWidth: recentCardSize }}
                  numberOfLines={1}
                >
                  {item.name}
                </TextStyled>
              </Pressable>
            ))}
          </ScrollView>
        </Section>
        </FadeIn>
      )}
      {forgottenClothes.length > 0 && (
        <FadeIn delay={340} duration={520}>
        <Section eyebrow="REDESCUBRE" spacing={0}>
          <Small style={{ marginBottom: Spacing.lg, color: colors.textSecondary }}>
            Prendas que llevas mas de un mes sin revisar. Dale una segunda oportunidad a tu armario.
          </Small>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: Spacing.md, paddingRight: Spacing.sm }}
          >
            {forgottenClothes.map((item) => (
              <Pressable
                key={item.id}
                onPress={() =>
                  router.push({ pathname: '/details/[id]', params: { id: item.id } })
                }
                style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
              >
                <View
                  style={[
                    styles.recentImage,
                    {
                      width: forgottenCardSize,
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.border,
                      height: forgottenCardSize * 1.3,
                    },
                  ]}
                >
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.recentImg} />
                  ) : (
                    <Ionicons name="image-outline" size={22} color={colors.textMuted} />
                  )}
                  {/* Subtle "forgotten" badge */}
                  <View style={[styles.forgottenBadge, { backgroundColor: colors.background }]}>
                    <Ionicons name="time-outline" size={10} color={colors.textMuted} />
                  </View>
                </View>
                <Eyebrow
                  style={{ marginTop: Spacing.sm, color: colors.textMuted, maxWidth: forgottenCardSize }}
                >
                  {(item.category || '').toUpperCase()}
                </Eyebrow>
                <TextStyled
                  style={{
                    fontFamily: Fonts.serif,
                    fontSize: 13,
                    lineHeight: 17,
                    color: colors.text,
                    marginTop: 2,
                    maxWidth: forgottenCardSize,
                  }}
                  numberOfLines={1}
                >
                  {item.name}
                </TextStyled>
              </Pressable>
            ))}
          </ScrollView>
        </Section>
        </FadeIn>
      )}
    {/* Tour de primera visita */}
      {tourVisible && (
        <TourOverlay
          steps={[
            {
              ref: statsRef,
              title: 'Tu armario en cifras',
              body: 'Aquí ves el total de prendas registradas y el valor estimado de tu guardarropa.',
              pad: 14,
            },
            {
              ref: actionsRef,
              title: 'Todo desde aquí',
              body: 'Añade prendas, explora tu armario, conecta con amigas y crea outfits con IA de teoría del color.',
              pad: 10,
            },
            {
              ref: recentRef,
              title: 'Tus últimas añadidas',
              body: 'Virtual Closet recuerda lo que llevas tiempo sin ponerte y te lo sugiere para que saques más partido a tu ropa.',
              pad: 10,
            },
          ]}
          onSkip={() => setTourVisible(false)}
          onDone={() => {
            setTourVisible(false);
            router.push('/profile-setup');
          }}
        />
      )}
    </Page>
  );
}

const emptySuggestionStyle = (colors: any, pressed: boolean) => ({
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  padding: Spacing.lg,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: colors.border,
  backgroundColor: pressed ? colors.backgroundSecondary : colors.background,
});

const styles = StyleSheet.create({
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing['3xl'],
  },
  statCol: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
    borderRightWidth: 1,
    borderRightColor: 'transparent',
  },
  actionsWrap: { flexDirection: 'column' },
  actionsWrapDesktop: { flexDirection: 'row', alignItems: 'stretch' },
  actionPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: 8,
  },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.md,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  gapV: { height: Spacing.md },
  gapH: { width: Spacing.md },
  recentRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  recentCard: {},
  recentImage: {
    width: '100%',
    borderRadius: 4,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  forgottenBadge: {
    position: 'absolute',
    bottom: Spacing.xs,
    right: Spacing.xs,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.85,
  },
});

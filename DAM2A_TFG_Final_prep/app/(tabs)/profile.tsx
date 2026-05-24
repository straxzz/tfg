import { auth, storage } from '@/src/config/firebase';
import { useWebTitle } from '@/src/hooks/useWebTitle';
import { useTheme } from '@/src/context/themeContext';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { useBreakpoint } from '@/src/hooks/useBreakpoint';
import { getClothes } from '@/src/service/clothingService';
import { createUser, deleteAccount, getUser, updateUser } from '@/src/service/userService';
import { ClothingItem } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useFocusEffect } from 'expo-router';
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  Button,
  Caption,
  Card,
  Divider,
  Eyebrow,
  H1,
  H3,
  Input,
  Italic,
  Page,
  Section,
  Small,
  TextStyled,
} from '@/src/components';
import { Fonts, Radii, Spacing } from '@/src/constants/theme';

const formatPrice = (n: number) => (n % 1 === 0 ? `${n}` : n.toFixed(2));

export default function ProfileScreen() {
  const user = auth.currentUser;
  const colors = useThemeColor();
  useWebTitle('Mi perfil · Virtual Closet');
  const { isDesktop } = useBreakpoint();
  const { userPreference, setThemePreference } = useTheme();

  const [userData, setUserData] = useState<any>(null);
  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [mode, setMode] = useState<'view' | 'edit_profile' | 'change_pass' | 'delete_account'>('view');

  const [editName, setEditName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editImage, setEditImage] = useState<string | null>(null);

  const [isPrivate, setIsPrivate] = useState(false);

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [currentPassError, setCurrentPassError] = useState('');
  const [newPassError, setNewPassError] = useState('');

  const [deletePass, setDeletePass] = useState('');
  const [deletePassError, setDeletePassError] = useState('');

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        if (!user?.uid) return;
        setLoading(true);
        try {
          const [data, userClothes] = await Promise.all([
            getUser(user.uid),
            getClothes(user.uid),
          ]);
          if (data) {
            setUserData(data);
            setEditName(data.firstName || '');
            setEditLastName(data.lastName || '');
            setEditImage(data.photoURL || null);
            setIsPrivate(data.isPrivate || false);
          }
          setClothes(userClothes);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }, [user])
  );

  // Stats derivados
  const totalClothes = clothes.length;
  const totalValue = clothes.reduce((acc, c) => acc + (c.price ?? 0), 0);
  const recentClothes = [...clothes]
    .sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.toMillis() - a.createdAt.toMillis();
    })
    .slice(0, 4);

  // Categorías más frecuentes
  const categoryCounts = clothes.reduce<Record<string, number>>((acc, c) => {
    if (c.category) acc[c.category] = (acc[c.category] || 0) + 1;
    return acc;
  }, {});
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat);

  const togglePrivacy = async () => {
    if (!user) return;
    const newValue = !isPrivate;
    setIsPrivate(newValue);
    try {
      await updateUser(user.uid, { isPrivate: newValue });
    } catch (error) {
      console.error(error);
      setIsPrivate(!newValue);
      Alert.alert('Error', 'No se pudo actualizar la privacidad.');
    }
  };

  const getBlobFromUri = async (uri: string): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () { resolve(xhr.response); };
      xhr.onerror = function () { reject(new TypeError('Network request failed')); };
      xhr.responseType = 'blob';
      xhr.open('GET', uri, true);
      xhr.send(null);
    });

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permiso', 'Necesitamos acceso a la galería');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) setEditImage(result.assets[0].uri);
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setProcessing(true);
    try {
      let photoURL = editImage;
      if (editImage && editImage !== userData?.photoURL) {
        const blob: any = await getBlobFromUri(editImage);
        const storageRef = ref(storage, `profiles/${user.uid}.jpg`);
        await uploadBytes(storageRef, blob);
        photoURL = await getDownloadURL(storageRef);
      }
      await createUser(user.uid, {
        firstName: editName,
        lastName: editLastName,
        photoURL: photoURL ?? null,
      });
      await updateProfile(user, {
        displayName: `${editName} ${editLastName}`.trim(),
        photoURL: photoURL,
      });
      setUserData({ ...userData, firstName: editName, lastName: editLastName, photoURL });
      setMode('view');
      Alert.alert('Listo', 'Perfil actualizado.');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleChangePassword = async () => {
    setCurrentPassError('');
    setNewPassError('');
    const oldP = currentPass.trim();
    const newP = newPass.trim();
    let hasEmpty = false;
    if (!oldP) { setCurrentPassError('Escribe tu contraseña actual.'); hasEmpty = true; }
    if (!newP) { setNewPassError('Escribe la nueva contraseña.'); hasEmpty = true; }
    if (hasEmpty) return;
    if (!user || !user.email) return;
    setProcessing(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, oldP);
      await reauthenticateWithCredential(user, credential);
      if (oldP === newP) { setNewPassError('La nueva contraseña no puede ser igual.'); return; }
      if (newP.length < 6) { setNewPassError('Mínimo 6 caracteres.'); return; }
      await updatePassword(user, newP);
      Alert.alert('Listo', 'Contraseña actualizada.');
      setMode('view');
      setCurrentPass('');
      setNewPass('');
    } catch (error: any) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setCurrentPassError('Esa contraseña no es correcta.');
      } else if (error.code === 'auth/weak-password') {
        setNewPassError('Contraseña muy débil.');
      } else {
        Alert.alert('Error', error.message);
      }
    } finally {
      setProcessing(false);
    }
  };

  // true si la cuenta usa Google (sin contraseña propia)
  const isGoogleUser = user?.providerData?.some(p => p.providerId === 'google.com') ?? false;

  const handleConfirmDeleteAccount = async () => {
    setDeletePassError('');
    if (!user) return;
    setProcessing(true);
    try {
      if (isGoogleUser) {
        // Re-autenticar con Google popup
        await reauthenticateWithPopup(user, new GoogleAuthProvider());
      } else {
        const pass = deletePass.trim();
        if (!pass) { setDeletePassError('Escribe tu contraseña.'); setProcessing(false); return; }
        if (!user.email) return;
        const credential = EmailAuthProvider.credential(user.email, pass);
        await reauthenticateWithCredential(user, credential);
      }
      await deleteAccount(user.uid);
      await user.delete();
      router.replace('/');
    } catch (error: any) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setDeletePassError('Contraseña incorrecta.');
      } else if (error.code !== 'auth/popup-closed-by-user') {
        Alert.alert('Error', error.message || 'No se pudo eliminar.');
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.replace('/');
    } catch (error) {
      console.error(error);
    }
  };

  const getInitial = () => {
    if (userData?.firstName) return userData.firstName[0].toUpperCase();
    if (user?.email) return user.email[0].toUpperCase();
    return 'U';
  };

  const resetForm = () => {
    setMode('view');
    setCurrentPass(''); setNewPass('');
    setCurrentPassError(''); setNewPassError('');
    setDeletePass(''); setDeletePassError('');
  };

  if (loading) {
    return (
      <Page scroll="none">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: Spacing['4xl'] }}>
          <ActivityIndicator size="small" color={colors.text} />
        </View>
      </Page>
    );
  }

  const photoUri = mode === 'edit_profile' ? editImage : userData?.photoURL;

  return (
    <Page keyboardAvoiding>
      <Stack.Screen options={{ title: 'Mi perfil · Virtual Closet' }} />
      {/* ── Header ── */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Eyebrow>CUENTA</Eyebrow>
          <H1 style={{ marginTop: Spacing.sm }}>
            Mi <Italic>perfil</Italic>
          </H1>
        </View>
        {mode !== 'view' && (
          <TouchableOpacity onPress={resetForm}>
            <TextStyled variant="smallMedium" style={{ color: colors.text, textDecorationLine: 'underline' }}>
              Cancelar
            </TextStyled>
          </TouchableOpacity>
        )}
      </View>

      <View style={isDesktop ? styles.twoCols : undefined}>
        {/* ── Columna izquierda: avatar + identidad ── */}
        <View style={[styles.avatarSection, isDesktop && { flex: 1, marginBottom: 0 }]}>
          <TouchableOpacity
            disabled={mode !== 'edit_profile'}
            onPress={pickImage}
            activeOpacity={0.85}
            style={[
              styles.avatarWrapper,
              {
                borderColor: colors.border,
                width: isDesktop ? 160 : 120,
                height: isDesktop ? 160 : 120,
                borderRadius: isDesktop ? 80 : 60,
              },
            ]}
          >
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
                <TextStyled style={{ fontFamily: Fonts.serif, fontSize: isDesktop ? 72 : 56, color: colors.text }}>
                  {getInitial()}
                </TextStyled>
              </View>
            )}
            {mode === 'edit_profile' && (
              <View style={[styles.cameraIconBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
                <Ionicons name="camera" size={16} color={colors.primaryText} />
              </View>
            )}
          </TouchableOpacity>

          {mode === 'view' && (
            <>
              <TextStyled style={{ fontFamily: Fonts.serif, fontSize: isDesktop ? 30 : 24, color: colors.text, marginTop: Spacing.lg, textAlign: 'center' }}>
                {userData?.firstName} {userData?.lastName}
              </TextStyled>
              <Small style={{ marginTop: Spacing.xs, textAlign: 'center', color: colors.textSecondary }}>
                {user?.email}
              </Small>

              {/* Stats row */}
              {totalClothes > 0 && (
                <View style={[styles.statsRow, { borderColor: colors.border, marginTop: Spacing.xl }]}>
                  <View style={styles.statItem}>
                    <TextStyled style={{ fontFamily: Fonts.serif, fontSize: 26, color: colors.text }}>
                      {totalClothes}
                    </TextStyled>
                    <Eyebrow style={{ marginTop: 2 }}>PRENDAS</Eyebrow>
                  </View>
                  {totalValue > 0 && (
                    <>
                      <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                      <View style={styles.statItem}>
                        <TextStyled style={{ fontFamily: Fonts.serif, fontSize: 26, color: colors.text }}>
                          {formatPrice(totalValue)}€
                        </TextStyled>
                        <Eyebrow style={{ marginTop: 2 }}>VALOR</Eyebrow>
                      </View>
                    </>
                  )}
                </View>
              )}

              {/* Top categorías */}
              {topCategories.length > 0 && (
                <View style={styles.categoryChips}>
                  {topCategories.map((cat) => (
                    <View key={cat} style={[styles.catChip, { borderColor: colors.border }]}>
                      <TextStyled style={{ fontFamily: Fonts.sans, fontSize: 10, letterSpacing: 1, color: colors.textSecondary }}>
                        {cat.toUpperCase()}
                      </TextStyled>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </View>

        <View style={isDesktop ? { width: Spacing['2xl'] } : undefined} />

        {/* ── Columna derecha: acciones / formularios ── */}
        <View style={isDesktop ? { flex: 1.4 } : undefined}>
          {mode === 'view' && (
            <>
              <View style={{ flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing['2xl'] }}>
                <View style={{ flex: 1 }}>
                  <Button label="EDITAR DATOS" variant="outline" size="md" icon="person-outline" onPress={() => setMode('edit_profile')} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button label="CONTRASEÑA" variant="outline" size="md" icon="lock-closed-outline" onPress={() => setMode('change_pass')} />
                </View>
              </View>

              {/* Preview armario */}
              {recentClothes.length > 0 && (
                <Section eyebrow="MI ARMARIO" spacing={Spacing['2xl']}>
                  <View style={styles.clothesGrid}>
                    {recentClothes.map((item) => (
                      <Pressable
                        key={item.id}
                        onPress={() => router.push({ pathname: '/details/[id]', params: { id: item.id } })}
                        style={({ pressed }) => [styles.clothesTile, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary, opacity: pressed ? 0.85 : 1 }]}
                      >
                        {item.image ? (
                          <Image source={{ uri: item.image }} style={styles.clothesImg} />
                        ) : (
                          <Ionicons name="image-outline" size={22} color={colors.textMuted} />
                        )}
                      </Pressable>
                    ))}
                  </View>
                  <Pressable onPress={() => router.push('/wardrobe')} style={styles.verTodo}>
                    <Caption style={{ color: colors.textSecondary }}>VER TODO EL ARMARIO</Caption>
                    <Ionicons name="arrow-forward" size={14} color={colors.textSecondary} />
                  </Pressable>
                </Section>
              )}

              <Section eyebrow="CONFIGURACIÓN" spacing={Spacing['2xl']}>
                <Card padding={Spacing.lg}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <H3>{isPrivate ? 'Perfil privado' : 'Perfil público'}</H3>
                      <Small style={{ marginTop: Spacing.xs }}>
                        {isPrivate ? 'Solo tus amigos ven tu armario.' : 'Cualquiera puede ver tu armario.'}
                      </Small>
                    </View>
                    <Switch
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor={'#fff'}
                      ios_backgroundColor={colors.border}
                      onValueChange={togglePrivacy}
                      value={isPrivate}
                    />
                  </View>
                </Card>

                <View style={{ height: Spacing.md }} />

                <Card padding={Spacing.lg}>
                  <Pressable
                    onPress={() => router.push('/profile-setup')}
                    style={{ flexDirection: 'row', alignItems: 'center' }}
                  >
                    <View style={{ flex: 1 }}>
                      <H3>Personalización</H3>
                      <Small style={{ marginTop: Spacing.xs }}>
                        Género, medidas y estilo para recomendaciones de IA
                      </Small>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  </Pressable>
                </Card>

                <View style={{ height: Spacing.md }} />

                <Card padding={Spacing.lg}>
                  <H3 style={{ marginBottom: Spacing.base }}>Tema</H3>
                  <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                    {([
                      { key: 'light' as const, label: 'CLARO', icon: 'sunny-outline' as const },
                      { key: 'dark' as const, label: 'OSCURO', icon: 'moon-outline' as const },
                      { key: 'system' as const, label: 'AUTO', icon: 'phone-portrait-outline' as const },
                    ]).map(({ key, label, icon }) => (
                      <Pressable
                        key={key}
                        onPress={() => setThemePreference(key)}
                        style={[
                          styles.themeOption,
                          {
                            borderColor: userPreference === key ? colors.text : colors.border,
                            backgroundColor: userPreference === key ? colors.text : 'transparent',
                          },
                        ]}
                      >
                        <Ionicons name={icon} size={18} color={userPreference === key ? colors.primaryText : colors.text} />
                        <TextStyled variant="smallMedium" style={{ color: userPreference === key ? colors.primaryText : colors.text, marginTop: Spacing.xs, letterSpacing: 1 }}>
                          {label}
                        </TextStyled>
                      </Pressable>
                    ))}
                  </View>
                </Card>
              </Section>

              <Divider spacing={Spacing.xl} />

              <Pressable onPress={handleLogout} style={styles.linkRow}>
                <TextStyled variant="bodyMedium" style={{ color: colors.text }}>Cerrar sesión</TextStyled>
                <Ionicons name="log-out-outline" size={18} color={colors.text} />
              </Pressable>

              <Pressable onPress={() => setMode('delete_account')} style={styles.linkRow}>
                <TextStyled variant="bodyMedium" style={{ color: colors.error }}>Eliminar cuenta</TextStyled>
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </Pressable>

              <Caption style={{ textAlign: 'center', marginTop: Spacing['2xl'] }}>
                Virtual Closet · v1.0.0
              </Caption>
            </>
          )}

          {mode === 'edit_profile' && (
            <Section eyebrow="INFORMACIÓN PERSONAL">
              <Input label="Nombre" value={editName} onChangeText={setEditName} placeholder="Nombre" />
              <View style={{ height: Spacing.xl }} />
              <Input label="Apellidos" value={editLastName} onChangeText={setEditLastName} placeholder="Apellidos" />
              <Button label="GUARDAR DATOS" onPress={handleUpdateProfile} loading={processing} size="lg" style={{ marginTop: Spacing['2xl'] }} />
            </Section>
          )}

          {mode === 'change_pass' && (
            <Section eyebrow="SEGURIDAD">
              <Input
                label="Contraseña actual"
                value={currentPass}
                onChangeText={(t) => { setCurrentPass(t); if (currentPassError) setCurrentPassError(''); }}
                secureTextEntry
                placeholder="Tu contraseña actual"
                error={currentPassError}
              />
              <View style={{ height: Spacing.xl }} />
              <Input
                label="Nueva contraseña"
                value={newPass}
                onChangeText={(t) => { setNewPass(t); if (newPassError) setNewPassError(''); }}
                secureTextEntry
                placeholder="Mínimo 6 caracteres"
                error={newPassError}
              />
              <Button label="ACTUALIZAR CONTRASEÑA" onPress={handleChangePassword} loading={processing} size="lg" style={{ marginTop: Spacing['2xl'] }} />
            </Section>
          )}

          {mode === 'delete_account' && (
            <Section eyebrow="ELIMINAR CUENTA">
              <Small style={{ marginBottom: Spacing.lg }}>
                {isGoogleUser
                  ? 'Esta acción es irreversible. Se abrirá una ventana de Google para confirmar tu identidad.'
                  : 'Esta acción es irreversible y eliminará todos tus datos. Confirma con tu contraseña.'}
              </Small>
              {!isGoogleUser && (
                <Input
                  label="Contraseña"
                  value={deletePass}
                  onChangeText={(t) => { setDeletePass(t); if (deletePassError) setDeletePassError(''); }}
                  secureTextEntry
                  placeholder="Tu contraseña"
                  error={deletePassError}
                />
              )}
              <Button label="ELIMINAR CUENTA DEFINITIVAMENTE" variant="danger" onPress={handleConfirmDeleteAccount} loading={processing} size="lg" style={{ marginTop: Spacing['2xl'] }} />
            </Section>
          )}
        </View>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: Spacing['2xl'],
  },
  twoCols: { flexDirection: 'row', alignItems: 'flex-start' },
  avatarSection: { alignItems: 'center', marginBottom: Spacing['2xl'] },
  avatarWrapper: {
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: Spacing.md,
    alignSelf: 'stretch',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  statDivider: { width: 1, marginVertical: Spacing.sm },
  categoryChips: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  catChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
  },
  clothesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  clothesTile: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: Radii.md,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clothesImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  verTodo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    alignSelf: 'flex-start',
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.base,
    borderRadius: Radii.sm,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.base,
  },
});

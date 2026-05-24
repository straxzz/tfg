import { auth } from '@/src/config/firebase';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { useBreakpoint } from '@/src/hooks/useBreakpoint';
import { createUser, uploadProfilePhoto } from '@/src/service/userService';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  Button,
  Caption,
  Display,
  Eyebrow,
  Input,
  Italic,
  Logo,
  Page,
  Small,
  TextStyled,
} from '@/src/components';
import { Radii, Spacing } from '@/src/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const colors = useThemeColor();
  const { isDesktop } = useBreakpoint();

  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [language, setLanguage] = useState<'es' | 'en'>('es');

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [nameError, setNameError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a la galeria para tu perfil.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const validateForm = () => {
    let isValid = true;
    const emailRegex = /\S+@\S+\.\S+/;

    if (!emailRegex.test(email)) {
      setEmailError('Email invalido');
      isValid = false;
    } else setEmailError('');

    if (password.length < 6) {
      setPasswordError('Minimo 6 caracteres');
      isValid = false;
    } else setPasswordError('');

    if (isRegistering && !firstName.trim()) {
      setNameError('Nombre obligatorio');
      isValid = false;
    } else setNameError('');

    return isValid;
  };

  const handleAuth = async () => {
    setGeneralError('');
    if (!validateForm()) return;
    setLoading(true);
    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const photoURL = imageUri ? await uploadProfilePhoto(user.uid, imageUri) : null;

        await updateProfile(user, {
          displayName: `${firstName} ${lastName}`.trim(),
          photoURL: photoURL || null,
        });

        await createUser(user.uid, {
          firstName,
          lastName,
          email,
          photoURL,
          isPrivate: false,
          themePreference: 'system',
        });

        // Nuevo usuario → onboarding
        router.replace('/onboarding');
        return;
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.replace('/(tabs)/home');
    } catch (error: any) {
      console.error('[AUTH]', error.code, error.message);
      switch (error.code) {
        case 'auth/email-already-in-use':
          setEmailError('Este email ya tiene una cuenta');
          break;
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setPasswordError('Contrasena incorrecta');
          break;
        case 'auth/user-not-found':
          setEmailError('No existe una cuenta con este email');
          break;
        case 'auth/invalid-email':
          setEmailError('Email invalido');
          break;
        case 'auth/weak-password':
          setPasswordError('La contrasena es demasiado debil');
          break;
        case 'auth/operation-not-allowed':
          setGeneralError('Autenticacion por email desactivada. Activa Email/Password en Firebase Console.');
          break;
        case 'auth/network-request-failed':
          setGeneralError('Error de red. Comprueba tu conexion.');
          break;
        default:
          setGeneralError(error.message ?? 'Error desconocido');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (Platform.OS !== 'web') {
      Alert.alert(
        'Google Sign-In',
        'La autenticacion con Google esta disponible en la version web. En movil, usa email y contrasena.',
      );
      return;
    }
    setGeneralError('');
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      // Importamos getUser aquí para no añadirlo al nivel de módulo
      const { getUser: fetchUser, createUser: makeUser } = await import('@/src/service/userService');
      const existing = await fetchUser(firebaseUser.uid);
      const isNewUser = !existing;
      if (isNewUser) {
        const displayName = firebaseUser.displayName ?? '';
        const parts = displayName.split(' ');
        await makeUser(firebaseUser.uid, {
          uid:             firebaseUser.uid,
          email:           firebaseUser.email ?? '',
          firstName:       parts[0] ?? 'Usuario',
          lastName:        parts.slice(1).join(' '),
          photoURL:        firebaseUser.photoURL ?? null,
          isPrivate:       false,
          themePreference: 'system',
        });
      }
      router.replace(isNewUser ? '/onboarding' : '/(tabs)/home');
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        console.error('[GOOGLE]', error.code, error.message);
        setGeneralError(error.message ?? 'Error con Google Sign-In');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Page
      keyboardAvoiding
      topOffset={Spacing['4xl']}
      contentStyle={{ maxWidth: 480 }}
    >
      {/* Marca */}
      <View style={styles.brand}>
        <Logo variant="stacked" size={isDesktop ? 96 : 72} />
      </View>

      {/* Hero editorial */}
      <View style={styles.hero}>
        <Display style={{ textAlign: 'center' }}>
          {isRegistering ? (
            <>
              Crea{'\n'}
              <Italic>tu perfil.</Italic>
            </>
          ) : (
            <>
              Bienvenida{'\n'}
              <Italic>de nuevo.</Italic>
            </>
          )}
        </Display>
        <Small
          style={{
            marginTop: Spacing.base,
            textAlign: 'center',
            maxWidth: 360,
            alignSelf: 'center',
          }}
        >
          {isRegistering
            ? 'Una cuenta para organizar, compartir y descubrir tu propio estilo.'
            : 'Accede a tu armario digital y continua donde lo dejaste.'}
        </Small>
      </View>

      {isRegistering && (
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={pickImage} activeOpacity={0.85}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.profileImage} />
            ) : (
              <View
                style={[
                  styles.placeholderImage,
                  { borderColor: colors.borderStrong, backgroundColor: colors.backgroundSecondary },
                ]}
              >
                <Ionicons name="camera-outline" size={26} color={colors.textSecondary} />
              </View>
            )}
            <View
              style={[
                styles.editIcon,
                { backgroundColor: colors.primary, borderColor: colors.background },
              ]}
            >
              <Ionicons name="add" size={14} color={colors.primaryText} />
            </View>
          </TouchableOpacity>
          <Caption style={{ marginTop: Spacing.sm }}>Sube una foto de perfil</Caption>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: Spacing.md }}>
              <Input
                label="Nombre"
                placeholder="Aitana"
                value={firstName}
                onChangeText={setFirstName}
                error={nameError}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Apellidos"
                placeholder="Opcional"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
          </View>

          <View style={styles.languageRow}>
            {(['es', 'en'] as const).map((code) => {
              const isActive = language === code;
              return (
                <Pressable
                  key={code}
                  onPress={() => setLanguage(code)}
                  style={[
                    styles.langBtn,
                    {
                      borderColor: isActive ? colors.text : colors.border,
                      backgroundColor: isActive ? colors.text : 'transparent',
                    },
                  ]}
                >
                  <TextStyled
                    variant="smallMedium"
                    style={{
                      color: isActive ? colors.primaryText : colors.text,
                      letterSpacing: 1,
                    }}
                  >
                    {code === 'es' ? 'ESPANOL' : 'ENGLISH'}
                  </TextStyled>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.form}>
        <Input
          label="Correo electronico"
          placeholder="tu@correo.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          error={emailError}
        />
        <View style={{ height: Spacing.lg }} />
        <Input
          label="Contrasena"
          placeholder="Minimo 6 caracteres"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          error={passwordError}
        />
      </View>

      {/* Error general visible en pantalla */}
      {!!generalError && (
        <View
          style={{
            marginTop: Spacing.xl,
            padding: Spacing.md,
            borderRadius: 6,
            backgroundColor: '#fee2e2',
            borderWidth: 1,
            borderColor: '#fca5a5',
          }}
        >
          <Small style={{ color: '#b91c1c' }}>{generalError}</Small>
        </View>
      )}

      <Button
        label={isRegistering ? 'CREAR CUENTA' : 'INICIAR SESION'}
        onPress={handleAuth}
        loading={loading}
        size="lg"
        icon="arrow-forward"
        iconPosition="right"
        style={{ marginTop: Spacing['2xl'] }}
      />

      {/* Separador */}
      <View style={styles.dividerRow}>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        <Small style={{ color: colors.textMuted, marginHorizontal: Spacing.sm }}>O</Small>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
      </View>

      {/* Google Sign-In */}
      <Pressable
        onPress={handleGoogleSignIn}
        disabled={googleLoading}
        style={({ pressed }) => [
          styles.googleBtn,
          {
            borderColor: colors.border,
            backgroundColor: colors.backgroundSecondary,
            opacity: pressed || googleLoading ? 0.7 : 1,
          },
        ]}
      >
        <View style={styles.googleIcon}>
          <TextStyled style={{ fontSize: 16, fontWeight: '700', color: '#4285F4' }}>G</TextStyled>
        </View>
        <TextStyled style={{ fontFamily: 'System', fontSize: 14, fontWeight: '600', color: colors.text, letterSpacing: 0.5 }}>
          {googleLoading ? 'Conectando...' : 'Continuar con Google'}
        </TextStyled>
      </Pressable>

      <Pressable
        onPress={() => {
          setIsRegistering(!isRegistering);
          setEmailError('');
          setPasswordError('');
        }}
        style={styles.toggle}
      >
        <Small style={{ color: colors.textSecondary }}>
          {isRegistering ? 'Ya tienes cuenta?  ' : 'Nueva por aqui?  '}
        </Small>
        <TextStyled
          variant="smallMedium"
          style={{ color: colors.text, textDecorationLine: 'underline' }}
        >
          {isRegistering ? 'Inicia sesion' : 'Crea una cuenta'}
        </TextStyled>
      </Pressable>
    </Page>
  );
}

const styles = StyleSheet.create({
  brand: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  hero: {
    marginBottom: Spacing['2xl'],
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
    width: '100%',
  },
  profileImage: { width: 96, height: 96, borderRadius: 48 },
  placeholderImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    marginTop: Spacing.xl,
  },
  form: { width: '100%' },
  languageRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  langBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    borderRadius: Radii.sm,
    borderWidth: 1,
  },
  toggle: {
    marginTop: Spacing.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: Radii.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  googleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
});

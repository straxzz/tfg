import { auth } from '@/src/config/firebase';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { useBreakpoint } from '@/src/hooks/useBreakpoint';
import { useWebTitle } from '@/src/hooks/useWebTitle';
import { purchaseListing } from '@/src/service/marketplaceService';
import { MarketplaceListing } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Button, Caption, Eyebrow, Small, TextStyled } from '@/src/components';
import { Fonts, Radii, Spacing } from '@/src/constants/theme';

// ─── Formatters ───────────────────────────────────────────────────────────────
function fmtCard(text: string) {
  return text.replace(/\D/g, '').slice(0, 16).replace(/(.{4})(?=.)/g, '$1 ');
}
function fmtExpiry(text: string) {
  const d = text.replace(/\D/g, '').slice(0, 4);
  return d.length >= 3 ? d.slice(0, 2) + '/' + d.slice(2) : d;
}

// ─── Métodos de pago ──────────────────────────────────────────────────────────
type PayMethod = 'card' | 'paypal' | 'bizum' | 'applepay';

const PAY_METHODS: { id: PayMethod; label: string; icon: string; sublabel: string }[] = [
  { id: 'card',     label: 'Tarjeta',    icon: 'card-outline',        sublabel: 'Débito / Crédito' },
  { id: 'paypal',   label: 'PayPal',     icon: 'logo-paypal',         sublabel: 'Cuenta PayPal'    },
  { id: 'bizum',    label: 'Bizum',      icon: 'phone-portrait-outline', sublabel: 'Pago móvil'    },
  { id: 'applepay', label: 'Apple Pay',  icon: 'logo-apple',          sublabel: 'Touch / Face ID'  },
];

export default function CheckoutScreen() {
  const params  = useLocalSearchParams<Record<string, string>>();
  const colors  = useThemeColor();
  const user    = auth.currentUser;
  const { contentMaxWidth, screenPadding } = useBreakpoint();
  useWebTitle('Pago · Virtual Closet');

  const listing: MarketplaceListing = {
    id:          params.id          ?? '',
    clothingId:  params.clothingId  ?? '',
    sellerId:    params.sellerId    ?? '',
    sellerName:  params.sellerName  ?? '',
    sellerPhoto: params.sellerPhoto ?? null,
    name:        params.name        ?? '',
    brand:       params.brand       ?? '',
    category:    (params.category   as any) ?? 'Otros',
    color:       params.color       ?? '',
    size:        params.size        ?? null,
    image:       params.image       ?? '',
    price:       Number(params.price ?? 0),
    description: params.description ?? '',
    status:      'available',
    createdAt:   null as any,
  };

  const [method,     setMethod]     = useState<PayMethod>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName,   setCardName]   = useState('');
  const [expiry,     setExpiry]     = useState('');
  const [cvv,        setCvv]        = useState('');
  const [paying,     setPaying]     = useState(false);
  const [success,    setSuccess]    = useState(false);

  const cardValid =
    cardNumber.replace(/\s/g, '').length === 16 &&
    cardName.trim().length > 2 &&
    expiry.length === 5 &&
    cvv.length >= 3;

  const canPay = method !== 'card' || cardValid;

  const handlePay = async () => {
    if (!canPay || !user) return;
    setPaying(true);
    try {
      await purchaseListing(listing, user.uid);
      setSuccess(true);
      setTimeout(() => router.replace({ pathname: '/(tabs)/market', params: { defaultTab: 'purchases' } }), 2200);
    } catch {
      setPaying(false);
      alert('No se pudo procesar el pago. Inténtalo de nuevo.');
    }
  };

  // ── Pantalla de éxito ──────────────────────────────────────────────────────
  if (success) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: screenPadding }]}>
        <Stack.Screen options={{ title: 'Pago completado · Virtual Closet' }} />
        <View style={[styles.successIcon, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
          <Ionicons name="checkmark" size={44} color={colors.text} />
        </View>
        <TextStyled style={{ fontFamily: Fonts.serif, fontSize: 32, color: colors.text, marginTop: Spacing['2xl'], textAlign: 'center' }}>
          ¡Compra realizada!
        </TextStyled>
        <Small style={{ color: colors.textSecondary, marginTop: Spacing.md, textAlign: 'center', maxWidth: 280 }}>
          "{listing.name}" se ha añadido a tu armario.
        </Small>
        <Caption style={{ marginTop: Spacing['3xl'], color: colors.textMuted }}>Redirigiendo…</Caption>
      </View>
    );
  }

  // ── Formulario ─────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: 'Pago · Virtual Closet' }} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Spacing['4xl'],
          paddingHorizontal: screenPadding,
          paddingTop: Spacing['3xl'],
          maxWidth: contentMaxWidth,
          alignSelf: 'center',
          width: '100%',
        }}
      >
        {/* Back */}
        <Pressable onPress={() => router.back()} style={styles.backRow}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
          <Caption style={{ marginLeft: Spacing.sm }}>Volver</Caption>
        </Pressable>

        <Eyebrow style={{ marginTop: Spacing.lg }}>PAGO SIMULADO</Eyebrow>
        <TextStyled style={{ fontFamily: Fonts.serif, fontSize: 34, color: colors.text, marginTop: Spacing.sm, marginBottom: Spacing['2xl'] }}>
          Resumen del pedido
        </TextStyled>

        {/* Item card */}
        <View style={[styles.itemRow, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
          <View style={[styles.itemThumb, { backgroundColor: colors.background, borderColor: colors.border }]}>
            {listing.image
              ? <Image source={{ uri: listing.image }} style={styles.itemImg} />
              : <Ionicons name="shirt-outline" size={28} color={colors.textMuted} />}
          </View>
          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <TextStyled style={{ fontFamily: Fonts.serif, fontSize: 17, color: colors.text }} numberOfLines={2}>
              {listing.name}
            </TextStyled>
            <Caption style={{ marginTop: 3 }}>de {listing.sellerName}</Caption>
            {listing.brand ? <Caption>{listing.brand}</Caption> : null}
          </View>
          <TextStyled style={{ fontFamily: Fonts.serif, fontSize: 22, color: colors.text }}>
            {listing.price} €
          </TextStyled>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: Spacing['2xl'] }]} />

        {/* Selector de método de pago */}
        <Eyebrow style={{ marginBottom: Spacing.lg }}>MÉTODO DE PAGO</Eyebrow>
        <View style={styles.methodGrid}>
          {PAY_METHODS.map(m => {
            const selected = method === m.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => setMethod(m.id)}
                style={({ pressed }) => [
                  styles.methodCard,
                  {
                    borderColor:       selected ? colors.text : colors.border,
                    backgroundColor:   selected ? colors.text : colors.backgroundSecondary,
                    opacity:           pressed ? 0.85 : 1,
                    borderWidth:       selected ? 2 : 1,
                  },
                ]}
              >
                <Ionicons name={m.icon as any} size={22} color={selected ? colors.primaryText : colors.text} />
                <TextStyled style={{ fontFamily: Fonts.sans, fontSize: 13, fontWeight: '600', color: selected ? colors.primaryText : colors.text, marginTop: 6 }}>
                  {m.label}
                </TextStyled>
                <Caption style={{ color: selected ? colors.primaryText : colors.textMuted, opacity: selected ? 0.75 : 1, textAlign: 'center', marginTop: 2 }}>
                  {m.sublabel}
                </Caption>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: Spacing['2xl'] }]} />

        {/* Contenido según método */}
        {method === 'card' && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xl }}>
              <Eyebrow>DATOS DE LA TARJETA</Eyebrow>
              <Pressable
                onPress={() => { setCardNumber('4242 4242 4242 4242'); setCardName('Test Usuario'); setExpiry('12/26'); setCvv('123'); }}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, flexDirection: 'row', alignItems: 'center', gap: 4 })}
              >
                <Ionicons name="flash-outline" size={13} color={colors.textMuted} />
                <Caption>Autocompletar</Caption>
              </Pressable>
            </View>

            <Field label="NÚMERO DE TARJETA" colors={colors}>
              <TextInput
                value={cardNumber}
                onChangeText={t => setCardNumber(fmtCard(t))}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                maxLength={19}
                style={[styles.input, { color: colors.text, fontFamily: Fonts.sans }]}
              />
            </Field>

            <Field label="TITULAR" colors={colors} style={{ marginTop: Spacing.md }}>
              <TextInput
                value={cardName}
                onChangeText={setCardName}
                placeholder="Nombre Apellido"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
                style={[styles.input, { color: colors.text, fontFamily: Fonts.sans }]}
              />
            </Field>

            <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md }}>
              <Field label="CADUCIDAD" colors={colors} style={{ flex: 1 }}>
                <TextInput
                  value={expiry}
                  onChangeText={t => setExpiry(fmtExpiry(t))}
                  placeholder="MM/AA"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  maxLength={5}
                  style={[styles.input, { color: colors.text, fontFamily: Fonts.sans }]}
                />
              </Field>
              <Field label="CVV" colors={colors} style={{ flex: 1 }}>
                <TextInput
                  value={cvv}
                  onChangeText={t => setCvv(t.replace(/\D/g, '').slice(0, 4))}
                  placeholder="123"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                  style={[styles.input, { color: colors.text, fontFamily: Fonts.sans }]}
                />
              </Field>
            </View>
          </>
        )}

        {method === 'paypal' && (
          <View style={[styles.altPayBox, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
            <Ionicons name="logo-paypal" size={36} color={colors.text} />
            <TextStyled style={{ fontFamily: Fonts.serif, fontSize: 18, color: colors.text, marginTop: Spacing.md }}>
              Pagar con PayPal
            </TextStyled>
            <Small style={{ color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm, maxWidth: 240 }}>
              Serás redirigido a PayPal para completar el pago de forma segura. (Simulado)
            </Small>
          </View>
        )}

        {method === 'bizum' && (
          <View style={[styles.altPayBox, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
            <Ionicons name="phone-portrait-outline" size={36} color={colors.text} />
            <TextStyled style={{ fontFamily: Fonts.serif, fontSize: 18, color: colors.text, marginTop: Spacing.md }}>
              Pagar con Bizum
            </TextStyled>
            <Small style={{ color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm, maxWidth: 240 }}>
              Recibirás una notificación en tu app bancaria para confirmar el pago. (Simulado)
            </Small>
          </View>
        )}

        {method === 'applepay' && (
          <View style={[styles.altPayBox, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
            <Ionicons name="logo-apple" size={36} color={colors.text} />
            <TextStyled style={{ fontFamily: Fonts.serif, fontSize: 18, color: colors.text, marginTop: Spacing.md }}>
              Pagar con Apple Pay
            </TextStyled>
            <Small style={{ color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm, maxWidth: 240 }}>
              Confirma el pago con Touch ID o Face ID en tu dispositivo Apple. (Simulado)
            </Small>
          </View>
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Ionicons name="lock-closed-outline" size={13} color={colors.textMuted} />
          <Small style={{ color: colors.textMuted, flex: 1, marginLeft: Spacing.sm }}>
            Pago 100% simulado. Ningún dato es procesado ni almacenado.
          </Small>
        </View>

        {/* Botón pagar */}
        <View style={{ marginTop: Spacing['2xl'] }}>
          {paying
            ? <ActivityIndicator size="small" color={colors.text} />
            : <Button
                label={`PAGAR ${listing.price} €`}
                icon="bag-check-outline"
                size="lg"
                onPress={handlePay}
                disabled={!canPay}
              />}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Subcomponente campo ──────────────────────────────────────────────────────
function Field({ label, colors, children, style }: { label: string; colors: any; children: React.ReactNode; style?: object }) {
  return (
    <View style={[{ borderWidth: 1, borderRadius: Radii.sm, padding: Spacing.md, borderColor: colors.border, backgroundColor: colors.backgroundSecondary }, style]}>
      <Caption style={{ marginBottom: 4 }}>{label}</Caption>
      {children}
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:   { flex: 1 },
  backRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  itemRow:     { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, borderRadius: Radii.lg, borderWidth: 1 },
  itemThumb:   { width: 76, height: 76, borderRadius: Radii.md, borderWidth: 1, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  itemImg:     { width: '100%', height: '100%', resizeMode: 'cover' },
  divider:     { height: 1 },
  input:       { fontSize: 16, paddingVertical: Spacing.xs },
  disclaimer:  { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xl },
  successIcon: { width: 96, height: 96, borderRadius: 48, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  methodGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  methodCard:  { flex: 1, minWidth: 120, alignItems: 'center', paddingVertical: Spacing.lg, paddingHorizontal: Spacing.sm, borderRadius: Radii.lg },
  altPayBox:   { alignItems: 'center', padding: Spacing['2xl'], borderRadius: Radii.lg, borderWidth: 1 },
});

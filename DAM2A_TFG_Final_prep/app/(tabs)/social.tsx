import { auth, db, storage } from '@/src/config/firebase';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { useWebTitle } from '@/src/hooks/useWebTitle';
import { useBreakpoint } from '@/src/hooks/useBreakpoint';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  addDoc, collection, doc, getDocs, onSnapshot,
  orderBy, query, serverTimestamp, updateDoc, where,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { getMessages as subscribeToMessages, sendMessage as sendGlobalMessage } from '@/src/service/chatService';
import { ClothingItem, FriendRequest, UserProfile } from '@/src/types';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView,
  Modal, Platform, Pressable, ScrollView, StyleSheet,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import {
  Avatar, Caption, Card, Chip, Eyebrow, H1, H3, Italic, Small, TextStyled,
} from '@/src/components';
import { Fonts, Layout, Radii, Spacing } from '@/src/constants/theme';

function formatTime(ts: any): string {
  if (!ts) return '';
  try { const d = ts.toDate ? ts.toDate() : new Date(ts); return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}

function formatDateSep(ts: any): string {
  if (!ts) return '';
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const today = new Date(); today.setHours(0,0,0,0);
    const msgDay = new Date(d.getTime()); msgDay.setHours(0,0,0,0);
    const diff = today.getTime() - msgDay.getTime();
    if (diff === 0) return 'Hoy';
    if (diff === 86400000) return 'Ayer';
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
  } catch { return ''; }
}

function uriToBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response);
    xhr.onerror = () => reject(new TypeError('Network request failed'));
    xhr.responseType = 'blob'; xhr.open('GET', uri, true); xhr.send(null);
  });
}

async function uploadChatImage(uid: string, uri: string): Promise<string> {
  const blob = await uriToBlob(uri);
  const storageRef = ref(storage, `chat_images/${uid}/${Date.now()}.jpg`);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}

import { router, Stack } from 'expo-router';

type ViewMode = 'chats' | 'explore' | 'requests';

export default function SocialScreen() {
  const colors = useThemeColor();
  const { contentMaxWidth, screenPadding } = useBreakpoint();
  const user = auth.currentUser;

  const [viewMode, setViewMode] = useState<ViewMode>('chats');
  const [loading, setLoading] = useState(false);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [sentRequestIds, setSentRequestIds] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [clothesCounts, setClothesCounts] = useState<Record<string, number>>({});

  const [activeChatUser, setActiveChatUser] = useState<UserProfile | null>(null);
  const [isGlobalChat, setIsGlobalChat] = useState(false);
  const [viewingProfile, setViewingProfile] = useState<UserProfile | null>(null);
  const [viewingClothes, setViewingClothes] = useState<ClothingItem[]>([]);

  const totalItems   = Object.values(clothesCounts).reduce((s, n) => s + n, 0);
  const totalMembers = allUsers.length + friends.length + 1;
  const topUsers     = [...allUsers, ...friends]
    .filter((u) => !u.isPrivate)
    .sort((a, b) => (clothesCounts[b.uid] || 0) - (clothesCounts[a.uid] || 0))
    .slice(0, 5);

  const webTitle = isGlobalChat
    ? 'Chat global · Virtual Closet'
    : activeChatUser
    ? `${activeChatUser.firstName || activeChatUser.email?.split('@')[0]} · Virtual Closet`
    : viewingProfile
    ? `${viewingProfile.firstName || viewingProfile.email?.split('@')[0]} · Virtual Closet`
    : 'Social · Virtual Closet';
  useWebTitle(webTitle);
  const [loadingClothes, setLoadingClothes] = useState(false);

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!user) return;
    const qRec = query(collection(db, 'friend_requests'), where('toUid', '==', user.uid), where('status', '==', 'pending'));
    const unsubRec = onSnapshot(qRec, (s) => setRequests(s.docs.map((d) => ({ id: d.id, ...d.data() } as FriendRequest))));
    const qSen = query(collection(db, 'friend_requests'), where('fromUid', '==', user.uid), where('status', '==', 'pending'));
    const unsubSen = onSnapshot(qSen, (s) => setSentRequestIds(s.docs.map((d) => d.data().toUid)));

    const fetchAll = async () => {
      setLoading(true);
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const ud: UserProfile[] = [];
        usersSnap.forEach((d) => { if (d.id !== user.uid) ud.push({ uid: d.id, ...d.data() } as UserProfile); });
        const [sSnap, rSnap] = await Promise.all([
          getDocs(query(collection(db, 'friend_requests'), where('fromUid', '==', user.uid), where('status', '==', 'accepted'))),
          getDocs(query(collection(db, 'friend_requests'), where('toUid', '==', user.uid), where('status', '==', 'accepted'))),
        ]);
        const fids = new Set<string>();
        sSnap.forEach((d) => fids.add(d.data().toUid));
        rSnap.forEach((d) => fids.add(d.data().fromUid));
        setFriends(ud.filter((u) => fids.has(u.uid)));
        const strangers = ud.filter((u) => !fids.has(u.uid));
        setAllUsers(strangers); setFilteredUsers(strangers);
        const cs = await getDocs(collection(db, 'clothes'));
        const counts: Record<string, number> = {};
        cs.forEach((d) => { const uid = d.data().userId; if (uid) counts[uid] = (counts[uid] || 0) + 1; });
        setClothesCounts(counts);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchAll();
    return () => { unsubRec(); unsubSen(); };
  }, [user, viewMode]);

  useEffect(() => {
    if (!searchText.trim()) setFilteredUsers(allUsers);
    else {
      const l = searchText.toLowerCase();
      setFilteredUsers(allUsers.filter((u) => (u.firstName && u.firstName.toLowerCase().includes(l)) || u.email.toLowerCase().includes(l)));
    }
  }, [searchText, allUsers]);

  useEffect(() => {
    if ((!activeChatUser && !isGlobalChat) || !user) return;
    if (isGlobalChat) return subscribeToMessages((msgs) => setMessages(msgs));
    if (activeChatUser) {
      const chatId = [user.uid, activeChatUser.uid].sort().join('_');
      const q = query(collection(db, 'private_chats', chatId, 'messages'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, (s) => setMessages(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
      return () => unsub();
    }
  }, [activeChatUser, isGlobalChat]);

  const pickChatImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.7,
    });
    if (!result.canceled) { setPendingImage(result.assets[0].uri); }
  };

  const takeChatPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permiso', 'Necesitamos acceso a la camara');
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7 });
    if (!result.canceled) { setPendingImage(result.assets[0].uri); }
  };

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text && !pendingImage) return;
    if (!user) return;
    setSending(true);
    const localImg = pendingImage;
    setInputText(''); setPendingImage(null);
    try {
      let imageUrl: string | undefined;
      if (localImg) imageUrl = await uploadChatImage(user.uid, localImg);
      const payload: any = { text, userId: user.uid, userEmail: user.email, createdAt: serverTimestamp() };
      if (imageUrl) payload.imageUrl = imageUrl;
      if (isGlobalChat) {
        await addDoc(collection(db, 'global_chat'), payload);
      } else if (activeChatUser) {
        const chatId = [user.uid, activeChatUser.uid].sort().join('_');
        await addDoc(collection(db, 'private_chats', chatId, 'messages'), payload);
      }
    } catch (e) { console.error(e); Alert.alert('Error', 'No se pudo enviar.'); }
    finally { setSending(false); }
  };

  const handleViewProfile = async (targetUser: UserProfile) => {
    const isFriend = friends.some((f) => f.uid === targetUser.uid);
    if (targetUser.isPrivate && !isFriend) { Alert.alert('Perfil privado', 'Solo sus amigos pueden ver el armario.'); return; }
    setViewingProfile(targetUser); setViewingClothes([]); setLoadingClothes(true);
    try {
      const q = query(collection(db, 'clothes'), where('userId', '==', targetUser.uid));
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ClothingItem));
      items.sort((a, b) => (!a.createdAt || !b.createdAt) ? 0 : b.createdAt.toMillis() - a.createdAt.toMillis());
      setViewingClothes(items);
    } catch (e) { console.error(e); }
    finally { setLoadingClothes(false); }
  };

  const closeProfile = () => { setViewingProfile(null); setViewingClothes([]); };

  const sendFriendRequest = async (targetUser: UserProfile) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'friend_requests'), {
        fromUid: user.uid,
        fromEmail: user.email ?? '',
        fromName: user.displayName || user.email?.split('@')[0] || 'Usuario',
        fromPhoto: user.photoURL ?? null,
        toUid: targetUser.uid,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
    } catch { Alert.alert('Error', 'No se pudo enviar la solicitud.'); }
  };

  const respondRequest = async (reqId: string, response: 'accepted' | 'rejected') => {
    try { await updateDoc(doc(db, 'friend_requests', reqId), { status: response }); if (response === 'accepted') setViewMode('chats'); }
    catch (e) { console.error(e); }
  };

  const canSend = (inputText.trim().length > 0 || !!pendingImage) && !sending;

  const ImagePreviewModal = (
    <Modal visible={!!previewImage} transparent animationType="fade">
      <Pressable style={styles.previewOverlay} onPress={() => setPreviewImage(null)}>
        <Image source={{ uri: previewImage! }} style={styles.previewFull} resizeMode="contain" />
        <TouchableOpacity style={styles.previewClose} onPress={() => setPreviewImage(null)}>
          <Ionicons name="close" size={22} color="#fff" />
        </TouchableOpacity>
      </Pressable>
    </Modal>
  );

  if (isGlobalChat || activeChatUser) {
    const chatTitle = isGlobalChat ? 'Chat global' : (activeChatUser?.firstName || activeChatUser?.email?.split('@')[0]);
    const chatSubtitle = isGlobalChat ? 'Todos los usuarios · tiempo real' : (activeChatUser?.email || '');

    const withSeps: any[] = [];
    let lastDate = '';
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      const dl = formatDateSep(m.createdAt);
      if (dl && dl !== lastDate) { withSeps.unshift({ _isSep: true, label: dl, id: 'sep_' + i }); lastDate = dl; }
      withSeps.unshift(m);
    }

    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.container, { backgroundColor: colors.background, alignItems: 'center' }]}>
        <Stack.Screen options={{ title: 'Chat · Virtual Closet' }} />
        {ImagePreviewModal}

        {/* Header */}
        <View style={[styles.chatHeader, { borderBottomColor: colors.border, paddingHorizontal: screenPadding, width: '100%', maxWidth: contentMaxWidth }]}>
          <TouchableOpacity onPress={() => { setActiveChatUser(null); setIsGlobalChat(false); setPendingImage(null); }} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={{ marginHorizontal: Spacing.md }}>
            {isGlobalChat
              ? <View style={[styles.globeAvatar, { backgroundColor: colors.text }]}><Ionicons name="planet-outline" size={18} color={colors.primaryText} /></View>
              : <Avatar uri={activeChatUser?.photoURL} name={activeChatUser?.firstName || activeChatUser?.email} size={38} bordered />}
          </View>
          <View style={{ flex: 1 }}>
            <TextStyled style={{ fontFamily: Fonts.serif, fontSize: 19, color: colors.text, lineHeight: 23 }}>{chatTitle}</TextStyled>
            <Caption>{chatSubtitle}</Caption>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          data={withSeps}
          inverted
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: screenPadding, paddingBottom: Spacing.xl, width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center' }}
          style={{ width: '100%' }}
          renderItem={({ item }) => {
            if (item._isSep) {
              return (
                <View style={styles.dateSep}>
                  <View style={[styles.dateLine, { backgroundColor: colors.border }]} />
                  <TextStyled style={{ fontSize: 11, color: colors.textMuted, fontFamily: Fonts.sans, marginHorizontal: Spacing.md, letterSpacing: 0.5 }}>
                    {item.label.toUpperCase()}
                  </TextStyled>
                  <View style={[styles.dateLine, { backgroundColor: colors.border }]} />
                </View>
              );
            }
            const isMe = item.userId === user?.uid;
            const senderName = item.userEmail?.split('@')[0] || 'Usuario';
            const hasText = item.text && item.text.trim().length > 0;
            const hasImage = !!item.imageUrl;

            return (
              <View style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', marginVertical: 3, maxWidth: '82%' }}>
                {!isMe && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4, marginLeft: Spacing.sm }}>
                    {isGlobalChat && <Avatar name={senderName} size={16} />}
                    <Caption style={{ color: colors.textSecondary }}>{senderName}</Caption>
                  </View>
                )}
                <View style={[
                  styles.bubble,
                  { backgroundColor: isMe ? colors.text : colors.backgroundSecondary,
                    borderTopRightRadius: isMe ? 4 : 18,
                    borderTopLeftRadius: isMe ? 18 : 4 },
                  !isMe && { borderWidth: 1, borderColor: colors.border },
                  hasImage && !hasText && { padding: 3 },
                ]}>
                  {hasImage && (
                    <Pressable onPress={() => setPreviewImage(item.imageUrl)}
                      style={{ borderRadius: 14, overflow: 'hidden', marginBottom: hasText ? 7 : 0 }}>
                      <Image source={{ uri: item.imageUrl }} style={styles.chatImage} resizeMode="cover" />
                    </Pressable>
                  )}
                  {hasText && (
                    <TextStyled style={{ color: isMe ? colors.primaryText : colors.text, fontSize: 15, lineHeight: 22 }}>
                      {item.text}
                    </TextStyled>
                  )}
                  <TextStyled style={{ color: isMe ? colors.primaryText : colors.textMuted, fontSize: 10, opacity: 0.55, marginTop: hasText ? 3 : 1, alignSelf: isMe ? 'flex-end' : 'flex-start' }}>
                    {formatTime(item.createdAt)}
                  </TextStyled>
                </View>
              </View>
            );
          }}
        />

        {/* Pending image preview strip */}
        {pendingImage && (
          <View style={[styles.pendingBar, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary, width: '100%', maxWidth: contentMaxWidth, paddingHorizontal: screenPadding }]}>
            <View style={styles.pendingWrap}>
              <Image source={{ uri: pendingImage }} style={styles.pendingThumb} />
              <Pressable style={styles.pendingRemove} onPress={() => setPendingImage(null)}>
                <Ionicons name="close-circle" size={22} color="#fff" />
              </Pressable>
            </View>
            <Caption style={{ marginLeft: Spacing.md, flex: 1, color: colors.textSecondary }}>Foto lista para enviar</Caption>
          </View>
        )}

        {/* Input bar */}
        <View style={[styles.inputBar, { borderTopColor: colors.border, backgroundColor: colors.background, paddingHorizontal: screenPadding, width: '100%', maxWidth: contentMaxWidth }]}>
          <Pressable onPress={() => inputRef.current?.focus()}
            style={styles.inputActionBtn}>
            <Ionicons name="happy-outline" size={22} color={colors.text} />
          </Pressable>
          <Pressable onPress={takeChatPhoto} style={styles.inputActionBtn}>
            <Ionicons name="camera-outline" size={22} color={colors.text} />
          </Pressable>
          <Pressable onPress={pickChatImage} style={styles.inputActionBtn}>
            <Ionicons name="image-outline" size={22} color={colors.text} />
          </Pressable>
          <TextInput
            ref={inputRef}
            value={inputText}
            onChangeText={setInputText}
            placeholder={pendingImage ? 'Escribe algo...' : 'Mensaje...'}
            placeholderTextColor={colors.textMuted}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
            multiline
            style={[styles.chatInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.backgroundSecondary, fontFamily: Fonts.sans }]}
          />
          <Pressable onPress={sendMessage} disabled={!canSend}
            style={[styles.sendBtn, { backgroundColor: canSend ? colors.text : colors.backgroundSecondary }]}>
            {sending
              ? <ActivityIndicator size="small" color={canSend ? colors.primaryText : colors.textMuted} />
              : <Ionicons name="arrow-up" size={18} color={canSend ? colors.primaryText : colors.textMuted} />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (viewingProfile) {
    const isFriend = friends.some((f) => f.uid === viewingProfile.uid);
    const isPending = sentRequestIds.includes(viewingProfile.uid);
    const CELL = (Math.min(400, contentMaxWidth - screenPadding * 2) - 8) / 3;
    const categories = viewingClothes.reduce<Record<string, number>>((acc, c) => { if (c.category) acc[c.category] = (acc[c.category] || 0) + 1; return acc; }, {});
    const catList = Object.entries(categories).sort((a, b) => b[1] - a[1]).slice(0, 4);

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Perfil · Virtual Closet' }} />
        <View style={[styles.profileSheetHeader, { borderBottomColor: colors.border, paddingHorizontal: screenPadding }]}>
          <TouchableOpacity onPress={closeProfile} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          {!isFriend && (
            <Pressable onPress={() => !isPending && sendFriendRequest(viewingProfile)} disabled={isPending}
              style={[styles.followBtn, { backgroundColor: isPending ? 'transparent' : colors.text, borderColor: isPending ? colors.border : colors.text }]}>
              <TextStyled variant="caption" style={{ color: isPending ? colors.textSecondary : colors.primaryText, letterSpacing: 1 }}>
                {isPending ? 'PENDIENTE' : 'SEGUIR'}
              </TextStyled>
            </Pressable>
          )}
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: Spacing['4xl'], paddingHorizontal: screenPadding, maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }}>
          <View style={styles.profileHero}>
            <Avatar uri={viewingProfile.photoURL} name={viewingProfile.firstName || viewingProfile.email} size={88} bordered />
            <TextStyled style={{ fontFamily: Fonts.serif, fontSize: 26, color: colors.text, marginTop: Spacing.lg, textAlign: 'center' }}>
              {viewingProfile.firstName || viewingProfile.email?.split('@')[0]}
            </TextStyled>
            {viewingProfile.isPrivate && (
              <View style={[styles.privateBadge, { borderColor: colors.border }]}>
                <Ionicons name="lock-closed-outline" size={11} color={colors.textMuted} />
                <Caption style={{ marginLeft: 4 }}>Perfil privado</Caption>
              </View>
            )}
          </View>
          <View style={[styles.profileStats, { borderColor: colors.border }]}>
            <View style={styles.profileStatItem}>
              <TextStyled style={{ fontFamily: Fonts.serif, fontSize: 24, color: colors.text }}>{viewingClothes.length}</TextStyled>
              <Eyebrow style={{ marginTop: 2 }}>PRENDAS</Eyebrow>
            </View>
            {catList.length > 0 && (
              <>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={[styles.profileStatItem, { flex: 2, alignItems: 'flex-start', paddingHorizontal: Spacing.md }]}>
                  <Eyebrow style={{ marginBottom: Spacing.xs }}>CATEGORIAS</Eyebrow>
                  <View style={{ flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap' }}>
                    {catList.map(([cat, n]) => (
                      <View key={cat} style={[styles.catPill, { borderColor: colors.border }]}>
                        <Caption>{cat} · {n}</Caption>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            )}
          </View>
          {isFriend && (
            <Pressable onPress={() => { setViewingProfile(null); setActiveChatUser(viewingProfile); setIsGlobalChat(false); }}
              style={[styles.chatWithBtn, { backgroundColor: colors.text }]}>
              <Ionicons name="chatbubble-outline" size={16} color={colors.primaryText} />
              <TextStyled variant="smallMedium" style={{ color: colors.primaryText, marginLeft: Spacing.sm, letterSpacing: 1 }}>ENVIAR MENSAJE</TextStyled>
            </Pressable>
          )}
          <Eyebrow style={{ marginTop: Spacing['2xl'], marginBottom: Spacing.md }}>{viewingClothes.length > 0 ? 'ARMARIO' : ''}</Eyebrow>
          {loadingClothes
            ? <ActivityIndicator size="small" color={colors.text} style={{ marginTop: Spacing.xl }} />
            : viewingClothes.length === 0
              ? <Small style={{ color: colors.textMuted }}>Este armario esta vacio.</Small>
              : <View style={styles.clothesGrid}>
                  {viewingClothes.map((c) => (
                    <Pressable
                      key={c.id}
                      onPress={() => router.push({ pathname: '/details/[id]', params: { id: c.id, readOnly: 'true' } })}
                      style={({ pressed }) => [
                        styles.clothesTile,
                        { width: CELL, height: CELL * 1.15, backgroundColor: colors.backgroundSecondary, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
                      ]}
                    >
                      {c.image ? <Image source={{ uri: c.image }} style={styles.clothesImg} /> : <Ionicons name="image-outline" size={20} color={colors.textMuted} />}
                    </Pressable>
                  ))}
                </View>}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center' }]}>
      <Stack.Screen options={{ title: 'Social · Virtual Closet' }} />
      <View style={{ width: '100%', maxWidth: contentMaxWidth, paddingHorizontal: screenPadding, paddingTop: Spacing['3xl'] + Spacing.lg, paddingBottom: Spacing.lg }}>
        <Eyebrow>COMUNIDAD</Eyebrow>
        <H1 style={{ marginTop: Spacing.sm }}><Italic>Social</Italic></H1>
      </View>
      <View style={[styles.tabRow, { borderBottomColor: colors.border, paddingHorizontal: screenPadding, width: '100%', maxWidth: contentMaxWidth }]}>
        {(['chats', 'explore', 'requests'] as ViewMode[]).map((m) => {
          const labels: Record<ViewMode, string> = { chats: 'Chats', explore: 'Explorar', requests: 'Solicitudes' + (requests.length ? ' (' + requests.length + ')' : '') };
          return <Chip key={m} label={labels[m]} selected={viewMode === m} onPress={() => setViewMode(m)} />;
        })}
      </View>
      <View style={{ flex: 1, width: '100%', maxWidth: contentMaxWidth, paddingHorizontal: screenPadding, paddingTop: Spacing.lg }}>
        {loading ? <ActivityIndicator size="small" color={colors.text} /> : (
          <>
            {viewMode === 'chats' && (
              <FlatList
                data={friends}
                ListHeaderComponent={() => (
                  <Card onPress={() => { setActiveChatUser(null); setIsGlobalChat(true); }} padding={Spacing.lg} style={{ marginBottom: Spacing.xl }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={[styles.globeAvatar, { backgroundColor: colors.text }]}>
                        <Ionicons name="planet-outline" size={20} color={colors.primaryText} />
                      </View>
                      <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <Eyebrow>EN VIVO</Eyebrow>
                        <H3 style={{ marginTop: Spacing.xs }}>Chat global</H3>
                        <Small style={{ marginTop: 2 }}>Todos los usuarios · tiempo real</Small>
                      </View>
                      <Ionicons name="arrow-forward" size={18} color={colors.text} />
                    </View>
                  </Card>
                )}
                renderItem={({ item }) => (
                  <Pressable onPress={() => { setActiveChatUser(item); setIsGlobalChat(false); }}
                    style={({ pressed }) => [styles.friendRow, { opacity: pressed ? 0.8 : 1 }]}>
                    <Avatar uri={item.photoURL} name={item.firstName || item.email} size={46} bordered />
                    <View style={{ flex: 1, marginLeft: Spacing.md }}>
                      <TextStyled style={{ fontFamily: Fonts.serif, fontSize: 17, color: colors.text }}>{item.firstName || item.email?.split('@')[0]}</TextStyled>
                      <Caption style={{ marginTop: 2 }}>Toca para chatear</Caption>
                    </View>
                    <TouchableOpacity onPress={() => handleViewProfile(item)} style={[styles.iconBtn, { borderColor: colors.border }]}>
                      <Ionicons name="person-outline" size={16} color={colors.text} />
                    </TouchableOpacity>
                    <View style={{ width: Spacing.sm }} />
                    <View style={[styles.iconBtn, { backgroundColor: colors.text }]}>
                      <Ionicons name="chatbubble-outline" size={16} color={colors.primaryText} />
                    </View>
                  </Pressable>
                )}
                keyExtractor={(i) => i.uid}
                ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.border }} />}
                ListEmptyComponent={
                  <View style={{ paddingTop: Spacing.xl }}>
                    <Eyebrow style={{ marginBottom: Spacing.md }}>SUGERENCIAS</Eyebrow>
                    {topUsers.slice(0, 3).map((u) => (
                      <Pressable key={u.uid} onPress={() => handleViewProfile(u)}
                        style={({ pressed }) => [styles.friendRow, { opacity: pressed ? 0.8 : 1 }]}>
                        <Avatar uri={u.photoURL} name={u.firstName || u.email} size={46} bordered />
                        <View style={{ flex: 1, marginLeft: Spacing.md }}>
                          <TextStyled style={{ fontFamily: Fonts.serif, fontSize: 17, color: colors.text }}>{u.firstName || u.email?.split('@')[0]}</TextStyled>
                          <Caption style={{ marginTop: 2 }}>{clothesCounts[u.uid] || 0} prendas</Caption>
                        </View>
                        <Pressable onPress={() => sendFriendRequest(u)}
                          style={[styles.followBtn, { backgroundColor: colors.text, borderColor: colors.text }]}>
                          <TextStyled variant="caption" style={{ color: colors.primaryText, letterSpacing: 1 }}>SEGUIR</TextStyled>
                        </Pressable>
                      </Pressable>
                    ))}
                    {topUsers.length === 0 && (
                      <View style={{ alignItems: 'center', paddingTop: Spacing.xl }}>
                        <Ionicons name="people-outline" size={36} color={colors.textMuted} />
                        <Small style={{ marginTop: Spacing.base, textAlign: 'center', maxWidth: 240 }}>Aún no hay otros usuarios. ¡Sé el primero!</Small>
                      </View>
                    )}
                  </View>
                }
              />
            )}
            {viewMode === 'explore' && (
              <>
                {/* Community stats banner */}
                <View style={[styles.communityBanner, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                  <View style={styles.communityStatBlock}>
                    <TextStyled style={{ fontFamily: Fonts.serif, fontSize: 26, color: colors.text, lineHeight: 30 }}>{totalMembers}</TextStyled>
                    <Caption style={{ marginTop: 2 }}>Usuarios</Caption>
                  </View>
                  <View style={[styles.communityDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.communityStatBlock}>
                    <TextStyled style={{ fontFamily: Fonts.serif, fontSize: 26, color: colors.text, lineHeight: 30 }}>{totalItems}</TextStyled>
                    <Caption style={{ marginTop: 2 }}>Prendas</Caption>
                  </View>
                  <View style={[styles.communityDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.communityStatBlock}>
                    <TextStyled style={{ fontFamily: Fonts.serif, fontSize: 26, color: colors.text, lineHeight: 30 }}>{friends.length}</TextStyled>
                    <Caption style={{ marginTop: 2 }}>Contactos</Caption>
                  </View>
                </View>

                {/* Top closets horizontal scroll */}
                {topUsers.length > 0 && (
                  <View style={{ marginBottom: Spacing.xl }}>
                    <Eyebrow style={{ marginBottom: Spacing.md }}>ARMARIOS DESTACADOS</Eyebrow>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.md }}>
                      {topUsers.map((u) => (
                        <Pressable key={u.uid} onPress={() => handleViewProfile(u)}
                          style={({ pressed }) => [styles.topClosetCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}>
                          <Avatar uri={u.photoURL} name={u.firstName || u.email} size={48} bordered />
                          <TextStyled style={{ fontFamily: Fonts.serif, fontSize: 15, color: colors.text, marginTop: Spacing.sm, textAlign: 'center' }} numberOfLines={1}>
                            {u.firstName || u.email?.split('@')[0]}
                          </TextStyled>
                          <Caption style={{ marginTop: 2 }}>{clothesCounts[u.uid] || 0} prendas</Caption>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}

                <View style={[styles.searchBox, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}>
                  <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
                  <TextInput placeholder="Buscar persona..." placeholderTextColor={colors.textMuted} value={searchText} onChangeText={setSearchText}
                    style={{ flex: 1, marginLeft: Spacing.sm, fontFamily: Fonts.sans, fontSize: 15, color: colors.text, paddingVertical: Spacing.sm }} />
                  {searchText.length > 0 && <Pressable onPress={() => setSearchText('')}><Ionicons name="close-circle" size={18} color={colors.textMuted} /></Pressable>}
                </View>
                <FlatList
                  data={filteredUsers} keyExtractor={(i) => i.uid}
                  ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.border }} />}
                  ListEmptyComponent={<View style={{ alignItems: 'center', paddingTop: Spacing['3xl'] }}><Small>No hay resultados.</Small></View>}
                  renderItem={({ item }) => {
                    const isPending = sentRequestIds.includes(item.uid);
                    const count = clothesCounts[item.uid] || 0;
                    return (
                      <Pressable onPress={() => handleViewProfile(item)} style={({ pressed }) => [styles.exploreRow, { opacity: pressed ? 0.8 : 1 }]}>
                        <Avatar uri={item.photoURL} name={item.firstName || item.email} size={46} bordered />
                        <View style={{ flex: 1, marginLeft: Spacing.md }}>
                          <TextStyled style={{ fontFamily: Fonts.serif, fontSize: 17, color: colors.text }}>{item.firstName || item.email?.split('@')[0]}</TextStyled>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 2 }}>
                            {item.isPrivate
                              ? <><Ionicons name="lock-closed-outline" size={11} color={colors.textMuted} /><Caption>Privado</Caption></>
                              : <><Ionicons name="shirt-outline" size={11} color={colors.textMuted} /><Caption>{count} prendas</Caption></>}
                          </View>
                        </View>
                        <Pressable onPress={() => !isPending && sendFriendRequest(item)} disabled={isPending}
                          style={[styles.followBtn, { backgroundColor: isPending ? 'transparent' : colors.text, borderColor: isPending ? colors.border : colors.text }]}>
                          <TextStyled variant="caption" style={{ color: isPending ? colors.textSecondary : colors.primaryText, letterSpacing: 1 }}>{isPending ? 'PENDIENTE' : 'SEGUIR'}</TextStyled>
                        </Pressable>
                      </Pressable>
                    );
                  }}
                />
              </>
            )}
            {viewMode === 'requests' && (
              <FlatList
                data={requests} keyExtractor={(i) => i.id}
                ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.border }} />}
                ListEmptyComponent={<View style={{ alignItems: 'center', paddingTop: Spacing['3xl'] }}><Ionicons name="checkmark-circle-outline" size={36} color={colors.textMuted} /><Small style={{ marginTop: Spacing.base }}>No tienes solicitudes pendientes.</Small></View>}
                renderItem={({ item }) => (
                  <View style={styles.requestRow}>
                    <Avatar name={item.fromName} uri={item.fromPhoto} size={46} bordered />
                    <View style={{ flex: 1, marginLeft: Spacing.md }}>
                      <TextStyled style={{ fontFamily: Fonts.serif, fontSize: 17, color: colors.text }}>{item.fromName}</TextStyled>
                      <Caption style={{ marginTop: 2 }}>Quiere conectar contigo</Caption>
                    </View>
                    <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                      <Pressable onPress={() => respondRequest(item.id, 'rejected')} style={[styles.iconBtn, { borderColor: colors.border }]}><Ionicons name="close" size={18} color={colors.text} /></Pressable>
                      <Pressable onPress={() => respondRequest(item.id, 'accepted')} style={[styles.iconBtn, { backgroundColor: colors.text }]}><Ionicons name="checkmark" size={18} color={colors.primaryText} /></Pressable>
                    </View>
                  </View>
                )}
              />
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabRow: { flexDirection: 'row', gap: Spacing.xl, borderBottomWidth: 1, paddingBottom: Spacing.md },
  friendRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.lg },
  exploreRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.lg },
  requestRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.lg },
  followBtn: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: Radii.sm, borderWidth: 1 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  globeAvatar: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, borderWidth: 1, borderRadius: Radii.sm, height: 46, marginBottom: Spacing.lg },
  chatHeader: { flexDirection: 'row', alignItems: 'center', paddingTop: Layout.headerTopOffset, paddingBottom: Spacing.lg, borderBottomWidth: 1 },
  bubble: { paddingVertical: 9, paddingHorizontal: 13, borderRadius: 18 },
  chatImage: { width: 220, height: 200, borderRadius: 12 },
  dateSep: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.lg },
  dateLine: { flex: 1, height: 1 },
  pendingBar: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderTopWidth: 1, borderBottomWidth: 1 },
  pendingWrap: { position: 'relative' },
  pendingThumb: { width: 56, height: 56, borderRadius: 10 },
  pendingRemove: { position: 'absolute', top: -8, right: -8 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingTop: Spacing.md, paddingBottom: Spacing['2xl'], borderTopWidth: 1, gap: Spacing.xs },
  inputActionBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', borderRadius: 18 },
  chatInput: { flex: 1, paddingVertical: Spacing.md, paddingHorizontal: Spacing.base, borderWidth: 1, borderRadius: 22, fontSize: 15, maxHeight: 100 },
  sendBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  previewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  previewFull: { width: '92%', height: '75%' },
  previewClose: { position: 'absolute', top: Layout.headerTopOffset, right: 20, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  profileSheetHeader: { flexDirection: 'row', alignItems: 'center', paddingTop: Layout.headerTopOffset, paddingBottom: Spacing.lg, borderBottomWidth: 1 },
  profileHero: { alignItems: 'center', paddingTop: Spacing['2xl'], paddingBottom: Spacing.lg },
  privateBadge: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 999, paddingHorizontal: Spacing.md, paddingVertical: 3, marginTop: Spacing.sm },
  profileStats: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: Spacing.md, marginBottom: Spacing.xl },
  profileStatItem: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm },
  statDivider: { width: 1, marginVertical: Spacing.sm },
  catPill: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: 999, borderWidth: 1 },
  chatWithBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md, borderRadius: Radii.sm, marginBottom: Spacing.md },
  clothesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  clothesTile: { borderRadius: 4, borderWidth: 1, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  clothesImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  communityBanner: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, marginBottom: Spacing.xl, padding: Spacing.lg, alignItems: 'center' },
  communityStatBlock: { flex: 1, alignItems: 'center' },
  communityDivider: { width: 1, height: 40, marginHorizontal: Spacing.sm },
});
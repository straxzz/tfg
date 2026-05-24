import { db, storage } from '@/src/config/firebase';
import { UserData } from '@/src/types';
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';

const USERS_COLLECTION = 'users';

function uriToBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response);
    xhr.onerror = () => reject(new TypeError('Network request failed'));
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

export async function uploadProfilePhoto(uid: string, uri: string): Promise<string | null> {
  try {
    const blob = await uriToBlob(uri);
    const storageRef = ref(storage, `profiles/${uid}.jpg`);
    await uploadBytes(storageRef, blob);
    return getDownloadURL(storageRef);
  } catch {
    return null;
  }
}

export async function getUser(uid: string): Promise<UserData | null> {
  const docSnap = await getDoc(doc(db, USERS_COLLECTION, uid));
  if (!docSnap.exists()) return null;
  return { uid: docSnap.id, ...docSnap.data() } as UserData;
}

export async function updateUser(uid: string, data: Partial<UserData>): Promise<void> {
  await updateDoc(doc(db, USERS_COLLECTION, uid), data as Record<string, unknown>);
}

export async function createUser(uid: string, data: Partial<UserData>): Promise<void> {
  await setDoc(doc(db, USERS_COLLECTION, uid), data, { merge: true });
}

export async function deleteAccount(uid: string): Promise<void> {
  // 1. Borrar prendas (Firestore + Storage)
  const clothesSnap = await getDocs(query(collection(db, 'clothes'), where('userId', '==', uid)));
  await Promise.all(clothesSnap.docs.map(async (d) => {
    const imageUrl = d.data().image;
    if (imageUrl) {
      try { await deleteObject(ref(storage, imageUrl)); } catch {}
    }
    await deleteDoc(doc(db, 'clothes', d.id));
  }));

  // 2. Borrar documento del usuario
  await deleteDoc(doc(db, USERS_COLLECTION, uid));

  // 3. Borrar foto de perfil en Storage
  try { await deleteObject(ref(storage, `profiles/${uid}.jpg`)); } catch {}

  // 4. Borrar mensajes del usuario en global_chat
  const chatSnap = await getDocs(query(collection(db, 'global_chat'), where('userId', '==', uid)));
  await Promise.all(chatSnap.docs.map((d) => deleteDoc(doc(db, 'global_chat', d.id))));
}

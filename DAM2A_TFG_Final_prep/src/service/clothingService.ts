import { db, storage } from '@/src/config/firebase';
import { ClothingFormData, ClothingItem } from '@/src/types';
import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';

const CLOTHES_COLLECTION = 'clothes';

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

export async function uploadImage(uri: string, userId: string): Promise<string> {
  const blob = await uriToBlob(uri);
  const storageRef = ref(storage, `clothes/${userId}/${Date.now()}.jpg`);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}

export async function getClothingById(id: string): Promise<ClothingItem | null> {
  const docSnap = await getDoc(doc(db, CLOTHES_COLLECTION, id));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as ClothingItem;
}

export async function getClothes(userId: string): Promise<ClothingItem[]> {
  const q = query(collection(db, CLOTHES_COLLECTION), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ClothingItem));
}

export async function addClothing(
  data: ClothingFormData,
  userId: string,
  imageUri: string,
): Promise<void> {
  const imageUrl = await uploadImage(imageUri, userId);
  await addDoc(collection(db, CLOTHES_COLLECTION), {
    name: data.name,
    brand: data.brand,
    category: data.category,
    image: imageUrl,
    userId,
    createdAt: serverTimestamp(),
    ...(data.price !== undefined && { price: data.price }),
    ...(data.color != null && { color: data.color }),
    ...(data.size != null && { size: data.size }),
  });
}

export async function updateClothing(id: string, data: Partial<ClothingFormData>): Promise<void> {
  const update: Record<string, unknown> = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.brand !== undefined) update.brand = data.brand;
  if (data.category !== undefined && data.category !== '') update.category = data.category;
  // deleteField() elimina el campo si el usuario borra el precio
  update.price = data.price !== undefined ? data.price : deleteField();
  // null = borrar campo, string = actualizar, undefined = no tocar
  if (data.color === null) update.color = deleteField();
  else if (data.color !== undefined) update.color = data.color;
  if (data.size === null) update.size = deleteField();
  else if (data.size !== undefined) update.size = data.size;
  await updateDoc(doc(db, CLOTHES_COLLECTION, id), update);
}

export async function deleteClothing(id: string, imageUrl: string): Promise<void> {
  if (imageUrl) {
    try {
      await deleteObject(ref(storage, imageUrl));
    } catch {
      // La imagen puede no existir si fue borrada manualmente
    }
  }
  await deleteDoc(doc(db, CLOTHES_COLLECTION, id));
}

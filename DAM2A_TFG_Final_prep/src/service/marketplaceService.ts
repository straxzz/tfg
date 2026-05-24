import { db } from '@/src/config/firebase';
import { MarketplaceListing, Purchase } from '@/src/types';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

const LISTINGS_COL = 'marketplace_listings';
const PURCHASES_COL = 'marketplace_purchases';

// sin orderBy porque firestore exige índice compuesto si lo mezclas con where, ordenamos en js
export async function getAvailableListings(currentUserId: string): Promise<MarketplaceListing[]> {
  const snap = await getDocs(query(collection(db, LISTINGS_COL), where('status', '==', 'available')));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as MarketplaceListing))
    .filter(l => l.sellerId !== currentUserId)
    .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
}

export async function getMyListings(userId: string): Promise<MarketplaceListing[]> {
  const snap = await getDocs(query(collection(db, LISTINGS_COL), where('sellerId', '==', userId)));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as MarketplaceListing))
    .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
}

export async function createListing(data: Omit<MarketplaceListing, 'id' | 'createdAt' | 'status'>): Promise<void> {
  await addDoc(collection(db, LISTINGS_COL), { ...data, status: 'available', createdAt: serverTimestamp() });
}

export async function deleteListing(listingId: string): Promise<void> {
  await deleteDoc(doc(db, LISTINGS_COL, listingId));
}

export async function purchaseListing(listing: MarketplaceListing, buyerId: string): Promise<void> {
  await addDoc(collection(db, PURCHASES_COL), {
    listingId:    listing.id,
    buyerId,
    sellerId:     listing.sellerId,
    itemName:     listing.name,
    itemImage:    listing.image,
    itemCategory: listing.category,
    price:        listing.price,
    sellerName:   listing.sellerName,
    createdAt:    serverTimestamp(),
  });

  await addDoc(collection(db, 'clothes'), {
    userId:     buyerId,
    name:       listing.name,
    brand:      listing.brand    ?? '',
    category:   listing.category ?? 'Otros',
    color:      listing.color    ?? '',
    size:       listing.size     ?? null,
    image:      listing.image    ?? '',
    price:      listing.price    ?? null,
    fromMarket: true,
    createdAt:  serverTimestamp(),
  });

  await updateDoc(doc(db, LISTINGS_COL, listing.id), { status: 'sold' });
}

export async function getMyPurchases(userId: string): Promise<Purchase[]> {
  const snap = await getDocs(query(collection(db, PURCHASES_COL), where('buyerId', '==', userId)));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Purchase))
    .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
}

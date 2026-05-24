import { Timestamp } from 'firebase/firestore';

export const CLOTHING_CATEGORIES = [
  'Camisetas',
  'Pantalones',
  'Zapatos',
  'Sudaderas',
  'Chaquetas',
  'Accesorios',
  'Otros',
] as const;

export type ClothingCategory = (typeof CLOTHING_CATEGORIES)[number];
export type ClothingFilter = ClothingCategory | 'Todo';

export interface ClothingItem {
  id: string;
  name: string;
  brand: string;
  category: ClothingCategory;
  image: string;
  userId: string;
  createdAt: Timestamp;
  price?: number;
  color?: string;
  size?: string;
}

export interface ClothingFormData {
  name: string;
  brand: string;
  category: ClothingCategory | '';
  imageUri: string | null;
  price?: number;
  color?: string | null;
  size?: string | null;
}

export interface ChatMessage {
  id: string;
  text: string;
  imageUrl?: string;
  userId: string;
  userEmail: string;
  createdAt: Timestamp | null;
}

export interface AppUser {
  uid: string;
  email: string;
}

export type Gender = 'woman' | 'man' | 'nonbinary' | 'prefer_not_to_say';
export type StyleTag =
  | 'Casual' | 'Formal' | 'Deportivo' | 'Elegante'
  | 'Bohemio' | 'Minimalista' | 'Vintage' | 'Streetwear';

export interface UserData {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  photoURL: string | null;
  isPrivate: boolean;
  themePreference: 'light' | 'dark' | 'system';
  createdAt: Timestamp;
  // Perfil personal para recomendaciones de IA (todos opcionales)
  gender?: Gender;
  heightCm?: number;
  weightKg?: number;
  styleTags?: StyleTag[];
  profileCompleted?: boolean; // true tras completar el perfil personal
}

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  photoURL: string | null;
  isPrivate: boolean;
}

export interface FriendRequest {
  id: string;
  fromUid: string;
  fromEmail: string;
  fromName: string;
  fromPhoto: string | null;
  toUid: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Timestamp;
}

// ---------------------------------------------------------------------------
// Marketplace
// ---------------------------------------------------------------------------

export interface MarketplaceListing {
  id: string;
  clothingId: string;
  sellerId: string;
  sellerName: string;
  sellerPhoto: string | null;
  name: string;
  brand: string;
  category: ClothingCategory;
  color?: string;
  size?: string | null;
  image: string;
  price: number;
  description?: string;
  status: 'available' | 'sold';
  createdAt: Timestamp;
}

export interface Purchase {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  itemName: string;
  itemImage: string;
  itemCategory: ClothingCategory;
  price: number;
  sellerName: string;
  createdAt: Timestamp;
}
Name: string;
  createdAt: Timestamp;
}
}

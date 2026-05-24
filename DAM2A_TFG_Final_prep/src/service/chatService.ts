import { db } from '@/src/config/firebase';
import { ChatMessage } from '@/src/types';
import {
  Unsubscribe,
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';

const GLOBAL_CHAT_COLLECTION = 'global_chat';

export function getMessages(
  onUpdate: (messages: ChatMessage[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, GLOBAL_CHAT_COLLECTION),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(q, snapshot => {
    const messages = snapshot.docs.map(
      d => ({ id: d.id, ...d.data() } as ChatMessage),
    );
    onUpdate(messages);
  });
}

export async function sendMessage(
  text: string,
  userId: string,
  userEmail: string,
): Promise<void> {
  await addDoc(collection(db, GLOBAL_CHAT_COLLECTION), {
    text,
    userId,
    userEmail,
    createdAt: serverTimestamp(),
  });
}

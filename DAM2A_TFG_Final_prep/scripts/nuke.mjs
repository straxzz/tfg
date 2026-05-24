// borra todos los datos seed de firestore y elimina las cuentas de auth
// no toca la cuenta admin

const ADMIN_EMAIL = 'admin@vctest.dev';

import { initializeApp } from 'firebase/app';
import {
  deleteUser,
  getAuth,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  query,
  where,
} from 'firebase/firestore';
import { USERS, SEED_PASSWORD } from './reseed.mjs';

const firebaseConfig = {
  apiKey:            'AIzaSyAsRCmmptBEEz29pJ9_3qhgvpYWvthpXGU',
  authDomain:        'virtualcloset-bfe0f.firebaseapp.com',
  projectId:         'virtualcloset-bfe0f',
  storageBucket:     'virtualcloset-bfe0f.firebasestorage.app',
  messagingSenderId: '412817871955',
  appId:             '1:412817871955:web:3ee0bb12d41c4aa2c3e2a6',
};

const app  = initializeApp(firebaseConfig, 'nuke');
const auth = getAuth(app);
const db   = getFirestore(app);

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function deleteWhere(colName, field, value) {
  const snap = await getDocs(query(collection(db, colName), where(field, '==', value)));
  for (const d of snap.docs) await deleteDoc(doc(db, colName, d.id));
  return snap.size;
}

async function nukeUser(userData) {
  if (userData.email === ADMIN_EMAIL) {
    console.log('  ' + (userData.firstName + ' ' + userData.lastName).padEnd(20) + '... admin, omitido.');
    return;
  }

  process.stdout.write('  ' + (userData.firstName + ' ' + userData.lastName).padEnd(20) + '...');

  let user;
  try {
    const cred = await signInWithEmailAndPassword(auth, userData.email, SEED_PASSWORD);
    user = cred.user;
  } catch {
    console.log(' no encontrado en Auth. Saltando.');
    return;
  }

  const uid = user.uid;
  let total = 0;

  total += await deleteWhere('clothes',               'userId',   uid);
  total += await deleteWhere('marketplace_listings',  'sellerId', uid);
  total += await deleteWhere('marketplace_purchases', 'buyerId',  uid);
  total += await deleteWhere('marketplace_purchases', 'sellerId', uid);
  total += await deleteWhere('friend_requests',       'fromUid',  uid);
  total += await deleteWhere('friend_requests',       'toUid',    uid);
  total += await deleteWhere('global_chat',           'userId',   uid);

  try { await deleteDoc(doc(db, 'users', uid)); total++; } catch {}

  try {
    await deleteUser(user);
    console.log(' ' + total + ' docs + cuenta Auth. OK');
  } catch {
    console.log(' ' + total + ' docs (Auth: fallo o ya borrada).');
  }
}

async function main() {
  console.log('\n=== nuke ===\n');

  for (const u of USERS) {
    await nukeUser(u);
    await sleep(300);
  }

  console.log('\n=== listo ===\n');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });

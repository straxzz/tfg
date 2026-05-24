// uso: node scripts/nuke.mjs && node scripts/reseed.mjs

const ADMIN = {
  email:     'admin@vctest.dev',
  password:  'admin1234!',
  firstName: 'Admin',
  lastName:  'Test',
  avatar:    null,
};

import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            'AIzaSyAsRCmmptBEEz29pJ9_3qhgvpYWvthpXGU',
  authDomain:        'virtualcloset-bfe0f.firebaseapp.com',
  projectId:         'virtualcloset-bfe0f',
  storageBucket:     'virtualcloset-bfe0f.firebasestorage.app',
  messagingSenderId: '412817871955',
  appId:             '1:412817871955:web:3ee0bb12d41c4aa2c3e2a6',
};

const app  = initializeApp(firebaseConfig, 'reseed');
const auth = getAuth(app);
const db   = getFirestore(app);

export const SEED_PASSWORD = 'seed1234!';

export const USERS = [
  { firstName: 'Aitana',    lastName: 'Lopez',      email: 'aitana.lopez@vctest.dev',     isPrivate: false, hasMarket: true  },
  { firstName: 'Sofia',     lastName: 'Martinez',   email: 'sofia.martinez@vctest.dev',   isPrivate: false, hasMarket: true  },
  { firstName: 'Carmen',    lastName: 'Garcia',     email: 'carmen.garcia@vctest.dev',    isPrivate: true,  hasMarket: false },
  { firstName: 'Lucia',     lastName: 'Fernandez',  email: 'lucia.fernandez@vctest.dev',  isPrivate: false, hasMarket: true  },
  { firstName: 'Valentina', lastName: 'Ruiz',       email: 'valentina.ruiz@vctest.dev',   isPrivate: false, hasMarket: true  },
  { firstName: 'Marina',    lastName: 'Sanchez',    email: 'marina.sanchez@vctest.dev',   isPrivate: true,  hasMarket: false },
  { firstName: 'Elena',     lastName: 'Torres',     email: 'elena.torres@vctest.dev',     isPrivate: false, hasMarket: true  },
  { firstName: 'Paula',     lastName: 'Diaz',       email: 'paula.diaz@vctest.dev',       isPrivate: false, hasMarket: false },
  { firstName: 'Nora',      lastName: 'Jimenez',    email: 'nora.jimenez@vctest.dev',     isPrivate: true,  hasMarket: true  },
  { firstName: 'Alba',      lastName: 'Moreno',     email: 'alba.moreno@vctest.dev',      isPrivate: false, hasMarket: true  },
  { firstName: 'Ariadna',   lastName: 'Alvarez',    email: 'ariadna.alvarez@vctest.dev',  isPrivate: false, hasMarket: true  },
  { firstName: 'Ines',      lastName: 'Romero',     email: 'ines.romero@vctest.dev',      isPrivate: true,  hasMarket: false },
  { firstName: 'Carla',     lastName: 'Lopez',      email: 'carla.lopez@vctest.dev',      isPrivate: false, hasMarket: true  },
  { firstName: 'Daniela',   lastName: 'Navarro',    email: 'daniela.navarro@vctest.dev',  isPrivate: false, hasMarket: true  },
  { firstName: 'Emma',      lastName: 'Perez',      email: 'emma.perez@vctest.dev',       isPrivate: true,  hasMarket: false },
  { firstName: 'Marta',     lastName: 'Gonzalez',   email: 'marta.gonzalez@vctest.dev',   isPrivate: false, hasMarket: true  },
  { firstName: 'Claudia',   lastName: 'Hernandez',  email: 'claudia.hernandez@vctest.dev',isPrivate: false, hasMarket: true  },
  { firstName: 'Sara',      lastName: 'Dominguez',  email: 'sara.dominguez@vctest.dev',   isPrivate: true,  hasMarket: false },
  { firstName: 'Rocio',     lastName: 'Vazquez',    email: 'rocio.vazquez@vctest.dev',    isPrivate: false, hasMarket: true  },
  { firstName: 'Natalia',   lastName: 'Castro',     email: 'natalia.castro@vctest.dev',   isPrivate: false, hasMarket: true  },
  { firstName: 'Vera',      lastName: 'Ortega',     email: 'vera.ortega@vctest.dev',      isPrivate: false, hasMarket: false },
  { firstName: 'Irene',     lastName: 'Rubio',      email: 'irene.rubio@vctest.dev',      isPrivate: true,  hasMarket: true  },
  { firstName: 'Alejandra', lastName: 'Munoz',      email: 'alejandra.munoz@vctest.dev',  isPrivate: false, hasMarket: true  },
  { firstName: 'Andrea',    lastName: 'Suarez',     email: 'andrea.suarez@vctest.dev',    isPrivate: false, hasMarket: true  },
  { firstName: 'Julia',     lastName: 'Serrano',    email: 'julia.serrano@vctest.dev',    isPrivate: true,  hasMarket: false },
];


const CATEGORIES = ['Camisetas', 'Pantalones', 'Zapatos', 'Sudaderas', 'Chaquetas', 'Accesorios', 'Otros'];
const COLORS     = ['blanco', 'negro', 'gris', 'beige', 'marino', 'azul', 'verde', 'rojo', 'rosa', 'amarillo', 'naranja', 'marron', 'morado'];
const BRANDS     = ['Zara', 'H&M', 'Mango', 'Massimo Dutti', 'Pull&Bear', 'Bershka', 'Stradivarius', 'COS', 'Arket', 'Nike', 'Adidas', 'New Balance', "Levi's", 'Uniqlo', ''];
const SIZES      = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const NAMES = {
  Camisetas:  ['Camiseta basica', 'Top de seda', 'Camiseta oversize', 'Blusa floral', 'Camiseta de rayas', 'Top crop', 'Camisa Oxford', 'Body negro', 'Camiseta tie-dye', 'Camiseta vintage'],
  Pantalones: ['Vaqueros slim', 'Pantalon palazzo', 'Leggings negros', 'Cargo pants', 'Vaqueros mom', 'Pantalon de cuadros', 'Shorts vaqueros', 'Culotte beige', 'Pantalon de traje', 'Vaqueros rotos'],
  Zapatos:    ['Zapatillas blancas', 'Botas de agua', 'Sandalias de cuero', 'Tacones negros', 'Mocasines marrones', 'Converse blancas', 'Botas militares', 'Mules negras', 'Zapatos Oxford', 'Bailarinas nude'],
  Sudaderas:  ['Sudadera con capucha', 'Sweatshirt gris', 'Sudadera cropped', 'Hoodie oversize', 'Sudadera universitaria', 'Sudadera de terciopelo', 'Crewneck negro', 'Sudadera tie-dye', 'Sudadera bordada'],
  Chaquetas:  ['Blazer negro', 'Chaqueta vaquera', 'Trench beige', 'Bomber verde', 'Abrigo gris', 'Cazadora de cuero', 'Chaqueta de punto', 'Parka azul marino', 'Cardigan marron', 'Blazer de cuadros'],
  Accesorios: ['Bolso tote', 'Cinturon negro', 'Panuelo de seda', 'Gorra blanca', 'Sombrero de paja', 'Bolso bandolera', 'Rinionera negra', 'Gafas de sol', 'Collar dorado', 'Pendientes de aro'],
  Otros:      ['Banador negro', 'Pijama de lunares', 'Kimono floral', 'Mono vaquero', 'Vestido midi', 'Minifalda negra', 'Falda plisada', 'Vestido de flores'],
};

const IMAGES = {
  Camisetas:  ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=70','https://images.unsplash.com/photo-1554568218-0f1715e72254?w=400&q=70','https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&q=70'],
  Pantalones: ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&q=70','https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&q=70','https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=70'],
  Zapatos:    ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=70','https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=400&q=70','https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=400&q=70'],
  Sudaderas:  ['https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400&q=70','https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=400&q=70','https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&q=70'],
  Chaquetas:  ['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&q=70','https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=400&q=70','https://images.unsplash.com/photo-1592878849122-facb97ed2c7e?w=400&q=70'],
  Accesorios: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=70','https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&q=70','https://images.unsplash.com/photo-1560243563-062bfc001d68?w=400&q=70'],
  Otros:      ['https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&q=70','https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&q=70','https://images.unsplash.com/photo-1467043237213-65f2da53396f?w=400&q=70'],
};

const MARKET_DESCRIPTIONS = [
  'En perfecto estado, apenas usada. Vendo por cambio de estilo.',
  'Solo puesta un par de veces. Sin ningun defecto visible.',
  'Sin estrenar, tiene la etiqueta puesta.',
  'Muy buen estado. La vendo porque ya no la uso.',
  'De temporada pasada, impecable. Me quedo sin espacio en el armario.',
  'Comprada hace 6 meses, usada 3 veces. Como nueva.',
  'Ideal para el verano. La cedo porque ya tengo algo similar.',
  'Regalo de cumpleanos que no es mi estilo. Precio negociable.',
  'Excelente calidad, marca premium. Precio por debajo del mercado.',
  'Muy comoda, la vendo porque cambio de talla.',
];

const CHAT_MESSAGES = [
  '¡Que bonita esa chaqueta!',
  'Me encanta tu estilo 💙',
  '¿Donde compraste esas zapatillas?',
  'Esa combinacion de colores es perfecta',
  'Tengo algo muy parecido en mi armario jaja',
  '¿La venderias? Estoy interesada',
  'El trench es una pasada, super elegante',
  '¡Me inspiras para renovar mi armario!',
  'Esa sudadera oversize es lo mas comodo del mundo',
  '¿De que marca son los vaqueros?',
  'El bolso combina con todo, buena eleccion',
  'Outfits como este me hacen querer salir de compras',
  'La paleta de colores de tu armario es increible',
  '¿Son comodos esos zapatos para el dia a dia?',
  'Llevaba tiempo buscando algo asi, gracias por la inspiracion',
];


const pick  = arr => arr[Math.floor(Math.random() * arr.length)];
const range = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const sleep = ms => new Promise(r => setTimeout(r, ms));

function randomDate(daysAgo = 365) {
  const now  = Date.now();
  const from = now - daysAgo * 24 * 60 * 60 * 1000;
  return Timestamp.fromMillis(from + Math.random() * (now - from));
}


async function createOrLogin(userData) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, userData.email, SEED_PASSWORD);
    await updateProfile(cred.user, {
      displayName: userData.firstName + ' ' + userData.lastName,
      photoURL:    null,
    });
    return cred.user;
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      return (await signInWithEmailAndPassword(auth, userData.email, SEED_PASSWORD)).user;
    }
    throw err;
  }
}

async function seedUser(userData, index) {
  process.stdout.write('  [' + String(index + 1).padStart(2) + '] ' + (userData.firstName + ' ' + userData.lastName).padEnd(20) + '...');
  const user = await createOrLogin(userData);
  const uid  = user.uid;

  await setDoc(doc(db, 'users', uid), {
    uid,
    email:           userData.email,
    firstName:       userData.firstName,
    lastName:        userData.lastName,
    photoURL:        null,
    isPrivate:       userData.isPrivate ?? false,
    themePreference: pick(['system', 'system', 'dark']),
    createdAt:       randomDate(200),
    profileCompleted: true,
    gender:          pick(['woman', 'woman', 'man']),
    styleTags:       [pick(['Casual', 'Minimalista', 'Elegante', 'Streetwear', 'Vintage'])],
  });

  const numItems = range(7, 11);
  const items = [];
  for (let i = 0; i < numItems; i++) {
    const cat  = pick(CATEGORIES);
    const ref  = await addDoc(collection(db, 'clothes'), {
      userId:   uid,
      name:     pick(NAMES[cat]),
      brand:    pick(BRANDS),
      category: cat,
      color:    pick(COLORS),
      size:     Math.random() < 0.7 ? pick(SIZES) : null,
      image:    pick(IMAGES[cat]),
      price:    Math.random() < 0.7 ? range(5, 180) : null,
      createdAt: randomDate(300),
    });
    items.push({ id: ref.id, name: ref.id, brand: '', category: cat, image: pick(IMAGES[cat]), price: null });
  }

  console.log(' ' + numItems + ' prendas. OK');
  return { uid, userData, items };
}

async function seedFriendships(created) {
  process.stdout.write('\n  Amistades ...');
  let count = 0;
  for (let i = 0; i < created.length; i++) {
    const { uid: fromUid, userData: fromData } = created[i];
    const indices = new Set();
    while (indices.size < range(4, 7)) {
      const idx = range(0, created.length - 1);
      if (idx !== i) indices.add(idx);
    }
    for (const j of indices) {
      await addDoc(collection(db, 'friend_requests'), {
        fromUid,
        fromEmail: fromData.email,
        fromName:  fromData.firstName + ' ' + fromData.lastName,
        fromPhoto: null,
        toUid:     created[j].uid,
        status:    'accepted',
        createdAt: randomDate(160),
      });
      count++;
    }
  }
  console.log(' ' + count + '. OK');
}


async function getUidByEmail(email) {
  const snap = await getDocs(query(collection(db, 'users'), where('email', '==', email)));
  return snap.empty ? null : snap.docs[0].id;
}

async function getClothesByUid(uid) {
  const snap = await getDocs(query(collection(db, 'clothes'), where('userId', '==', uid)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function seedMarket(userData) {
  process.stdout.write('  ' + (userData.firstName + ' ' + userData.lastName).padEnd(20) + '...');
  if (!userData.hasMarket) { console.log(' sin marketplace. Skip.'); return 0; }
  const cred    = await signInWithEmailAndPassword(auth, userData.email, SEED_PASSWORD);
  const uid     = cred.user.uid;
  const clothes = await getClothesByUid(uid);

  if (clothes.length === 0) { console.log(' sin prendas.'); return 0; }

  const numAvailable = range(3, Math.min(6, clothes.length));
  const numSold      = range(1, Math.min(2, clothes.length - numAvailable));
  const toSell       = [...clothes].sort(() => Math.random() - 0.5).slice(0, numAvailable + numSold);
  let count = 0;

  for (let i = 0; i < toSell.length; i++) {
    const item      = toSell[i];
    const isSold    = i >= numAvailable;
    const basePrice = item.price ? Math.max(5, Math.round(item.price * 0.65)) : range(10, 90);
    const price     = isSold ? basePrice : range(Math.max(5, basePrice - 10), basePrice + 15);

    const listingRef = await addDoc(collection(db, 'marketplace_listings'), {
      clothingId:  item.id,
      sellerId:    uid,
      sellerName:  userData.firstName + ' ' + userData.lastName,
      sellerPhoto: null,
      name:        item.name,
      brand:       item.brand || '',
      category:    item.category,
      image:       item.image,
      price,
      description: pick(MARKET_DESCRIPTIONS),
      status:      isSold ? 'sold' : 'available',
      createdAt:   randomDate(isSold ? 90 : 40),
    });

    if (isSold) {
      const buyer    = pick(USERS.filter(u => u.email !== userData.email));
      const buyerUid = await getUidByEmail(buyer.email);
      if (buyerUid) {
        await addDoc(collection(db, 'marketplace_purchases'), {
          listingId:    listingRef.id,
          buyerId:      buyerUid,
          sellerId:     uid,
          itemName:     item.name,
          itemImage:    item.image,
          itemCategory: item.category,
          price,
          sellerName: userData.firstName + ' ' + userData.lastName,
          createdAt:  randomDate(80),
        });
      }
    }
    count++;
  }

  console.log(' ' + numAvailable + ' disponibles + ' + numSold + ' vendidos. OK');
  return count;
}


async function seedChat(created) {
  process.stdout.write('\n  Mensajes de chat ...');
  const numMessages = range(30, 50);
  for (let i = 0; i < numMessages; i++) {
    const { uid, userData } = pick(created);
    await addDoc(collection(db, 'global_chat'), {
      text:      pick(CHAT_MESSAGES),
      userId:    uid,
      userEmail: userData.email,
      createdAt: randomDate(30),
    });
  }
  console.log(' ' + numMessages + '. OK');
}


const ADMIN_CLOTHES = [
  { category: 'Camisetas',  name: 'Camiseta blanca basica',    color: 'blanco', size: 'M',  brand: 'Zara',    price: 15 },
  { category: 'Camisetas',  name: 'Camiseta oversize gris',    color: 'gris',   size: 'L',  brand: 'H&M',     price: 12 },
  { category: 'Pantalones', name: 'Vaqueros slim azul marino', color: 'marino', size: 'M',  brand: "Levi's",  price: 59 },
  { category: 'Pantalones', name: 'Cargo pants negro',         color: 'negro',  size: 'M',  brand: 'Pull&Bear', price: 35 },
  { category: 'Sudaderas',  name: 'Hoodie gris oversize',      color: 'gris',   size: 'L',  brand: 'H&M',     price: 25 },
  { category: 'Chaquetas',  name: 'Blazer negro slim',         color: 'negro',  size: 'M',  brand: 'Mango',   price: 79 },
  { category: 'Chaquetas',  name: 'Trench beige clasico',      color: 'beige',  size: 'M',  brand: 'COS',     price: 120 },
  { category: 'Zapatos',    name: 'Zapatillas blancas',        color: 'blanco', size: 'L',  brand: 'Nike',    price: 89 },
  { category: 'Zapatos',    name: 'Botas militares negras',    color: 'negro',  size: 'L',  brand: 'Zara',    price: 65 },
  { category: 'Accesorios', name: 'Bolso tote canvas',         color: 'beige',  size: null, brand: 'Arket',   price: 45 },
  { category: 'Accesorios', name: 'Gafas de sol negras',       color: 'negro',  size: null, brand: '',        price: 18 },
  { category: 'Otros',      name: 'Vestido midi floral',       color: 'rosa',   size: 'S',  brand: 'Mango',   price: 49 },
];

async function seedAdmin() {
  process.stdout.write('\n  Creando cuenta admin ...');

  let user;
  try {
    const cred = await createUserWithEmailAndPassword(auth, ADMIN.email, ADMIN.password);
    await updateProfile(cred.user, { displayName: ADMIN.firstName + ' ' + ADMIN.lastName, photoURL: null });
    user = cred.user;
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      user = (await signInWithEmailAndPassword(auth, ADMIN.email, ADMIN.password)).user;
    } else throw err;
  }

  const uid = user.uid;

  await setDoc(doc(db, 'users', uid), {
    uid,
    email:            ADMIN.email,
    firstName:        ADMIN.firstName,
    lastName:         ADMIN.lastName,
    photoURL:         null,
    isPrivate:        false,
    themePreference:  'system',
    createdAt:        Timestamp.now(),
    profileCompleted: true,
    gender:           'prefer_not_to_say',
    styleTags:        ['Casual', 'Minimalista'],
  }, { merge: true });

  const existing = await getDocs(query(collection(db, 'clothes'), where('userId', '==', uid)));
  for (const d of existing.docs) await deleteDoc(doc(db, 'clothes', d.id));

  for (const item of ADMIN_CLOTHES) {
    await addDoc(collection(db, 'clothes'), {
      userId:   uid,
      name:     item.name,
      brand:    item.brand,
      category: item.category,
      color:    item.color,
      size:     item.size,
      image:    pick(IMAGES[item.category]),
      price:    item.price,
      createdAt: randomDate(60),
    });
  }

  console.log(' ' + ADMIN_CLOTHES.length + ' prendas. OK');
  console.log('  → Email:    ' + ADMIN.email);
  console.log('  → Password: ' + ADMIN.password);
  return { uid, userData: ADMIN };
}


async function main() {
  console.log('\n=== Virtual Closet — Reseed completo ===\n');

  console.log('── Paso 1/3: Usuarios y prendas ──');
  const created = [];
  for (let i = 0; i < USERS.length; i++) {
    try {
      created.push(await seedUser(USERS[i], i));
      await sleep(350);
    } catch (err) {
      console.log(' ERROR: ' + err.message);
    }
  }
  await seedFriendships(created);

  console.log('\n── Paso 2/3: Marketplace ──');
  let totalListings = 0;
  for (const u of USERS) {
    try {
      totalListings += await seedMarket(u);
      await sleep(400);
    } catch (err) {
      console.log(' ERROR: ' + err.message);
    }
  }

  console.log('\n── Paso 3/3: Chat global ──');
  await seedChat(created);

  console.log('\n── Paso 4/4: Cuenta admin permanente ──');
  const adminEntry = await seedAdmin();
  created.push(adminEntry);

  console.log('\n=== Reseed completado ===');
  console.log('Usuarios seed: ' + (created.length - 1) + '  |  Listings: ' + totalListings + '  |  Contraseña seed: ' + SEED_PASSWORD);
  console.log('Admin:         ' + ADMIN.email + '  |  Contraseña: ' + ADMIN.password);
  console.log('');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
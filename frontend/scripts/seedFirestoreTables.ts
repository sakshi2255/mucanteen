import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBID6aEpDYUdZPW-Dq1lhOaMLtIbeo-Rng",
  authDomain: "mu-canteen-b895a.firebaseapp.com",
  projectId: "mu-canteen-b895a",
  storageBucket: "mu-canteen-b895a.firebasestorage.app",
  messagingSenderId: "231604059707",
  appId: "1:231604059707:android:cabf8e38c301d1a3fc261e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function clearCollection(collectionName: string) {
  const snap = await getDocs(collection(db, collectionName));
  for (const d of snap.docs) {
    await deleteDoc(d.ref);
  }
  console.log(`Cleared ${snap.size} docs from duplicate collection: ${collectionName}`);
}

async function seed() {
  console.log('--- Authenticating with Firebase ---');
  try {
    await signInWithEmailAndPassword(auth, 'admin@marwadiuniversity.ac.in', 'password123');
    console.log('Signed in as admin');
  } catch {
    await signInAnonymously(auth);
    console.log('Signed in anonymously');
  }

  console.log('--- Removing duplicate collections ---');
  await clearCollection('Revenue');
  await clearCollection('dailyRevenue');
  await clearCollection('paymentsHistory');
  await clearCollection('payments_history');

  console.log('--- Seeding canonical payment_history & revenue ---');
  const todayStr = new Date().toISOString().split('T')[0];

  const sampleRevenues = [
    { revenue_id: `rev_canteen_main_1_${todayStr}`, canteen_id: 'canteen_main_1', date: todayStr, total_orders: 0, total_revenue: 0, updated_at: new Date().toISOString() },
    { revenue_id: `rev_canteen_main_2_${todayStr}`, canteen_id: 'canteen_main_2', date: todayStr, total_orders: 0, total_revenue: 0, updated_at: new Date().toISOString() },
    { revenue_id: `rev_canteen_law_1_${todayStr}`, canteen_id: 'canteen_law_1', date: todayStr, total_orders: 0, total_revenue: 0, updated_at: new Date().toISOString() },
    { revenue_id: `rev_canteen_faculty_3_${todayStr}`, canteen_id: 'canteen_faculty_3', date: todayStr, total_orders: 0, total_revenue: 0, updated_at: new Date().toISOString() },
  ];

  for (const rev of sampleRevenues) {
    await setDoc(doc(db, 'revenue', rev.revenue_id), rev);
  }

  console.log('Cleanup & seeding completed successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
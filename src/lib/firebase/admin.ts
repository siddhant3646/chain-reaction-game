import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getDatabase, Database } from 'firebase-admin/database';

let db: Database | null = null;

export function getAdminDb(): Database | null {
  if (db) return db;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

  if (!serviceAccountJson || !databaseURL) return null;

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    if (!getApps().length) {
      initializeApp({
        credential: cert(serviceAccount),
        databaseURL,
      });
    }
    db = getDatabase();
    return db;
  } catch {
    return null;
  }
}

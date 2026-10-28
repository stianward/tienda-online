import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let adminApp: App | undefined;

if (!getApps().length) {
  try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountKey) {
      const parsed = JSON.parse(serviceAccountKey);
      adminApp = initializeApp({
        credential: cert(parsed),
      });
    } else {
      adminApp = initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "grabamil-app",
      });
    }
  } catch (error) {
    console.warn("Firebase Admin SDK init skipped in dev:", error);
  }
} else {
  adminApp = getApps()[0];
}

export const adminAuth: Auth | null = adminApp ? getAuth(adminApp) : null;
export const adminDb: Firestore | null = adminApp ? getFirestore(adminApp) : null;
export default adminApp;


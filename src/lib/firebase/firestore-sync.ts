import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "./client";
import { DatabaseState, INITIAL_DATABASE_STATE, getDatabase, saveDatabase } from "@/lib/data-store";

const SYSTEM_DOC_PATH = ["system", "database"] as const;

let isSyncingFromFirestore = false;
let isInitialized = false;

/**
 * SINCRONIZADOR EN TIEMPO REAL CON CLOUD FIRESTORE:
 * 1. Conecta con la colección 'system' y el documento 'database'.
 * 2. Si la base de datos está vacía en Firebase, realiza la siembra inicial automática (seed).
 * 3. Escucha cambios en tiempo real desde Firestore y actualiza la aplicación.
 * 4. Guarda cualquier cambio local directamente en Cloud Firestore.
 */
export function initFirestoreSync(onStateChange?: (state: DatabaseState) => void) {
  if (typeof window === "undefined" || isInitialized) return;
  isInitialized = true;

  try {
    const docRef = doc(db, SYSTEM_DOC_PATH[0], SYSTEM_DOC_PATH[1]);

    // Escuchador en tiempo real
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const remoteData = snapshot.data() as DatabaseState;
          if (remoteData && remoteData.products && remoteData.orders) {
            isSyncingFromFirestore = true;
            try {
              saveDatabase(remoteData);
              if (onStateChange) onStateChange(remoteData);
              console.log("[Firestore Sync] Estado sincronizado en tiempo real desde Cloud Firestore");
            } finally {
              isSyncingFromFirestore = false;
            }
          }
        } else {
          // Documento no existe aún en Firestore -> Realizar Siembra Inicial Automática
          console.log("[Firestore Sync] Base de datos vacía. Sembrando datos iniciales en Firestore...");
          const currentState = getDatabase() || INITIAL_DATABASE_STATE;
          setDoc(docRef, currentState)
            .then(() => console.log("[Firestore Sync] Siembra inicial completada en Cloud Firestore"))
            .catch((err) => console.warn("[Firestore Sync] Error en siembra inicial:", err.message));
        }
      },
      (error) => {
        console.warn("[Firestore Sync] No se pudo conectar a Firestore (usando caché local offline):", error.message);
      }
    );

    return unsubscribe;
  } catch (err: any) {
    console.warn("[Firestore Sync] Fallo de inicialización:", err?.message);
  }
}

/**
 * Persiste el estado actual en Cloud Firestore
 */
export async function persistDatabaseToFirestore(state: DatabaseState): Promise<void> {
  if (typeof window === "undefined" || isSyncingFromFirestore) return;

  try {
    const docRef = doc(db, SYSTEM_DOC_PATH[0], SYSTEM_DOC_PATH[1]);
    await setDoc(docRef, state, { merge: true });
    console.log("[Firestore Sync] Cambios guardados exitosamente en Cloud Firestore");
  } catch (error: any) {
    console.warn("[Firestore Sync Error] No se pudo guardar en Firestore:", error?.message);
  }
}


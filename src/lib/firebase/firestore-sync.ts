import { doc, getDoc, setDoc, onSnapshot, collection } from "firebase/firestore";
import { db } from "./client";
import { DatabaseState, INITIAL_DATABASE_STATE, getDatabase, saveDatabase } from "@/lib/data-store";

const SYSTEM_DOC_PATH = ["system", "database"] as const;

let isSyncingFromFirestore = false;
let isInitialized = false;

function sanitizeData<T>(obj: T): T {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return obj;
  }
}

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
          persistDatabaseToFirestore(currentState)
            .then(() => console.log("[Firestore Sync] Siembra inicial completada en Cloud Firestore"))
            .catch((err) => console.warn("[Firestore Sync] Error en siembra inicial:", err.message));
        }
      },
      (error) => {
        if (error.code === "not-found" || error.message?.includes("NOT_FOUND")) {
          console.warn("[Firestore Sync] Base de datos de Firestore aún no creada en Firebase Console. Ve a Firebase -> Firestore Database -> Crear base de datos.");
        } else {
          console.warn("[Firestore Sync] Sincronización offline / caché local activa:", error.message);
        }
      }
    );

    return unsubscribe;
  } catch (err: any) {
    console.warn("[Firestore Sync] Fallo de inicialización:", err?.message);
  }
}

/**
 * Persiste el estado actual en Cloud Firestore tanto en el documento maestro
 * como en colecciones separadas para visualización limpia en Firebase Console.
 */
export async function persistDatabaseToFirestore(state: DatabaseState): Promise<void> {
  if (typeof window === "undefined" || isSyncingFromFirestore) return;

  const cleanState = sanitizeData(state);

  try {
    // 1. Guardar estado completo en el documento maestro system/database
    const docRef = doc(db, SYSTEM_DOC_PATH[0], SYSTEM_DOC_PATH[1]);
    await setDoc(docRef, cleanState, { merge: true });

    // 2. Persistir formularios personalizados en la colección 'custom_forms'
    if (cleanState.customForms && cleanState.customForms.length > 0) {
      for (const form of cleanState.customForms) {
        if (form.id) {
          const formDoc = doc(db, "custom_forms", form.id);
          setDoc(formDoc, form, { merge: true }).catch(() => {});
        }
      }
    }

    // 3. Persistir pedidos en la colección 'orders'
    if (cleanState.orders && cleanState.orders.length > 0) {
      for (const order of cleanState.orders) {
        if (order.id) {
          const orderDoc = doc(db, "orders", order.id);
          setDoc(orderDoc, order, { merge: true }).catch(() => {});
        }
      }
    }

    // 4. Persistir tablas personalizadas en la colección 'custom_tables'
    if (cleanState.customTables && cleanState.customTables.length > 0) {
      for (const table of cleanState.customTables) {
        if (table.id) {
          const tableDoc = doc(db, "custom_tables", table.id);
          setDoc(tableDoc, table, { merge: true }).catch(() => {});
        }
      }
    }

    console.log("[Firestore Sync] Datos y formularios persistidos exitosamente en Cloud Firestore");
  } catch (error: any) {
    if (error.code === "not-found" || error.message?.includes("NOT_FOUND")) {
      console.warn("[Firestore Sync] Base de datos no encontrada. Debes crear la base de datos Firestore en Firebase Console.");
    } else {
      console.warn("[Firestore Sync Error] No se pudo guardar en Firestore:", error?.message);
    }
  }
}

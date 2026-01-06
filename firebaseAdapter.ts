
import { initializeApp } from "firebase/app";
import {
    getFirestore,
    collection,
    getDocs,
    setDoc,
    doc,
    query,
    where,
    Timestamp,
    writeBatch
} from "firebase/firestore";
import { AppState, Person, SurveyResponse, SurveyTemplate } from "./types";
import { db as localDB } from "./db"; // Fallback to local DB

// Placeholder config - will be replaced by user keys
import { firebaseConfig } from "./firebaseConfig";

// Initialize Firebase
let firestoreDB: any = null;
let isFirebaseReady = false;

try {
    if (firebaseConfig.apiKey !== "API_KEY_PENDIENTE") {
        const app = initializeApp(firebaseConfig);
        firestoreDB = getFirestore(app);
        // isFirebaseReady = true;
        isFirebaseReady = false; // FORCE LOCAL MODE FOR DEBUGGING
        console.log("🔥 Firebase initialized (BUT FORCED OFF FOR DEBUGGING)");
    } else {
        console.log("⚠️ Firebase keys not found. Running in local mode.");
    }
} catch (e) {
    console.error("❌ Error initializing Firebase:", e);
}

// Convert Firestore timestamps to ISO strings and vice-versa
const convertDates = (obj: any): any => {
    if (!obj) return obj;
    if (obj instanceof Timestamp) return obj.toDate().toISOString();
    if (Array.isArray(obj)) return obj.map(convertDates);
    if (typeof obj === 'object') {
        const newObj: any = {};
        for (const key in obj) {
            newObj[key] = convertDates(obj[key]);
        }
        return newObj;
    }
    return obj;
};

export const firebaseAdapter = {
    isEnabled: () => isFirebaseReady,

    loadAll: async (): Promise<AppState | null> => {
        if (!isFirebaseReady) return localDB.loadAll();

        try {
            // Load collections in parallel
            const [peopleSnap, surveyResponsesSnap, templatesSnap, configSnap] = await Promise.all([
                getDocs(collection(firestoreDB, "people")),
                getDocs(collection(firestoreDB, "surveyResponses")),
                getDocs(collection(firestoreDB, "templates")),
                getDocs(collection(firestoreDB, "config"))
            ]);

            const people = peopleSnap.docs.map(d => convertDates(d.data())) as Person[];
            const surveyResponses = surveyResponsesSnap.docs.map(d => convertDates(d.data())) as SurveyResponse[];
            const surveyTemplates = templatesSnap.docs.map(d => convertDates(d.data())) as SurveyTemplate[];

            // Config is usually a single doc "main"
            // If empty, return null to trigger default creation
            if (people.length === 0 && surveyTemplates.length === 0) return null;

            // Reconstruct AppState (Partial)
            // Note: We might need to merge with defaults for other fields
            return {
                people,
                surveyResponses,
                surveyTemplates,
                families: [], // TODO: Load families collection if implemented
                configuracion: { currentUser: null, lastTab: 'dashboard' }, // Load from config if saved
                historico: [], // History might be too large to load all at once
                archivos: [],
                ultimaModificacion: new Date().toISOString()
            } as unknown as AppState;

        } catch (e) {
            console.error("Error loading from Firebase:", e);
            return null;
        }
    },

    saveAll: async (state: AppState) => {
        if (!isFirebaseReady) return localDB.saveAll(state);

        // In Firestore, we don't "save all" as one blob. We save entities.
        // However, for this migration phase, to keep compatibility with the "SaveAll" mental model,
        // we can either:
        // 1. Upload everything (inefficient but safe)
        // 2. Only use granular updates (better)

        // For now, we'll implement a "Sync" strategy:
        // We will save individual collections when this is called, 
        // but in a real app check for diffs.

        // NOTE: In a production app, we would not use saveAll() but specific savePerson(), saveResponse().
        // This adapter bridges the gap.

        console.log("☁️ Syncing to Firebase...");
        try {
            const batch = writeBatch(firestoreDB);

            // Save People
            state.people.forEach(p => {
                const ref = doc(firestoreDB, "people", p.id.toString());
                batch.set(ref, p, { merge: true });
            });

            // Save Templates
            state.surveyTemplates.forEach(t => {
                const ref = doc(firestoreDB, "templates", t.id.toString());
                batch.set(ref, t, { merge: true });
            });

            // Save Responses
            state.surveyResponses.forEach(r => {
                const ref = doc(firestoreDB, "surveyResponses", r.id);
                batch.set(ref, r, { merge: true });
            });

            await batch.commit();
            console.log("✅ Firebase Sync Complete");

            // Also update local storage as backup/cache
            await localDB.saveAll(state);
        } catch (e) {
            console.error("Error saving to Firebase:", e);
            // Fallback
            await localDB.saveAll(state);
        }
    }
};

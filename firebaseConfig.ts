// Esta configuración será reemplazada por las claves reales que proporcione el usuario.
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Reemplazar con las claves reales
export const firebaseConfig = {
    apiKey: "AIzaSyD9sJXNpKnjIjfD6xjJH1zQosh5IrnDmPo",
    authDomain: "salud-espiritual.firebaseapp.com",
    projectId: "salud-espiritual",
    storageBucket: "salud-espiritual.firebasestorage.app",
    messagingSenderId: "459893246534",
    appId: "1:459893246534:web:21880a0a024470eee21847"
};

// Inicializar Firebase solo si hay claves reales
let app;
let db;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (e) {
    console.error("Error inicializando Firebase:", e);
}

export { db };

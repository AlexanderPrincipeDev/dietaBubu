// firebase-config.js

const firebaseConfig = {
    apiKey: "AIzaSyD4V-ZK2eaM4dL_rDEOlEIO2nLsLU_RS0",
    authDomain: "dietabubu.firebaseapp.com",
    projectId: "dietabubu",
    storageBucket: "dietabubu.firebasestorage.app",
    messagingSenderId: "169002558118",
    appId: "1:169002558118:web:6145f24b130e3af5c20a67",
    measurementId: "G-Q0XM10ME33"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Inicializar Auth y Firestore
const auth = firebase.auth();
const db = firebase.firestore();

// Opcional: Persistencia local explícita en Auth para PWAs
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .catch((error) => console.error("Error setting persistence", error));

// Exponer globalmente para la aplicación
window.auth = auth;
window.db = db;

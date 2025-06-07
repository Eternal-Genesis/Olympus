// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Configuración de tu proyecto (copiada desde Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyA4B_l9nV0ZdgPNQDBl7zl4cZL-5ADdDj0",
  authDomain: "olympussystem.firebaseapp.com",
  projectId: "olympussystem",
  storageBucket: "olympussystem.firebasestorage.app",
  messagingSenderId: "593404036502",
  appId: "1:593404036502:web:03a2e9fe10e13dc9e1c9b7",
  measurementId: "G-HCBJZTYZ73"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Exporta auth para usarlo en otros archivos
export { auth };

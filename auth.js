// ⚠️ Asegurate de haber inicializado Firebase antes de este script
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// 🔐 Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 🔁 Referencias al DOM
const emailInput = document.getElementById("email");
const passInput = document.getElementById("password");
const loginBtn = document.getElementById("login");
const registerBtn = document.getElementById("register");
const mensajeError = document.getElementById("mensaje-error");

// Iniciar sesión
loginBtn.addEventListener("click", (e) => {
  e.preventDefault();
  const email = emailInput.value;
  const password = passInput.value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      window.location.href = "index.html"; // Redirige al panel
    })
    .catch(error => {
      mensajeError.textContent = "Error al iniciar sesión: " + error.message;
    });
});

// Registrar nueva cuenta
registerBtn.addEventListener("click", () => {
  const email = emailInput.value;
  const password = passInput.value;

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      window.location.href = "index.html";
    })
    .catch(error => {
      mensajeError.textContent = "Error al registrarse: " + error.message;
    });
});

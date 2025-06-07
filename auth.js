import { auth } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Elementos del formulario
const emailInput = document.getElementById("email");
const passInput = document.getElementById("password");
const loginBtn = document.getElementById("login");
const registerBtn = document.getElementById("register");
const googleBtn = document.getElementById("google-login");
const mensajeError = document.getElementById("mensaje-error");

// Iniciar sesión con correo
loginBtn.addEventListener("click", (e) => {
  e.preventDefault();
  const email = emailInput.value.trim();
  const password = passInput.value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      window.location.href = "index.html";
    })
    .catch(error => {
      mensajeError.textContent = "Error al iniciar sesión: " + error.message;
    });
});

// Crear cuenta
registerBtn.addEventListener("click", () => {
  const email = emailInput.value.trim();
  const password = passInput.value;

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      window.location.href = "index.html";
    })
    .catch(error => {
      mensajeError.textContent = "Error al registrarse: " + error.message;
    });
});

// Iniciar sesión con Google
googleBtn.addEventListener("click", () => {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider)
    .then(() => {
      window.location.href = "index.html";
    })
    .catch(error => {
      mensajeError.textContent = "Error con Google: " + error.message;
    });
});

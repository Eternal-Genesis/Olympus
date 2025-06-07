import { auth } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Referencias del DOM
const emailInput = document.getElementById("email");
const passInput = document.getElementById("password");
const loginBtn = document.getElementById("login");
const registerBtn = document.getElementById("register");
const googleBtn = document.getElementById("google-login");
const mensajeError = document.getElementById("mensaje-error");

// Función de validación básica
function validarCampos(email, password) {
  if (!email || !password) {
    mensajeError.textContent = "Por favor completa ambos campos.";
    return false;
  }
  return true;
}

// Traduce errores comunes de Firebase
function traducirError(errorCode) {
  switch (errorCode) {
    case "auth/invalid-email":
      return "El correo no es válido.";
    case "auth/missing-password":
      return "Falta la contraseña.";
    case "auth/wrong-password":
      return "La contraseña es incorrecta.";
    case "auth/user-not-found":
      return "No existe una cuenta con ese correo.";
    case "auth/email-already-in-use":
      return "Ese correo ya está registrado.";
    case "auth/weak-password":
      return "La contraseña debe tener al menos 6 caracteres.";
    default:
      return "Ocurrió un error inesperado.";
  }
}

// Iniciar sesión
loginBtn.addEventListener("click", (e) => {
  e.preventDefault();
  const email = emailInput.value.trim();
  const password = passInput.value;

  if (!validarCampos(email, password)) return;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => window.location.href = "index.html")
    .catch(error => {
      mensajeError.textContent = traducirError(error.code);
    });
});

// Crear cuenta
registerBtn.addEventListener("click", () => {
  const email = emailInput.value.trim();
  const password = passInput.value;

  if (!validarCampos(email, password)) return;

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => window.location.href = "index.html")
    .catch(error => {
      mensajeError.textContent = traducirError(error.code);
    });
});

// Iniciar sesión con Google
googleBtn.addEventListener("click", () => {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider)
    .then(() => window.location.href = "index.html")
    .catch(error => {
      mensajeError.textContent = traducirError(error.code);
    });
});

const togglePasswordBtn = document.getElementById("toggle-password");
const eyeIcon = document.getElementById("eye-icon");

togglePasswordBtn.addEventListener("click", () => {
  const isHidden = passInput.type === "password";
  passInput.type = isHidden ? "text" : "password";

  // Opcional: cambiar el color del ícono al mostrar
  eyeIcon.setAttribute("fill", isHidden ? "#00f0ff" : "#aaa");
});

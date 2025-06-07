import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Mostrar datos del usuario
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "bienvenida.html";
    return;
  }

  document.getElementById("user-name").textContent = user.displayName || "Sin nombre";
  document.getElementById("user-email").textContent = user.email;
  document.getElementById("user-uid").textContent = user.uid;
});

// Botón cerrar sesión
document.getElementById("logout").addEventListener("click", () => {
  signOut(auth)
    .then(() => window.location.href = "bienvenida.html")
    .catch(err => console.error("Error al cerrar sesión:", err));
});

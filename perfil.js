import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Mostrar el correo del usuario
onAuthStateChanged(auth, (user) => {
  const emailSpan = document.getElementById("user-email");

  if (user) {
    emailSpan.textContent = user.email;
  } else {
    // Si no hay usuario, redirige a la bienvenida
    window.location.href = "bienvenida.html";
  }
});

// Cerrar sesión
const logoutBtn = document.getElementById("logout");
logoutBtn.addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      window.location.href = "bienvenida.html";
    })
    .catch((error) => {
      console.error("Error al cerrar sesión:", error);
    });
});

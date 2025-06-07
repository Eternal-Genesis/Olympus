import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Detectar cambios de sesión
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "bienvenida.html";
    return;
  }

  // Mostrar nombre o "Sin nombre"
  document.getElementById("user-name").textContent =
    user.displayName || "Sin nombre";

  // Mostrar correo
  document.getElementById("user-email").textContent = user.email;

  // Simular estado Premium
  const esPremium = user.email.endsWith("@premium.com");
  const badge = document.getElementById("premium-badge");
  const btnPremium = document.getElementById("pagar-premium");

  if (esPremium) {
    badge.style.display = "inline-block";
    btnPremium.style.display = "none";
  } else {
    badge.style.display = "none";
    btnPremium.style.display = "inline-block";
  }
});

// Cambiar tema
document.getElementById("toggle-tema").addEventListener("click", () => {
  document.body.classList.toggle("light-mode");
  const modo = document.body.classList.contains("light-mode") ? "claro" : "oscuro";
  localStorage.setItem("tema", modo);
});

// Restaurar tema al cargar
if (localStorage.getItem("tema") === "claro") {
  document.body.classList.add("light-mode");
}

// Cerrar sesión
document.getElementById("logout").addEventListener("click", () => {
  signOut(auth)
    .then(() => window.location.href = "bienvenida.html")
    .catch((error) => console.error("Error al cerrar sesión:", error));
});

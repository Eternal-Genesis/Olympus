import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Verificar sesión y cargar datos
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "bienvenida.html";
    return;
  }

  document.getElementById("user-name").textContent =
    user.displayName || "Sin nombre";
  document.getElementById("user-email").textContent = user.email;

  // Cargar membresía real desde Firestore
  try {
    const ref = doc(db, "usuarios", user.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data();
      const tipo = data.membresia || "personal";

      document.getElementById("tipo-membresia").textContent =
        tipo.charAt(0).toUpperCase() + tipo.slice(1);

      const badge = document.getElementById("premium-badge");
      const btnPremium = document.getElementById("pagar-premium");

      if (tipo !== "personal") {
        badge.style.display = "inline-block";
        badge.textContent = `Cuenta ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`;
        btnPremium.style.display = "none";
      } else {
        badge.style.display = "none";
        btnPremium.style.display = "inline-block";
      }
    }
  } catch (err) {
    console.error("Error al cargar membresía:", err);
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


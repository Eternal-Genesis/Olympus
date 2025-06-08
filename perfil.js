// perfil.js
import { auth, onAuthStateChanged, signOut } from "./firebase.js";
import { db } from "./firebase.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const subirFoto = document.getElementById("subirFoto");
  const fotoPerfil = document.getElementById("fotoPerfil");
  const nombreUsuario = document.getElementById("nombreUsuario");
  const apodoInput = document.getElementById("apodo");
  const bioTextarea = document.getElementById("biografia");
  const progresoExp = document.getElementById("progresoExp");
  const cerrarSesionBtn = document.getElementById("cerrarSesion");

  // Contador de biografía
  const contador = document.createElement("div");
  contador.style.textAlign = "right";
  contador.style.fontSize = "0.8rem";
  contador.style.color = "#888";
  contador.textContent = "0 / 200";
  bioTextarea.parentNode.appendChild(contador);

  bioTextarea.addEventListener("input", () => {
    const largo = bioTextarea.value.length;
    contador.textContent = `${largo} / 200`;
    contador.style.color = largo >= 200 ? "#ff6060" : "#888";
    guardarEnFirestore("biografia", bioTextarea.value);
  });

  subirFoto.addEventListener("change", (e) => {
    const archivo = e.target.files[0];
    if (archivo) {
      const lector = new FileReader();
      lector.onload = () => {
        fotoPerfil.src = lector.result;
        guardarEnFirestore("foto", lector.result);
      };
      lector.readAsDataURL(archivo);
    }
  });

  apodoInput.addEventListener("input", () => guardarEnFirestore("apodo", apodoInput.value));

  cerrarSesionBtn.addEventListener("click", () => {
    signOut(auth)
      .then(() => window.location.href = "auth.html")
      .catch(err => console.error("Error al cerrar sesión:", err));
  });

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      alert("Debes iniciar sesión para acceder al perfil.");
      window.location.href = "auth.html";
      return;
    }

    const uid = user.uid;
    const nombre = user.displayName || user.email.split("@")[0];
    nombreUsuario.textContent = nombre;

    const ref = doc(db, "usuarios", uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, {
        apodo: "",
        biografia: "",
        foto: "",
        exp: 0
      });
    } else {
      const datos = snap.data();
      if (datos.apodo) apodoInput.value = datos.apodo;
      if (datos.biografia) {
        bioTextarea.value = datos.biografia;
        contador.textContent = `${datos.biografia.length} / 200`;
      }
      if (datos.foto) fotoPerfil.src = datos.foto;
      if (typeof datos.exp === "number") {
        const porcentaje = Math.min(100, Math.max(0, datos.exp));
        progresoExp.style.width = `${porcentaje}%`;
        progresoExp.textContent = `${porcentaje} / 100`;
      }
    }
  });

  async function guardarEnFirestore(campo, valor) {
    const user = auth.currentUser;
    if (!user) return;
    const ref = doc(db, "usuarios", user.uid);
    try {
      await updateDoc(ref, { [campo]: valor });
    } catch (e) {
      console.error("Error al guardar en Firestore:", e);
    }
  }
});

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
  const btnEditar = document.getElementById("btnEditar");
  const botonesPlanes = document.querySelectorAll(".btn-plan");
  const inputCodigo = document.getElementById("codigoCreador");
  const precioPersonal = document.getElementById("precioPersonal");
  const mensajeCodigo = document.getElementById("mensajeCodigo");

  let modoEdicion = false;
  let descuentoCodigo = false;

  // Edición del perfil
  btnEditar?.addEventListener("click", async () => {
    if (!modoEdicion) {
      apodoInput.disabled = false;
      bioTextarea.disabled = false;
      btnEditar.textContent = "Guardar";
      modoEdicion = true;
    } else {
      apodoInput.disabled = true;
      bioTextarea.disabled = true;
      btnEditar.textContent = "Editar";
      modoEdicion = false;
      await guardarEnFirestore("apodo", apodoInput.value);
      await guardarEnFirestore("biografia", bioTextarea.value);
    }
  });

  // Código de creador: aplicar descuento sobre plan Personal
  if (inputCodigo && precioPersonal) {
    inputCodigo.addEventListener("input", () => {
      const codigo = inputCodigo.value.trim().toUpperCase();

      if (codigo === "MARPE") {
        const precioFinal = (5 * 0.4).toFixed(2); // 60% de descuento
        precioPersonal.innerHTML = `$${precioFinal} / mes`;
        inputCodigo.classList.add("valid");
        mensajeCodigo?.classList.remove("oculto");
        descuentoCodigo = true;
      } else {
        precioPersonal.innerHTML = "$5 / mes";
        inputCodigo.classList.remove("valid");
        mensajeCodigo?.classList.add("oculto");
        descuentoCodigo = false;
      }
    });
  }

  // Botones de planes
  botonesPlanes.forEach(boton => {
    boton.addEventListener("click", async () => {
      const plan = boton.dataset.plan;
      let precio = 0;

      switch (plan) {
        case "Personal":
          precio = descuentoCodigo ? 2.00 : 5.00;
          break;
        case "Negocio":
          precio = 20.00;
          break;
        case "Empresa":
          precio = 80.00;
          break;
        default:
          return;
      }

      const user = auth.currentUser;
      if (!user) return;
      const ref = doc(db, "usuarios", user.uid);

      try {
        await updateDoc(ref, {
          plan: plan,
          codigoCreador: descuentoCodigo ? "MARPE" : "",
          precioPagado: precio
        });
        alert(`Has adquirido el plan ${plan} por $${precio.toFixed(2)}/mes.`);
        window.location.reload();
      } catch (e) {
        console.error("Error al guardar el plan:", e);
      }
    });
  });

  // Contador de biografía
  const contador = document.createElement("div");
  contador.style.textAlign = "right";
  contador.style.fontSize = "0.8rem";
  contador.style.color = "#888";
  contador.textContent = "0 / 200";
  bioTextarea?.parentNode?.appendChild(contador);

  bioTextarea?.addEventListener("input", () => {
    const largo = bioTextarea.value.length;
    contador.textContent = `${largo} / 200`;
    contador.style.color = largo >= 200 ? "#ff6060" : "#888";
  });

  // Cargar imagen de perfil
  subirFoto?.addEventListener("change", (e) => {
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

  // Cerrar sesión
  cerrarSesionBtn?.addEventListener("click", () => {
    signOut(auth)
      .then(() => window.location.href = "index.html")
      .catch(err => console.error("Error al cerrar sesión:", err));
  });

  // Cargar datos del usuario
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    const uid = user.uid;
    const nombre = user.displayName || user.email.split("@")[0];
    nombreUsuario.textContent = nombre;

    const ref = doc(db, "usuarios", uid);
    const snap = await getDoc(ref);

    let planActual = "";

    if (!snap.exists()) {
      await setDoc(ref, {
        apodo: "",
        biografia: "",
        foto: "",
        exp: 0,
        plan: "",
        codigoCreador: "",
        precioPagado: 0
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
      if (datos.plan) planActual = datos.plan;
    }

    // Botones según plan actual
    botonesPlanes.forEach(boton => {
      const plan = boton.dataset.plan;
      if (plan === planActual) {
        boton.textContent = "Usando";
        boton.disabled = true;
      } else {
        boton.textContent = "Cambiar";
        boton.disabled = false;
      }
    });
  });

  // Guardar campo en Firestore
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

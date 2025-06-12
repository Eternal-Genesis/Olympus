// perfil.js completo con caché diario inteligente, planes, experiencia y código de creador
import { auth, onAuthStateChanged, signOut } from "./firebase.js";
import { db } from "./firebase.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const hoy = new Date().toISOString().split("T")[0];

const cacheKey = (uid) => `perfil-${uid}`;
const cacheSyncKey = (uid) => `perfil-sync-${uid}`;

// DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  const subirFoto = document.getElementById("subirFoto");
  const fotoPerfil = document.getElementById("fotoPerfil");
  const nombreUsuario = document.getElementById("nombreUsuario");
  const apodoInput = document.getElementById("apodo");
  const bioTextarea = document.getElementById("biografia");
  const progresoExp = document.getElementById("progresoExp");
  const nivelTexto = document.getElementById("nivelTexto");
  const cerrarSesionBtn = document.getElementById("cerrarSesion");
  const btnEditar = document.getElementById("btnEditar");
  const botonesPlanes = document.querySelectorAll(".btn-plan");
  const inputCodigo = document.getElementById("codigoCreador");
  const precioPersonal = document.getElementById("precioPersonal");
  const mensajeCodigo = document.getElementById("mensajeCodigo");

  let modoEdicion = false;
  let descuentoCodigo = false;

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
      actualizarCampo("apodo", apodoInput.value);
      actualizarCampo("biografia", bioTextarea.value);
    }
  });

  inputCodigo?.addEventListener("input", () => {
    const codigo = inputCodigo.value.trim().toUpperCase();
    if (codigo === "MARPE") {
      descuentoCodigo = true;
      precioPersonal.innerHTML = `<span class="tachado">$5</span> $2 / mes`;
      inputCodigo.classList.add("valid");
      mensajeCodigo?.classList.remove("oculto");
    } else {
      descuentoCodigo = false;
      precioPersonal.innerHTML = `<span class="tachado">$5</span> $4 / mes`;
      inputCodigo.classList.remove("valid");
      mensajeCodigo?.classList.add("oculto");
    }
  });

  subirFoto?.addEventListener("change", (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = () => {
      const imagen = lector.result;
      fotoPerfil.src = imagen;
      actualizarCampo("foto", imagen);
    };
    lector.readAsDataURL(archivo);
  });

  cerrarSesionBtn?.addEventListener("click", () => {
    signOut(auth).then(() => window.location.href = "index.html")
      .catch(err => console.error("Error al cerrar sesión:", err));
  });

  botonesPlanes.forEach(boton => {
    boton.addEventListener("click", async () => {
      const plan = boton.dataset.plan;
      let precio = 0;
      if (plan === "Personal") precio = descuentoCodigo ? 2 : 4;
      else return;

      const user = auth.currentUser;
      if (!user) return;

      try {
        await updateDoc(doc(db, "usuarios", user.uid), {
          plan,
          codigoCreador: descuentoCodigo ? "MARPE" : "",
          precioPagado: precio
        });
        const actualizado = {
          ...(JSON.parse(localStorage.getItem(cacheKey(user.uid))) || {}),
          plan,
          codigoCreador: descuentoCodigo ? "MARPE" : "",
          precioPagado: precio
        };
        localStorage.setItem(cacheKey(user.uid), JSON.stringify(actualizado));
        localStorage.setItem(cacheSyncKey(user.uid), hoy);
        alert(`Has adquirido el plan ${plan} por $${precio}/mes.`);
        location.reload();
      } catch (e) {
        console.error("Error al guardar el plan:", e);
      }
    });
  });

  onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    const uid = user.uid;
    nombreUsuario.textContent = user.displayName || user.email.split("@")[0];

    const cache = localStorage.getItem(cacheKey(uid));
    const ultimaSync = localStorage.getItem(cacheSyncKey(uid));

    if (cache && ultimaSync === hoy) {
      renderPerfil(JSON.parse(cache));
    } else {
      try {
        let ref = doc(db, "usuarios", uid);
        let snap = await getDoc(ref);

        if (!snap.exists()) {
          await setDoc(ref, {
            apodo: "",
            biografia: "",
            foto: "",
            exp: 0,
            plan: "Personal"
          });
          snap = await getDoc(ref);
        }

        const datos = snap.data();
        localStorage.setItem(cacheKey(uid), JSON.stringify(datos));
        localStorage.setItem(cacheSyncKey(uid), hoy);
        renderPerfil(datos);
      } catch (e) {
        console.error("Error al cargar datos:", e);
      }
    }
  });

  function renderPerfil(datos) {
    apodoInput.value = datos.apodo || "";
    bioTextarea.value = datos.biografia || "";
    if (datos.biografia) contador.textContent = `${datos.biografia.length} / 200`;
    if (datos.foto) fotoPerfil.src = datos.foto;

    const nuevaExp = datos.exp || 0;
    const { nivel, xpMin, xpMax, progreso, texto } = getNivelData(nuevaExp);
    progresoExp.style.width = `${(progreso * 100).toFixed(1)}%`;
    progresoExp.textContent = `${nuevaExp - xpMin} / ${xpMax - xpMin}`;
    nivelTexto.textContent = texto;

    botonesPlanes.forEach(boton => {
      const plan = boton.dataset.plan;
      if (plan === datos.plan) {
        boton.textContent = "Usando";
        boton.disabled = true;
      } else {
        boton.textContent = "Adquirir";
        boton.disabled = false;
      }
      if (plan !== "Personal") {
        boton.textContent = "Próximamente";
        boton.disabled = true;
        boton.classList.add("btn-plan-disabled");
      }
    });
  }

  async function actualizarCampo(campo, valor) {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await updateDoc(doc(db, "usuarios", user.uid), { [campo]: valor });
      const cache = JSON.parse(localStorage.getItem(cacheKey(user.uid))) || {};
      cache[campo] = valor;
      localStorage.setItem(cacheKey(user.uid), JSON.stringify(cache));
      localStorage.setItem(cacheSyncKey(user.uid), hoy);
    } catch (e) {
      console.error("Error al actualizar campo:", campo, e);
    }
  }

  function getNivelData(xp) {
    let nivel = 0, xpMin = 0, xpMax = 100;
    while (xp >= xpMax) {
      nivel++;
      xpMin = xpMax;
      xpMax = Math.floor(xpMax * 1.2);
    }
    return {
      nivel,
      xpMin,
      xpMax,
      progreso: (xp - xpMin) / (xpMax - xpMin),
      texto: `Nivel ${nivel}`
    };
  }
});


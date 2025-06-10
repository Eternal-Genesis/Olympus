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
  const nivelTexto = document.getElementById("nivelTexto");
  const cerrarSesionBtn = document.getElementById("cerrarSesion");
  const btnEditar = document.getElementById("btnEditar");
  const botonesPlanes = document.querySelectorAll(".btn-plan");
  const inputCodigo = document.getElementById("codigoCreador");
  const precioPersonal = document.getElementById("precioPersonal");
  const mensajeCodigo = document.getElementById("mensajeCodigo");

  let modoEdicion = false;
  let descuentoCodigo = false;

  // Editar apodo y biografía
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

  // Código de creador visual
  if (inputCodigo && precioPersonal) {
    inputCodigo.addEventListener("input", () => {
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
  }

  // Contador de caracteres en biografía
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

  // Cargar imagen
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

  // Adquirir planes
  botonesPlanes.forEach(boton => {
    boton.addEventListener("click", async () => {
      const plan = boton.dataset.plan;
      let precio = 0;
      if (plan === "Personal") precio = descuentoCodigo ? (5 * 0.4) : (5 * 0.8);
      else if (plan === "Negocio") precio = 20.00;
      else if (plan === "Empresa") precio = 80.00;
      else return;

      const user = auth.currentUser;
      if (!user) return;
      const ref = doc(db, "usuarios", user.uid);

      try {
        await updateDoc(ref, {
          plan,
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

  // Detectar usuario y cargar datos
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

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
        exp: 0,
        plan: "Personal"
      });
    }

    const datos = (await getDoc(ref)).data();
    if (!datos) return;

    const nuevaExp = datos.exp || 0;

    // Actualizar apodo, biografía, foto
    if (datos.apodo) apodoInput.value = datos.apodo;
    if (datos.biografia) {
      bioTextarea.value = datos.biografia;
      contador.textContent = `${datos.biografia.length} / 200`;
    }
    if (datos.foto) fotoPerfil.src = datos.foto;

    // Mostrar experiencia y nivel
    const { nivel, xpMin, xpMax, progreso, texto } = getNivelData(nuevaExp);
    progresoExp.style.width = `${(progreso * 100).toFixed(1)}%`;
    progresoExp.textContent = `${nuevaExp - xpMin} / ${xpMax - xpMin}`;
    if (nivelTexto) nivelTexto.textContent = texto;

    // Mostrar botones de planes correctamente
    const planActual = datos.plan || "";
    botonesPlanes.forEach(boton => {
      const plan = boton.dataset.plan;

      if (plan === "Personal") {
        if (plan === planActual) {
          boton.textContent = "Usando";
          boton.disabled = true;
        } else {
          boton.textContent = "Adquirir";
          boton.disabled = false;
        }
      } else {
        boton.textContent = "Próximamente";
        boton.disabled = true;
        boton.classList.add("btn-plan-disabled");
      }
    });
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

  function getNivelData(xp) {
    let nivel = 0;
    let xpTotal = 0;
    let xpMin = 0;
    let xpMax = 100;

    while (xp >= xpMax) {
      nivel++;
      xpMin = xpMax;
      xpMax = Math.floor(xpMax * 1.2);
    }

    const progreso = (xp - xpMin) / (xpMax - xpMin);
    const texto = `Nivel ${nivel}`;
    return { nivel, xpMin, xpMax, progreso, texto };
  }
});


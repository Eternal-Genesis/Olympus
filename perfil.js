// perfil.js
import {
  auth,
  db,
  signOut,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  updateDoc
} from "./firebase.js";

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
  const nivelTexto = document.getElementById("nivelTexto");

  let modoEdicion = false;
  let descuentoCodigo = false;

  // FUNCIÓN DE NIVEL
  function getNivelData(xp) {
    const nivel = Math.floor(Math.sqrt(xp / 10));
    const xpMin = nivel ** 2 * 10;
    const xpMax = (nivel + 1) ** 2 * 10;
    const progreso = (xp - xpMin) / (xpMax - xpMin);
    return {
      nivel,
      xpMin,
      xpMax,
      progreso,
      texto: `Nivel ${nivel}`
    };
  }

  // Edición de perfil
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

  // Código de creador
  if (inputCodigo && precioPersonal) {
    inputCodigo.addEventListener("input", () => {
      const codigo = inputCodigo.value.trim().toUpperCase();

      if (codigo === "MARPE") {
        const precioFinal = (5 * 0.4).toFixed(2); // 60%
        precioPersonal.innerHTML = `<span class="tachado">$5</span> $${precioFinal} / mes`;
        inputCodigo.classList.add("valid");
        mensajeCodigo?.classList.remove("oculto");
        descuentoCodigo = true;
      } else {
        const precioConDescuento = (5 * 0.8).toFixed(2); // 20%
        precioPersonal.innerHTML = `<span class="tachado">$5</span> $${precioConDescuento} / mes`;
        inputCodigo.classList.remove("valid");
        mensajeCodigo?.classList.add("oculto");
        descuentoCodigo = false;
      }
    });

    const precioConDescuento = (5 * 0.8).toFixed(2);
    precioPersonal.innerHTML = `<span class="tachado">$5</span> $${precioConDescuento} / mes`;
  }

  // Botones de planes
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
    // Planes Negocio y Empresa aún no disponibles
    boton.textContent = "Próximamente";
    boton.disabled = true;
    boton.classList.add("btn-plan-disabled");
  }
});

  // Biografía contador
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

  // Subir imagen
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

 // Cargar datos + XP diaria
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    const uid = user.uid;
    const ref = doc(db, "usuarios", uid);
    const snap = await getDoc(ref);

    const hoy = new Date().toISOString().split("T")[0];
    let nuevaExp = 0;

    if (!snap.exists()) {
      await setDoc(ref, {
        apodo: "",
        biografia: "",
        foto: "",
        exp: 5,
        ultimaVisita: hoy,
        plan: "",
        codigoCreador: "",
        precioPagado: 0
      });
      nuevaExp = 5;
    } else {
      const datos = snap.data();
      if (datos.apodo) apodoInput.value = datos.apodo;
      if (datos.biografia) {
        bioTextarea.value = datos.biografia;
        contador.textContent = `${datos.biografia.length} / 200`;
      }
      if (datos.foto) fotoPerfil.src = datos.foto;

      let expActual = datos.exp || 0;
      const ultimaVisita = datos.ultimaVisita || "";

      if (ultimaVisita !== hoy) {
        nuevaExp = expActual + 5;
        await updateDoc(ref, {
          exp: nuevaExp,
          ultimaVisita: hoy
        });
      } else {
        nuevaExp = expActual;
      }
    }

    const { nivel, xpMin, xpMax, progreso, texto } = getNivelData(nuevaExp);

    // actualizar barra de experiencia
    progresoExp.style.width = `${(progreso * 100).toFixed(1)}%`;
    progresoExp.textContent = `${nuevaExp - xpMin} / ${xpMax - xpMin}`;

    // actualizar nivel
    if (nivelTexto) nivelTexto.textContent = texto;
  
  // Guardar en firestore
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

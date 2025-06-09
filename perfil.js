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
  const rangoTexto = document.querySelector(".rango-texto strong");

  let modoEdicion = false;
  let descuentoCodigo = false;

  // RANGOS por XP
  function obtenerRango(exp) {
    if (exp >= 1000) return "Maestro";
    if (exp >= 500) return "Guerrero";
    if (exp >= 250) return "Estratega";
    if (exp >= 100) return "Explorador";
    return "Aprendiz";
  }

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

  // Cargar datos + XP diaria + rango
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

    const porcentaje = Math.min(100, Math.max(0, nuevaExp));
    progresoExp.style.width = `${porcentaje}%`;
    progresoExp.textContent = `${porcentaje} / 100`;
    rangoTexto.textContent = obtenerRango(nuevaExp);

    // Plan actual
    const datos = (await getDoc(ref)).data();
    const planActual = datos?.plan || "";
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

  // Guardar campo común
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

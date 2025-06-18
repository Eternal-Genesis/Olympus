// mente.js - Funciones para desarrollo mental diario

import { db, auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

let uid = null;
const hoy = new Date().toISOString().split("T")[0];
const identidad = document.getElementById("identidad-meta");
const btnIdentidad = document.getElementById("guardar-identidad");
let modoEditar = false;

// Autenticación y carga de identidad y estado diario
onAuthStateChanged(auth, async user => {
  if (user) {
    uid = user.uid;

    // Cargar identidad persistente
    const local = localStorage.getItem(`identidad-${uid}`);
    if (local) {
      identidad.value = local;
      identidad.setAttribute("disabled", true);
      btnIdentidad.textContent = "Editar";
      modoEditar = true;
    } else {
      const snap = await getDoc(doc(db, "mente", uid));
      const data = snap.exists() ? snap.data() : {};
      if (data["identidad"]) {
        identidad.value = data["identidad"];
        identidad.setAttribute("disabled", true);
        btnIdentidad.textContent = "Editar";
        modoEditar = true;
      }
    }

    // Verificar gratitud guardada
    const gratitudHoy = localStorage.getItem(`gratitud-${uid}-${hoy}`);
    if (gratitudHoy) {
      const entradas = JSON.parse(gratitudHoy);
      const inputs = document.querySelectorAll("#lista-gratitud input");
      entradas.forEach((valor, i) => {
        if (inputs[i]) inputs[i].value = valor;
      });
      const btn = document.getElementById("guardar-gratitud");
      btn.textContent = "Terminado";
      btn.disabled = true;
    }

    // Verificar pensamientos guardados
    const pensamientoHoy = localStorage.getItem(`pensamiento-${uid}-${hoy}`);
    if (pensamientoHoy) {
      const { negativo, positivo } = JSON.parse(pensamientoHoy);
      const inputs = document.querySelectorAll(".pensamiento input");
      inputs[0].value = negativo;
      inputs[1].value = positivo;
      const btn = document.getElementById("guardar-pensamientos");
      btn.textContent = "Terminado";
      btn.disabled = true;
    }
  }
});

// Guardar o editar identidad
btnIdentidad.onclick = async () => {
  if (!uid) return;

  if (!modoEditar) {
    const valor = identidad.value.trim();
    if (!valor) return;
    localStorage.setItem(`identidad-${uid}`, valor);
    await setDoc(doc(db, "mente", uid), { identidad: valor }, { merge: true });
    document.getElementById("estado-identidad").classList.remove("oculto");
    btnIdentidad.textContent = "Editar";
    identidad.setAttribute("disabled", true);
    modoEditar = true;
  } else {
    identidad.removeAttribute("disabled");
    btnIdentidad.textContent = "Guardar";
    modoEditar = false;
  }
};

// Meditación de 1 minuto
const botonMeditar = document.getElementById("iniciar-meditacion");
const temporizador = document.getElementById("temporizador");

botonMeditar.onclick = () => {
  let segundos = 60;
  temporizador.textContent = segundos;
  temporizador.classList.remove("oculto");
  botonMeditar.disabled = true;

  const intervalo = setInterval(() => {
    segundos--;
    temporizador.textContent = segundos;
    if (segundos <= 0) {
      clearInterval(intervalo);
      temporizador.textContent = "✓ Finalizado";
      botonMeditar.disabled = false;
    }
  }, 1000);
};

// Guardar gratitud diaria
const btnGratitud = document.getElementById("guardar-gratitud");
btnGratitud.onclick = async () => {
  const entradas = Array.from(document.querySelectorAll("#lista-gratitud input"))
    .map(i => i.value.trim()).filter(Boolean);
  if (!uid || entradas.length === 0) return;
  localStorage.setItem(`gratitud-${uid}-${hoy}`, JSON.stringify(entradas));
  await setDoc(doc(db, "mente", uid), { [`gratitud-${hoy}`]: entradas }, { merge: true });
  const estado = document.getElementById("estado-gratitud");
  estado.classList.remove("oculto");
  btnGratitud.textContent = "Terminado";
  btnGratitud.disabled = true;
};

// Guardar pensamiento negativo y reformulación diaria
const btnPensamientos = document.getElementById("guardar-pensamientos");
btnPensamientos.onclick = async () => {
  const inputs = document.querySelectorAll(".pensamiento input");
  const negativo = inputs[0].value.trim();
  const positivo = inputs[1].value.trim();
  if (!uid || !negativo || !positivo) return;
  const pensamiento = { negativo, positivo };
  localStorage.setItem(`pensamiento-${uid}-${hoy}`, JSON.stringify(pensamiento));
  await setDoc(doc(db, "mente", uid), { [`pensamiento-${hoy}`]: pensamiento }, { merge: true });
  const estado = document.getElementById("estado-pensamientos");
  estado.classList.remove("oculto");
  btnPensamientos.textContent = "Terminado";
  btnPensamientos.disabled = true;
};

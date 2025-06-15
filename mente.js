// mente.js - Funciones para desarrollo mental diario

import { db, auth } from "./firebase.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

let uid = null;
const hoy = new Date().toISOString().split("T")[0];
const identidad = document.getElementById("identidad-meta");

onAuthStateChanged(auth, async user => {
  if (user) {
    uid = user.uid;

    // Cargar identidad guardada si existe
    const local = localStorage.getItem(`identidad-${uid}-${hoy}`);
    if (local) {
      identidad.value = local;
    } else {
      const snap = await getDoc(doc(db, "mente", uid));
      const data = snap.exists() ? snap.data() : {};
      if (data[`identidad-${hoy}`]) {
        identidad.value = data[`identidad-${hoy}`];
      }
    }
  }
});

// Guardar identidad
const btnIdentidad = document.getElementById("guardar-identidad");
btnIdentidad.onclick = async () => {
  const valor = identidad.value.trim();
  if (!valor || !uid) return;
  localStorage.setItem(`identidad-${uid}-${hoy}`, valor);
  await setDoc(doc(db, "mente", uid), { [`identidad-${hoy}`]: valor }, { merge: true });
  document.getElementById("estado-identidad").classList.remove("oculto");
};

// Meditación
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

// Guardar gratitud
const btnGratitud = document.getElementById("guardar-gratitud");
btnGratitud.onclick = async () => {
  const entradas = Array.from(document.querySelectorAll("#lista-gratitud input"))
    .map(i => i.value.trim()).filter(Boolean);
  if (!uid || entradas.length === 0) return;
  localStorage.setItem(`gratitud-${uid}-${hoy}`, JSON.stringify(entradas));
  await setDoc(doc(db, "mente", uid), { [`gratitud-${hoy}`]: entradas }, { merge: true });
  document.getElementById("estado-gratitud").classList.remove("oculto");
};

// Guardar pensamientos
const btnPensamientos = document.getElementById("guardar-pensamientos");
btnPensamientos.onclick = async () => {
  const inputs = document.querySelectorAll(".pensamiento input");
  const negativo = inputs[0].value.trim();
  const positivo = inputs[1].value.trim();
  if (!uid || !negativo || !positivo) return;
  const pensamiento = { negativo, positivo };
  localStorage.setItem(`pensamiento-${uid}-${hoy}`, JSON.stringify(pensamiento));
  await setDoc(doc(db, "mente", uid), { [`pensamiento-${hoy}`]: pensamiento }, { merge: true });
  document.getElementById("estado-pensamientos").classList.remove("oculto");
};

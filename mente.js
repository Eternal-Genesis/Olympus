// mente.js - Funciones para desarrollo mental diario

import { db, auth } from "./firebase.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// Obtener UID del usuario
let uid = null;
onAuthStateChanged(auth, user => {
  if (user) uid = user.uid;
});

const hoy = new Date().toISOString().split("T")[0];

// Guardar identidad
const identidad = document.getElementById("identidad-meta");
document.getElementById("guardar-identidad").onclick = async () => {
  const valor = identidad.value.trim();
  if (!valor || !uid) return;
  localStorage.setItem(`identidad-${uid}`, valor);
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
document.getElementById("guardar-gratitud").onclick = async () => {
  const entradas = Array.from(document.querySelectorAll("#lista-gratitud input"))
    .map(i => i.value.trim()).filter(Boolean);
  if (!uid || entradas.length === 0) return;
  localStorage.setItem(`gratitud-${uid}-${hoy}`, JSON.stringify(entradas));
  await setDoc(doc(db, "mente", uid), { [`gratitud-${hoy}`]: entradas }, { merge: true });
  document.getElementById("estado-gratitud").classList.remove("oculto");
};

// Guardar pensamientos
document.getElementById("guardar-pensamientos").onclick = async () => {
  const pares = Array.from(document.querySelectorAll(".pensamiento")).map(div => {
    const inputs = div.querySelectorAll("input");
    return {
      negativo: inputs[0].value.trim(),
      positivo: inputs[1].value.trim()
    };
  }).filter(p => p.negativo && p.positivo);
  if (!uid || pares.length === 0) return;
  localStorage.setItem(`pensamientos-${uid}-${hoy}`, JSON.stringify(pares));
  await setDoc(doc(db, "mente", uid), { [`pensamientos-${hoy}`]: pares }, { merge: true });
  document.getElementById("estado-pensamientos").classList.remove("oculto");
};

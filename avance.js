// avance.js – Rutina diaria con hábitos, días y hora
import {
  auth,
  db,
  doc,
  setDoc,
  getDoc,
  onAuthStateChanged
} from "./firebase.js";

const formHabito = document.getElementById("form-habito");
const listaHoy = document.getElementById("habitos-hoy");
let uid = null;

const KEY_LOCAL = uid => `rutina-${uid}`;
const FECHA_KEY = uid => `rutina-fecha-${uid}`;
const hoy = new Date().toISOString().split("T")[0];

onAuthStateChanged(auth, async user => {
  if (!user) return;
  uid = user.uid;
  cargarHabitos();
});

formHabito.addEventListener("submit", async e => {
  e.preventDefault();

  const nombre = formHabito["nombre-habito"].value.trim();
  const hora = formHabito["hora-habito"].value;
  const dias = [...formHabito.querySelectorAll("input[name='dias']:checked")].map(x => parseInt(x.value));

  if (!nombre || !hora || dias.length === 0 || !uid) return;

  const habito = { nombre, hora, dias, completado: {} };
  const rutina = obtenerRutina();
  rutina.push(habito);

  await guardarRutina(rutina);
  formHabito.reset();
  mostrarHabitosHoy(rutina);
});

function obtenerRutina() {
  const cache = localStorage.getItem(KEY_LOCAL(uid));
  return cache ? JSON.parse(cache) : [];
}

async function guardarRutina(rutina) {
  const ref = doc(db, "usuarios", uid, "avance", "rutina");
  await setDoc(ref, { rutina });
  localStorage.setItem(KEY_LOCAL(uid), JSON.stringify(rutina));
  localStorage.setItem(FECHA_KEY(uid), hoy);
}

async function cargarHabitos() {
  const local = localStorage.getItem(KEY_LOCAL(uid));
  const fechaGuardada = localStorage.getItem(FECHA_KEY(uid));

  if (local && fechaGuardada === hoy) {
    mostrarHabitosHoy(JSON.parse(local));
  } else {
    try {
      const ref = doc(db, "usuarios", uid, "avance", "rutina");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const datos = snap.data().rutina || [];
        localStorage.setItem(KEY_LOCAL(uid), JSON.stringify(datos));
        localStorage.setItem(FECHA_KEY(uid), hoy);
        mostrarHabitosHoy(datos);
      }
    } catch (e) {
      console.error("Error al cargar rutina", e);
    }
  }
}

function mostrarHabitosHoy(rutina) {
  listaHoy.innerHTML = "";
  const dia = new Date().getDay();

  const delDia = rutina.filter(h => h.dias.includes(dia));
  delDia.sort((a, b) => a.hora.localeCompare(b.hora));

  for (const habito of delDia) {
    const li = document.createElement("li");
    const key = `${hoy}`;
    const checked = habito.completado[key] || false;

    const label = document.createElement("label");
    label.innerHTML = `<input type="checkbox" ${checked ? "checked" : ""}> <strong>${habito.hora}</strong> – ${habito.nombre}`;

    label.querySelector("input").addEventListener("change", e => {
      habito.completado[key] = e.target.checked;
      guardarRutina(obtenerRutina());
    });

    li.appendChild(label);
    listaHoy.appendChild(li);
  }
}

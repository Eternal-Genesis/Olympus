// avance.js – Rutina funcional sin gráficos, con hora y reinicio diario
import {
  auth,
  db,
  doc,
  getDoc,
  setDoc,
  onAuthStateChanged
} from "./firebase.js";

const listaHabitos = document.getElementById("lista-habitos");
const btnNuevoHabito = document.getElementById("btn-nuevo-habito");
const modalHabito = document.getElementById("modal-habito");
const formHabito = document.getElementById("form-habito");
const cancelarHabito = document.getElementById("cancelar-habito");
const modalTitulo = document.getElementById("modal-titulo");

const inputNombre = document.getElementById("nombre-habito");
const inputHora = document.getElementById("hora-habito");
const checkboxesDias = [...formHabito.querySelectorAll(".dias-semana input")];

let editando = null;
let uid = null;

const KEY_RUTINA = uid => `rutina-${uid}`;
const KEY_FECHA = uid => `fecha-${uid}`;
const HOY = new Date().toISOString().split("T")[0];

onAuthStateChanged(auth, async user => {
  if (!user) return;
  uid = user.uid;
  const cache = localStorage.getItem(KEY_RUTINA(uid));
  const fecha = localStorage.getItem(KEY_FECHA(uid));

  if (cache && fecha === HOY) {
    renderHabitos(JSON.parse(cache));
  } else {
    try {
      const ref = doc(db, "usuarios", uid, "avance", "rutina");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data().habitos || [];
        localStorage.setItem(KEY_RUTINA(uid), JSON.stringify(data));
        localStorage.setItem(KEY_FECHA(uid), HOY);
        renderHabitos(data);
      } else {
        renderHabitos([]);
      }
    } catch (err) {
      console.error("Error al cargar rutina:", err);
    }
  }
});

btnNuevoHabito.addEventListener("click", () => {
  modalTitulo.textContent = "Nuevo Hábito";
  editando = null;
  formHabito.reset();
  modalHabito.classList.add("activo");
});

cancelarHabito.addEventListener("click", () => {
  modalHabito.classList.remove("activo");
});

formHabito.addEventListener("submit", async e => {
  e.preventDefault();
  if (!uid) return;

  const nombre = inputNombre.value.trim();
  const hora = inputHora.value;
  const dias = checkboxesDias.filter(c => c.checked).map(c => parseInt(c.value));

  if (!nombre || !hora || dias.length === 0) return;

  const rutina = obtenerRutina();

  if (editando !== null) {
    rutina[editando] = { nombre, hora, dias, completado: {} };
  } else {
    rutina.push({ nombre, hora, dias, completado: {} });
  }

  await guardarRutina(rutina);
  renderHabitos(rutina);
  modalHabito.classList.remove("activo");
});

function obtenerRutina() {
  const cache = localStorage.getItem(KEY_RUTINA(uid));
  return cache ? JSON.parse(cache) : [];
}

async function guardarRutina(rutina) {
  const ref = doc(db, "usuarios", uid, "avance", "rutina");
  await setDoc(ref, { habitos: rutina });
  localStorage.setItem(KEY_RUTINA(uid), JSON.stringify(rutina));
  localStorage.setItem(KEY_FECHA(uid), HOY);
}

function renderHabitos(rutina) {
  listaHabitos.innerHTML = "";
  const diaActual = new Date().getDay();
  const habitosHoy = rutina.filter(h => h.dias.includes(diaActual));
  habitosHoy.sort((a, b) => a.hora.localeCompare(b.hora));

  for (const [i, habito] of habitosHoy.entries()) {
    const li = document.createElement("div");
    li.className = "habito-item";

    const key = HOY;
    const checked = habito.completado?.[key] || false;

    const label = document.createElement("label");
    label.innerHTML = `
      <input type="checkbox" ${checked ? "checked" : ""}>
      <span><strong>${habito.hora}</strong> – ${habito.nombre}</span>
    `;
    label.querySelector("input").addEventListener("change", e => {
      habito.completado[key] = e.target.checked;
      guardarRutina(rutina);
    });

    li.appendChild(label);
    listaHabitos.appendChild(li);
  }
}

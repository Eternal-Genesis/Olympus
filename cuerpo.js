// cuerpo.js con almacenamiento híbrido local + Firestore estilo avance.js
import {
  auth,
  db,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc
} from "./firebase.js";

const hoy = new Date().toISOString().split("T")[0];
let uid = null;

// Keys para almacenamiento local
const planKey = uid => `plan-nutricional-${uid}`;
const syncKey = uid => `ultima-sync-plan-${uid}`;

// === Referencias UI ===
const infoPlan = document.getElementById("info-plan");
const btnConfigurarPlan = document.getElementById("btn-configurar-plan");
const btnRevisarProgreso = document.getElementById("btn-revisar-progreso");

// Modales y formularios
const modalPlan = document.getElementById("modal-plan");
const formPlan = document.getElementById("form-plan");
const btnCancelarPlan = document.getElementById("btn-cancelar-plan");

const modalProgreso = document.getElementById("modal-progreso");
const formProgreso = document.getElementById("form-progreso");
const btnCancelarProgreso = document.getElementById("btn-cancelar-progreso");

// Inputs Plan
const inputSexo = document.getElementById("sexo");
const inputEdad = document.getElementById("edad");
const inputAltura = document.getElementById("altura");
const inputPesoMeta = document.getElementById("peso-meta");
const inputActividad = document.getElementById("actividad");
const inputObjetivo = document.getElementById("objetivo");

// Inputs Progreso
const inputNuevoPeso = document.getElementById("nuevo-peso");
const inputNuevaActividad = document.getElementById("nueva-actividad");
const inputNuevoObjetivo = document.getElementById("nuevo-objetivo");

// === AUTENTICACIÓN Y CARGA ===
onAuthStateChanged(auth, async user => {
  if (!user) return;
  uid = user.uid;

  const local = localStorage.getItem(planKey(uid));
  const ultimaSync = localStorage.getItem(syncKey(uid));

  if (local && ultimaSync === hoy) {
    renderResumenPlan(JSON.parse(local));
  } else {
    try {
      const ref = doc(db, "usuarios", uid, "planNutricional", "datos");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        localStorage.setItem(planKey(uid), JSON.stringify(data));
        localStorage.setItem(syncKey(uid), hoy);
        renderResumenPlan(data);
      } else if (local) {
        renderResumenPlan(JSON.parse(local));
      }
    } catch (e) {
      console.error("Error obteniendo plan desde Firestore", e);
      if (local) renderResumenPlan(JSON.parse(local));
    }
  }
});

// === MOSTRAR PLAN ===
function renderResumenPlan(plan) {
  const { caloriasObjetivo, macros, objetivo } = plan;
  infoPlan.innerHTML = `
    <p><strong>Objetivo:</strong> ${objetivo === "deficit" ? "Perder grasa" : objetivo === "superavit" ? "Ganar músculo" : "Mantener peso"}</p>
    <p><strong>Calorías objetivo:</strong> ${caloriasObjetivo} kcal/día</p>
    <ul>
      <li>Proteínas: ${macros.proteinas} g</li>
      <li>Grasas: ${macros.grasas} g</li>
      <li>Carbohidratos: ${macros.carbos} g</li>
    </ul>
  `;
}

// === CONFIGURAR PLAN ===
btnConfigurarPlan.addEventListener("click", () => {
  modalPlan.classList.add("activo");
  cargarPlanEnFormulario();
});
btnCancelarPlan.addEventListener("click", () => cerrarModal(modalPlan));

formPlan.addEventListener("submit", async e => {
  e.preventDefault();
  if (!uid) return;

  const plan = recolectarDatosPlan(
    inputSexo.value,
    parseInt(inputEdad.value),
    parseInt(inputAltura.value),
    parseFloat(inputPesoMeta.value),
    parseFloat(inputActividad.value),
    inputObjetivo.value
  );

  localStorage.setItem(planKey(uid), JSON.stringify(plan));
  localStorage.setItem(syncKey(uid), hoy);
  await setDoc(doc(db, "usuarios", uid, "planNutricional", "datos"), { ...plan, actualizado: hoy });

  renderResumenPlan(plan);
  cerrarModal(modalPlan);
});

// === ACTUALIZAR PLAN ===
btnRevisarProgreso.addEventListener("click", () => modalProgreso.classList.add("activo"));
btnCancelarProgreso.addEventListener("click", () => cerrarModal(modalProgreso));

formProgreso.addEventListener("submit", async e => {
  e.preventDefault();
  if (!uid) return;

  const cache = localStorage.getItem(planKey(uid));
  if (!cache) return;
  const prev = JSON.parse(cache);

  const peso = parseFloat(inputNuevoPeso.value);
  const actividad = parseFloat(inputNuevaActividad.value) || prev.actividad;
  const objetivo = inputNuevoObjetivo.value || prev.objetivo;

  const plan = recolectarDatosPlan(prev.sexo, prev.edad, prev.altura, peso, actividad, objetivo);

  localStorage.setItem(planKey(uid), JSON.stringify(plan));
  localStorage.setItem(syncKey(uid), hoy);
  await setDoc(doc(db, "usuarios", uid, "planNutricional", "datos"), { ...plan, actualizado: hoy });

  renderResumenPlan(plan);
  cerrarModal(modalProgreso);
});

// === UTILIDADES ===
function cerrarModal(modal) {
  modal.classList.remove("activo");
  modal.querySelector("form").reset();
}

function recolectarDatosPlan(sexo, edad, altura, peso, actividad, objetivo) {
  let tmb = 10 * peso + 6.25 * altura - 5 * edad;
  tmb += sexo === "hombre" ? 5 : -161;

  const tdee = Math.round(tmb * actividad);
  let caloriasObjetivo = tdee;
  if (objetivo === "deficit") caloriasObjetivo = Math.round(tdee * 0.8);
  if (objetivo === "superavit") caloriasObjetivo = Math.round(tdee * 1.15);

  const proteinas = Math.round(peso * 2);
  const grasas = Math.round((caloriasObjetivo * 0.25) / 9);
  const carbos = Math.round((caloriasObjetivo - (proteinas * 4 + grasas * 9)) / 4);

  return {
    sexo, edad, altura, peso, actividad, objetivo,
    tmb: Math.round(tmb),
    tdee,
    caloriasObjetivo,
    macros: { proteinas, grasas, carbos }
  };
}

function cargarPlanEnFormulario() {
  const cache = localStorage.getItem(planKey(uid));
  if (!cache) return;
  const plan = JSON.parse(cache);
  inputSexo.value = plan.sexo;
  inputEdad.value = plan.edad;
  inputAltura.value = plan.altura;
  inputPesoMeta.value = plan.peso;
  inputActividad.value = plan.actividad;
  inputObjetivo.value = plan.objetivo;
}

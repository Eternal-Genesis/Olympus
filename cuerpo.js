// cuerpo.js con cálculo de grasa usando abdomen y mejor lógica de calorías
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

const planKey = uid => `plan-nutricional-${uid}`;
const syncKey = uid => `ultima-sync-plan-${uid}`;

const infoPlan = document.getElementById("info-plan");
const btnConfigurarPlan = document.getElementById("btn-configurar-plan");
const btnRevisarProgreso = document.getElementById("btn-revisar-progreso");

const modalPlan = document.getElementById("modal-plan");
const formPlan = document.getElementById("form-plan");
const btnCancelarPlan = document.getElementById("btn-cancelar-plan");

const modalProgreso = document.getElementById("modal-progreso");
const formProgreso = document.getElementById("form-progreso");
const btnCancelarProgreso = document.getElementById("btn-cancelar-progreso");

const inputSexo = document.getElementById("sexo");
const inputEdad = document.getElementById("edad");
const inputAltura = document.getElementById("altura");
const inputPesoMeta = document.getElementById("peso-meta");
const inputAbdomen = document.getElementById("abdomen");
const inputActividad = document.getElementById("actividad");
const inputObjetivo = document.getElementById("objetivo");

const inputNuevoPeso = document.getElementById("nuevo-peso");
const inputNuevaActividad = document.getElementById("nueva-actividad");
const inputNuevoObjetivo = document.getElementById("nuevo-objetivo");

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

function renderResumenPlan(plan) {
  const { caloriasObjetivo, macros, objetivo, porcentajeGrasa } = plan;
  infoPlan.innerHTML = `
    <p><strong>Objetivo:</strong> ${objetivo === "deficit" ? "Perder grasa" : objetivo === "superavit" ? "Ganar músculo" : "Mantener peso"}</p>
    <p><strong>Grasa corporal estimada:</strong> ${porcentajeGrasa?.toFixed(1)}%</p>
    <p><strong>Calorías objetivo:</strong> ${caloriasObjetivo} kcal/día</p>
    <ul>
      <li>Proteínas: ${macros.proteinas} g</li>
      <li>Grasas: ${macros.grasas} g</li>
      <li>Carbohidratos: ${macros.carbos} g</li>
    </ul>
  `;
}

btnConfigurarPlan.addEventListener("click", () => {
  modalPlan.classList.add("activo");
  cargarPlanEnFormulario();
});
btnCancelarPlan.addEventListener("click", () => cerrarModal(modalPlan));

formPlan.addEventListener("submit", async e => {
  e.preventDefault();
  if (!uid) return;

  const plan = calcularPlanNutricional({
    sexo: inputSexo.value,
    edad: parseInt(inputEdad.value),
    altura: parseInt(inputAltura.value),
    peso: parseFloat(inputPesoMeta.value),
    abdomen: parseFloat(inputAbdomen.value),
    actividad: parseFloat(inputActividad.value),
    objetivo: inputObjetivo.value
  });

  localStorage.setItem(planKey(uid), JSON.stringify(plan));
  localStorage.setItem(syncKey(uid), hoy);
  await setDoc(doc(db, "usuarios", uid, "planNutricional", "datos"), { ...plan, actualizado: hoy });
  renderResumenPlan(plan);
  cerrarModal(modalPlan);
});

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

  const plan = calcularPlanNutricional({ ...prev, peso, actividad, objetivo });

  localStorage.setItem(planKey(uid), JSON.stringify(plan));
  localStorage.setItem(syncKey(uid), hoy);
  await setDoc(doc(db, "usuarios", uid, "planNutricional", "datos"), { ...plan, actualizado: hoy });

  renderResumenPlan(plan);
  cerrarModal(modalProgreso);
});

function cerrarModal(modal) {
  modal.classList.remove("activo");
  modal.querySelector("form").reset();
}

function calcularPlanNutricional({ sexo, edad, altura, peso, abdomen, actividad, objetivo }) {
  const ratio = altura / abdomen;
  const porcentajeGrasa = Math.min(50, Math.max(4, 76.5 - 20 * ratio));
  const pesoMagra = peso * (1 - porcentajeGrasa / 100);

  let tmb = 370 + 21.6 * pesoMagra;
  const tdee = Math.round(tmb * actividad);

  const objetivoFactor = objetivo === "deficit" ? 0.9 : objetivo === "superavit" ? 1.1 : 1.0;
  let caloriasObjetivo = Math.round(tdee * objetivoFactor);

  // Lógica de seguridad: evitar déficits o superávits extremos
  const minKcal = sexo === "mujer" ? 1300 : 1700;
  const maxKcal = 4200;
  caloriasObjetivo = Math.min(maxKcal, Math.max(minKcal, caloriasObjetivo));

  const proteinaFactor = objetivo === "superavit" ? 2.4 : objetivo === "deficit" ? 2.2 : 2.0;
  const proteinas = Math.round(pesoMagra * proteinaFactor);
  const grasas = Math.round((caloriasObjetivo * 0.25) / 9);
  const carbos = Math.round((caloriasObjetivo - (proteinas * 4 + grasas * 9)) / 4);

  return {
    sexo, edad, altura, peso, abdomen, actividad, objetivo,
    porcentajeGrasa,
    pesoMagra: Math.round(pesoMagra),
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
  inputAbdomen.value = plan.abdomen;
  inputActividad.value = plan.actividad;
  inputObjetivo.value = plan.objetivo;
}

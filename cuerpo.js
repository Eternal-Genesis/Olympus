import {
  auth,
  db,
  onAuthStateChanged,
  doc,
  setDoc
} from "./firebase.js";

// === FECHA Y UID ===
const hoy = new Date().toISOString().split("T")[0];
let uid = null;

// === UTILIDADES DE CLAVES ===
const pesoKey = (uid) => `historial-peso-${uid}`;
const planKey = (uid) => `plan-nutricional-${uid}`;

// === ELEMENTOS: PESO ===
const pesoActualTexto = document.getElementById("peso-actual");
const graficoPesoCanvas = document.getElementById("grafico-peso");
const modalPeso = document.getElementById("modal-peso");
const formPeso = document.getElementById("form-peso");
const inputPeso = document.getElementById("input-peso");
const btnRegistrarPeso = document.getElementById("btn-registrar-peso");
const btnCancelarPeso = document.getElementById("btn-cancelar-peso");

let historial = {};
let graficoPeso = null;

// === ELEMENTOS: PLAN ===
const btnConfigurarPlan = document.getElementById("btn-configurar-plan");
const modalPlan = document.getElementById("modal-plan");
const formPlan = document.getElementById("form-plan");
const btnCancelarPlan = document.getElementById("btn-cancelar-plan");
const infoPlan = document.getElementById("info-plan");

const inputSexo = document.getElementById("sexo");
const inputEdad = document.getElementById("edad");
const inputAltura = document.getElementById("altura");
const inputPesoMeta = document.getElementById("peso-meta");
const inputActividad = document.getElementById("actividad");
const inputObjetivo = document.getElementById("objetivo");

// === AUTENTICACIÓN ===
onAuthStateChanged(auth, (user) => {
  if (!user) return;
  uid = user.uid;

  // Cargar peso
  const cache = localStorage.getItem(pesoKey(uid));
  historial = cache ? JSON.parse(cache) : {};
  renderPesoActual();
  renderGraficoPeso();

  // Cargar plan
  renderResumenPlan();
});

// === PESO: Mostrar último peso ===
function renderPesoActual() {
  const fechas = Object.keys(historial).sort();
  const ultima = fechas.at(-1);
  pesoActualTexto.textContent = ultima ? `${historial[ultima]} kg` : "-- kg";
}

// === PESO: Graficar historial ===
function renderGraficoPeso() {
  const fechas = Object.keys(historial).sort().slice(-12);
  const valores = fechas.map(f => historial[f]);
  const ctx = graficoPesoCanvas.getContext("2d");

  if (graficoPeso) graficoPeso.destroy();

  graficoPeso = new Chart(ctx, {
    type: "line",
    data: {
      labels: fechas,
      datasets: [{
        label: "Peso corporal (kg)",
        data: valores,
        borderColor: "#00f0ff",
        backgroundColor: "rgba(0, 240, 255, 0.1)",
        tension: 0.3,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: "#00f0ff"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          ticks: { color: "#aaa" },
          grid: { color: "#333" }
        },
        x: {
          ticks: { color: "#aaa" },
          grid: { display: false }
        }
      }
    }
  });
}

// === PESO: Guardar nuevo ===
formPeso.addEventListener("submit", (e) => {
  e.preventDefault();
  const peso = parseFloat(inputPeso.value);
  if (!uid || isNaN(peso)) return;

  historial[hoy] = peso;
  localStorage.setItem(pesoKey(uid), JSON.stringify(historial));
  cerrarModalPeso();
  renderPesoActual();
  renderGraficoPeso();
});

// === PESO: Modal abrir/cerrar ===
btnRegistrarPeso.addEventListener("click", () => {
  modalPeso.classList.add("activo");
  inputPeso.focus();
});

btnCancelarPeso.addEventListener("click", cerrarModalPeso);
function cerrarModalPeso() {
  modalPeso.classList.remove("activo");
  formPeso.reset();
}

// === PLAN: Abrir Modal ===
btnConfigurarPlan.addEventListener("click", () => {
  modalPlan.classList.add("activo");
  cargarPlanEnFormulario();
});

btnCancelarPlan.addEventListener("click", cerrarModalPlan);
function cerrarModalPlan() {
  modalPlan.classList.remove("activo");
  formPlan.reset();
}

// === PLAN: Guardar y calcular ===
formPlan.addEventListener("submit", (e) => {
  e.preventDefault();

  const sexo = inputSexo.value;
  const edad = parseInt(inputEdad.value);
  const altura = parseInt(inputAltura.value);
  const peso = parseFloat(inputPesoMeta.value);
  const actividad = parseFloat(inputActividad.value);
  const objetivo = inputObjetivo.value;

  if (!sexo || !edad || !altura || !peso || !actividad || !objetivo || !uid) return;

  // Calcular TMB
  let tmb = 10 * peso + 6.25 * altura - 5 * edad;
  tmb += sexo === "hombre" ? 5 : -161;

  const tdee = Math.round(tmb * actividad);

  let caloriasObjetivo = tdee;
  if (objetivo === "deficit") caloriasObjetivo = Math.round(tdee * 0.8);
  if (objetivo === "superavit") caloriasObjetivo = Math.round(tdee * 1.15);

  const proteinas = Math.round(peso * 2);
  const grasas = Math.round((caloriasObjetivo * 0.25) / 9);
  const carbos = Math.round((caloriasObjetivo - (proteinas * 4 + grasas * 9)) / 4);

  const plan = {
    sexo, edad, altura, peso, actividad, objetivo,
    tmb: Math.round(tmb),
    tdee,
    caloriasObjetivo,
    macros: { proteinas, grasas, carbos }
  };

  localStorage.setItem(planKey(uid), JSON.stringify(plan));
  renderResumenPlan(plan);
  cerrarModalPlan();
});

// === PLAN: Mostrar resumen ===
function renderResumenPlan(plan = null) {
  if (!plan && uid) {
    const cache = localStorage.getItem(planKey(uid));
    plan = cache ? JSON.parse(cache) : null;
  }
  if (!plan) {
    infoPlan.innerHTML = `<p>No se ha configurado ningún plan.</p>`;
    return;
  }

  const { caloriasObjetivo, macros, objetivo } = plan;
  infoPlan.innerHTML = `
    <p><strong>Objetivo:</strong> ${objetivo === "deficit" ? "Perder grasa" :
                                   objetivo === "superavit" ? "Ganar músculo" : "Mantener peso"}</p>
    <p><strong>Calorías objetivo:</strong> ${caloriasObjetivo} kcal/día</p>
    <ul>
      <li>Proteínas: ${macros.proteinas} g</li>
      <li>Grasas: ${macros.grasas} g</li>
      <li>Carbohidratos: ${macros.carbos} g</li>
    </ul>
  `;
}

// === PLAN: Precargar datos en el formulario ===
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

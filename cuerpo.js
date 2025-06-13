// === Referencias de elementos del plan ===
const btnConfigurarPlan = document.getElementById("btn-configurar-plan");
const modalPlan = document.getElementById("modal-plan");
const formPlan = document.getElementById("form-plan");
const btnCancelarPlan = document.getElementById("btn-cancelar-plan");
const infoPlan = document.getElementById("info-plan");

// === Campos del formulario ===
const inputSexo = document.getElementById("sexo");
const inputEdad = document.getElementById("edad");
const inputAltura = document.getElementById("altura");
const inputPesoMeta = document.getElementById("peso-meta");
const inputActividad = document.getElementById("actividad");
const inputObjetivo = document.getElementById("objetivo");

const planKey = (uid) => `plan-nutricional-${uid}`;

// === Abrir/Cerrar Modal ===
btnConfigurarPlan.addEventListener("click", () => {
  modalPlan.classList.add("activo");
  cargarPlanEnFormulario();
});

btnCancelarPlan.addEventListener("click", cerrarModalPlan);

function cerrarModalPlan() {
  modalPlan.classList.remove("activo");
  formPlan.reset();
}

// === Guardar Plan Nutricional ===
formPlan.addEventListener("submit", (e) => {
  e.preventDefault();

  const sexo = inputSexo.value;
  const edad = parseInt(inputEdad.value);
  const altura = parseInt(inputAltura.value);
  const peso = parseFloat(inputPesoMeta.value);
  const actividad = parseFloat(inputActividad.value);
  const objetivo = inputObjetivo.value;

  if (!sexo || !edad || !altura || !peso || !actividad || !objetivo || !uid) return;

  // === Cálculo de TMB (Mifflin-St Jeor) ===
  let tmb = 10 * peso + 6.25 * altura - 5 * edad;
  tmb += sexo === "hombre" ? 5 : -161;

  const tdee = Math.round(tmb * actividad);

  let caloriasObjetivo = tdee;
  if (objetivo === "deficit") caloriasObjetivo = Math.round(tdee * 0.8);
  if (objetivo === "superavit") caloriasObjetivo = Math.round(tdee * 1.15);

  // === Macronutrientes aproximados ===
  const proteinas = Math.round(peso * 2); // g por kg
  const grasas = Math.round((caloriasObjetivo * 0.25) / 9); // 25% de grasas
  const carbos = Math.round((caloriasObjetivo - (proteinas * 4 + grasas * 9)) / 4);

  const plan = {
    sexo, edad, altura, peso, actividad, objetivo,
    tmb: Math.round(tmb),
    tdee,
    caloriasObjetivo,
    macros: {
      proteinas,
      grasas,
      carbos
    }
  };

  localStorage.setItem(planKey(uid), JSON.stringify(plan));
  renderResumenPlan(plan);
  cerrarModalPlan();
});

// === Mostrar resumen del plan ===
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

// === Precargar valores al abrir modal ===
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

// === Cargar plan al autenticar usuario ===
onAuthStateChanged(auth, (user) => {
  if (!user) return;
  uid = user.uid;
  renderResumenPlan();
});


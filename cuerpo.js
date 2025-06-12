import { auth, onAuthStateChanged } from "./firebase.js";

let uid = null;

// Control de pestañas (tabs)
const tabBtns = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

// Función para cambiar de pestaña
function mostrarTab(tabId) {
  tabBtns.forEach(btn => {
    if (btn.dataset.tab === tabId) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  tabContents.forEach(content => {
    if (content.id === `tab-${tabId}`) {
      content.classList.add("active");
    } else {
      content.classList.remove("active");
    }
  });
}

tabBtns.forEach(btn => {
  btn.addEventListener("click", () => mostrarTab(btn.dataset.tab));
});

// Inicializamos mostrando la primera pestaña (Resumen)
mostrarTab("resumen");

onAuthStateChanged(auth, (user) => {
  if (!user) return;

  uid = user.uid;
  const cachePlan = localStorage.getItem(`plan-nutricional-${uid}`);
  const cacheRevision = localStorage.getItem(`revision-${uid}`);

  if (cachePlan) {
    const plan = JSON.parse(cachePlan);
    mostrarResumen(plan);
    mostrarPlanNutricional(plan);
  }

  if (cacheRevision) {
    mostrarRevision(cacheRevision);
  }
});

function mostrarResumen(plan) {
  document.getElementById("peso-actual").textContent = `${plan.peso} kg`;
  document.getElementById("calorias-dia").textContent = `${plan.calorias} kcal`;
  document.getElementById("objetivo-general").textContent = plan.objetivo;
  document.getElementById("ultima-revision").textContent = plan.fechaUltimaRevision;
}

function mostrarPlanNutricional(plan) {
  const contenedorNutricion = document.getElementById("contenedor-nutricion");
  contenedorNutricion.innerHTML = `
    <h3>Plan Nutricional Diario</h3>
    <p><strong>Calorías objetivo:</strong> ${plan.calorias} kcal</p>
    <p><strong>Proteínas:</strong> ${plan.proteinas} g</p>
    <p><strong>Carbohidratos:</strong> ${plan.carbohidratos} g</p>
    <p><strong>Grasas:</strong> ${plan.grasas} g</p>
  `;
}

function mostrarRevision(revision) {
  const revisionSection = document.getElementById("revision-mensual");
  revisionSection.innerHTML = `
    <h3>Última Revisión</h3>
    <p><strong>Peso anterior:</strong> ${revision.pesoAnterior} kg</p>
    <p><strong>Nuevo peso:</strong> ${revision.pesoActual} kg</p>
    <p><strong>Objetivo de ajuste:</strong> ${revision.ajuste}</p>
  `;
}

document.getElementById("revision-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const pesoActual = parseFloat(document.getElementById("peso-actual").value);
  if (!uid || isNaN(pesoActual)) return;

  const plan = JSON.parse(localStorage.getItem(`plan-nutricional-${uid}`));
  if (!plan) return;

  plan.peso = pesoActual;
  plan.fechaUltimaRevision = new Date().toISOString().split("T")[0];

  const planActualizado = calcularPlanNutricional({
    sexo: plan.sexo,
    edad: plan.edad,
    peso: pesoActual,
    altura: plan.altura,
    actividad: plan.actividad,
    objetivo: plan.objetivo
  });

  Object.assign(plan, planActualizado);

  localStorage.setItem(`plan-nutricional-${uid}`, JSON.stringify(plan));
  mostrarPlanNutricional(plan);

  const revision = {
    pesoAnterior: plan.peso,
    pesoActual: pesoActual,
    ajuste: plan.objetivo === "bajar" ? "Reducir calorías" : "Mantener calorías"
  };
  
  localStorage.setItem(`revision-${uid}`, JSON.stringify(revision));
  mostrarRevision(revision);

  alert("Plan actualizado correctamente.");
});

function calcularPlanNutricional({ sexo, edad, peso, altura, actividad, objetivo }) {
  const tmb =
    sexo === "hombre"
      ? 10 * peso + 6.25 * altura - 5 * edad + 5
      : 10 * peso + 6.25 * altura - 5 * edad - 161;

  let calorias = Math.round(tmb * actividad);
  if (objetivo === "bajar") calorias -= 300;
  else if (objetivo === "subir") calorias += 300;

  const proteinas = Math.round((calorias * 0.25) / 4);
  const carbohidratos = Math.round((calorias * 0.5) / 4);
  const grasas = Math.round((calorias * 0.25) / 9);

  return { calorias, proteinas, carbohidratos, grasas };
}


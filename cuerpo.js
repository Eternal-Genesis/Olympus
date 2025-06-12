import { auth, onAuthStateChanged } from "./firebase.js";

let uid = null;
let caloriasConsumidas = 0;
let entrenamientosCompletados = 0;

// Seccion de Alimentación
const formComida = document.getElementById("form-comida");
const listaComidas = document.getElementById("lista-comidas");
const caloriasDia = document.getElementById("calorias-consumidas");
const planCalorias = document.getElementById("plan-calorias");
const planProteinas = document.getElementById("plan-proteinas");
const planCarbohidratos = document.getElementById("plan-carbohidratos");
const planGrasas = document.getElementById("plan-grasas");

// Seccion de Entrenamiento
const formEntrenamiento = document.getElementById("form-entrenamiento");
const listaEntrenamientos = document.getElementById("registro-entrenamiento");
const entrenamientosTotales = document.getElementById("entrenamientos-completados");

onAuthStateChanged(auth, (user) => {
  if (!user) return;

  uid = user.uid;

  // Recupera el plan nutricional
  const cachePlan = localStorage.getItem(`plan-nutricional-${uid}`);
  if (cachePlan) {
    const plan = JSON.parse(cachePlan);
    mostrarPlanNutricional(plan);
  }

  // Recupera las comidas registradas
  const comidasCache = JSON.parse(localStorage.getItem(`comidas-${uid}`)) || [];
  comidasCache.forEach(comida => {
    mostrarComida(comida);
  });

  // Recupera los entrenamientos registrados
  const entrenamientosCache = JSON.parse(localStorage.getItem(`entrenamientos-${uid}`)) || [];
  entrenamientosCache.forEach(entrenamiento => {
    mostrarEntrenamiento(entrenamiento);
  });
});

formComida.addEventListener("submit", (e) => {
  e.preventDefault();
  const nombreComida = document.getElementById("nombre-comida").value;
  const caloriasComida = parseFloat(document.getElementById("calorias-comida").value);

  if (nombreComida && !isNaN(caloriasComida)) {
    const comida = {
      nombre: nombreComida,
      calorias: caloriasComida,
    };

    // Actualizar calorías consumidas
    caloriasConsumidas += caloriasComida;
    localStorage.setItem(`comidas-${uid}`, JSON.stringify([...JSON.parse(localStorage.getItem(`comidas-${uid}`)) || [], comida]));

    mostrarComida(comida);
    mostrarProgresoDiario();
  }
});

function mostrarComida(comida) {
  const divComida = document.createElement("div");
  divComida.classList.add("comida-item");
  divComida.innerHTML = `
    <span>${comida.nombre}</span> - ${comida.calorias} kcal
  `;
  listaComidas.appendChild(divComida);
}

function mostrarProgresoDiario() {
  caloriasDia.textContent = `${caloriasConsumidas} kcal`;
}

function mostrarPlanNutricional(plan) {
  planCalorias.textContent = `${plan.calorias} kcal`;
  planProteinas.textContent = `${plan.proteinas} g`;
  planCarbohidratos.textContent = `${plan.carbohidratos} g`;
  planGrasas.textContent = `${plan.grasas} g`;
}

// Sección Entrenamiento
formEntrenamiento.addEventListener("submit", (e) => {
  e.preventDefault();
  const ejercicio = document.getElementById("ejercicio").value;
  const series = parseInt(document.getElementById("series").value);
  const repeticiones = parseInt(document.getElementById("repeticiones").value);

  if (ejercicio && !isNaN(series) && !isNaN(repeticiones)) {
    const entrenamiento = {
      ejercicio: ejercicio,
      series: series,
      repeticiones: repeticiones,
    };

    // Incrementar el contador de entrenamientos completados
    entrenamientosCompletados++;
    localStorage.setItem(`entrenamientos-${uid}`, JSON.stringify([...JSON.parse(localStorage.getItem(`entrenamientos-${uid}`)) || [], entrenamiento]));

    mostrarEntrenamiento(entrenamiento);
    mostrarProgresoEntrenamiento();
  }
});

function mostrarEntrenamiento(entrenamiento) {
  const divEntrenamiento = document.createElement("div");
  divEntrenamiento.classList.add("entrenamiento-item");
  divEntrenamiento.innerHTML = `
    <span>${entrenamiento.ejercicio}</span> - ${entrenamiento.series} series x ${entrenamiento.repeticiones} repeticiones
  `;
  listaEntrenamientos.appendChild(divEntrenamiento);
}

function mostrarProgresoEntrenamiento() {
  entrenamientosTotales.textContent = `${entrenamientosCompletados} entrenamientos completados`;
}

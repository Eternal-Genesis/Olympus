import { auth, onAuthStateChanged } from "./firebase.js";

let uid = null;

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("evaluacion-form");
  const sectionEvaluacion = document.getElementById("evaluacion-section");
  const sectionPlan = document.getElementById("plan-section");

  const spanCalorias = document.getElementById("plan-calorias");
  const spanProteinas = document.getElementById("plan-proteinas");
  const spanCarbohidratos = document.getElementById("plan-carbohidratos");
  const spanGrasas = document.getElementById("plan-grasas");
  const btnReiniciar = document.getElementById("reiniciar-plan");

  const planKey = (uid) => `plan-nutricional-${uid}`;

  onAuthStateChanged(auth, (user) => {
    if (!user) return;
    uid = user.uid;

    const cache = localStorage.getItem(planKey(uid));
    if (cache) {
      mostrarPlan(JSON.parse(cache));
      sectionEvaluacion.classList.add("oculto");
      sectionPlan.classList.remove("oculto");
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const sexo = document.getElementById("sexo").value;
    const edad = parseInt(document.getElementById("edad").value);
    const peso = parseFloat(document.getElementById("peso").value);
    const altura = parseInt(document.getElementById("altura").value);
    const actividad = parseFloat(document.getElementById("actividad").value);
    const objetivo = document.getElementById("objetivo").value;

    const plan = calcularPlanNutricional({ sexo, edad, peso, altura, actividad, objetivo });

    localStorage.setItem(planKey(uid), JSON.stringify(plan));
    mostrarPlan(plan);
    sectionEvaluacion.classList.add("oculto");
    sectionPlan.classList.remove("oculto");
  });

  btnReiniciar.addEventListener("click", () => {
    if (!uid) return;
    localStorage.removeItem(planKey(uid));
    sectionPlan.classList.add("oculto");
    sectionEvaluacion.classList.remove("oculto");
    document.getElementById("evaluacion-form").reset();
  });

  function mostrarPlan(plan) {
    spanCalorias.textContent = `${plan.calorias} kcal`;
    spanProteinas.textContent = `${plan.proteinas} g`;
    spanCarbohidratos.textContent = `${plan.carbohidratos} g`;
    spanGrasas.textContent = `${plan.grasas} g`;
  }

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
});

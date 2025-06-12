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

  const sectionRevision = document.getElementById("revision-section");
  const revisionForm = document.getElementById("revision-form");
  const estadoRevision = document.getElementById("estado-revision");

  const planKey = (uid) => `plan-nutricional-${uid}`;
  const revisionKey = (uid) => `revision-${uid}`;

  onAuthStateChanged(auth, (user) => {
    if (!user) return;
    uid = user.uid;

    const cache = localStorage.getItem(planKey(uid));
    if (cache) {
      const plan = JSON.parse(cache);
      mostrarPlan(plan);
      sectionEvaluacion.classList.add("oculto");
      sectionPlan.classList.remove("oculto");
      verificarRevision(plan);
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
    plan.sexo = sexo;
    plan.edad = edad;
    plan.peso = peso;
    plan.altura = altura;
    plan.actividad = actividad;
    plan.objetivo = objetivo;
    plan.fechaUltimaRevision = new Date().toISOString().split("T")[0];

    localStorage.setItem(planKey(uid), JSON.stringify(plan));
    mostrarPlan(plan);
    sectionEvaluacion.classList.add("oculto");
    sectionPlan.classList.remove("oculto");
    verificarRevision(plan);
  });

  btnReiniciar.addEventListener("click", () => {
    if (!uid) return;
    localStorage.removeItem(planKey(uid));
    localStorage.removeItem(revisionKey(uid));
    sectionPlan.classList.add("oculto");
    sectionRevision.classList.add("oculto");
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

  function verificarRevision(plan) {
    sectionRevision.classList.remove("oculto");

    const ultimaFecha = plan.fechaUltimaRevision;
    const hoy = new Date();
    const fechaUltima = new Date(ultimaFecha);
    const dias = Math.floor((hoy - fechaUltima) / (1000 * 60 * 60 * 24));

    if (dias >= 30) {
      estadoRevision.textContent = "Ya pasaron 30 días. Es hora de actualizar tu peso.";
      revisionForm.classList.remove("oculto");
    } else {
      estadoRevision.textContent = `Próxima revisión disponible en ${30 - dias} días.`;
      revisionForm.classList.add("oculto");
    }
  }

  revisionForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const nuevoPeso = parseFloat(document.getElementById("peso-actual").value);
    if (!uid || isNaN(nuevoPeso)) return;

    const plan = JSON.parse(localStorage.getItem(planKey(uid)));
    if (!plan) return;

    plan.peso = nuevoPeso;
    plan.fechaUltimaRevision = new Date().toISOString().split("T")[0];

    const planActualizado = calcularPlanNutricional({
      sexo: plan.sexo,
      edad: plan.edad,
      peso: nuevoPeso,
      altura: plan.altura,
      actividad: plan.actividad,
      objetivo: plan.objetivo
    });

    Object.assign(plan, planActualizado);

    localStorage.setItem(planKey(uid), JSON.stringify(plan));
    mostrarPlan(plan);
    verificarRevision(plan);

    alert("Plan actualizado correctamente según tu nuevo peso.");
  });
});

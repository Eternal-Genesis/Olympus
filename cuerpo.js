// cuerpo.js – cálculo de plan nutricional personalizado
import { auth, onAuthStateChanged } from "./firebase.js";

const form = document.getElementById("form-datos");
const edadInput = document.getElementById("edad");
const alturaInput = document.getElementById("altura");
const pesoInput = document.getElementById("peso");
const sexoInput = document.getElementById("sexo");
const actividadInput = document.getElementById("actividad");
const objetivoInput = document.getElementById("objetivo");

const seccionResultado = document.getElementById("seccion-resultado");
const caloriasSpan = document.getElementById("calorias");
const proteinasSpan = document.getElementById("proteinas");
const carbohidratosSpan = document.getElementById("carbohidratos");
const grasasSpan = document.getElementById("grasas");

let uid = null;

onAuthStateChanged(auth, user => {
  if (!user) return;
  uid = user.uid;
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const edad = parseInt(edadInput.value);
  const altura = parseInt(alturaInput.value);
  const peso = parseInt(pesoInput.value);
  const sexo = sexoInput.value;
  const actividad = parseFloat(actividadInput.value);
  const objetivo = objetivoInput.value;

  if (!edad || !altura || !peso || !sexo || !actividad || !objetivo) return;

  // Calcular TMB (Mifflin-St Jeor)
  let tmb = sexo === "masculino"
    ? 10 * peso + 6.25 * altura - 5 * edad + 5
    : 10 * peso + 6.25 * altura - 5 * edad - 161;

  // Ajustar por actividad
  let calorias = tmb * actividad;

  // Ajustar por objetivo
  if (objetivo === "bajar") calorias -= 400;
  if (objetivo === "subir") calorias += 300;

  // Macronutrientes base
  const proteinas = Math.round(peso * 2);
  const grasas = Math.round(peso * 1);
  const caloriasProteinas = proteinas * 4;
  const caloriasGrasas = grasas * 9;
  const caloriasCarbs = calorias - (caloriasProteinas + caloriasGrasas);
  const carbohidratos = Math.round(caloriasCarbs / 4);

  // Mostrar resultado
  caloriasSpan.textContent = Math.round(calorias);
  proteinasSpan.textContent = proteinas;
  carbohidratosSpan.textContent = carbohidratos;
  grasasSpan.textContent = grasas;
  seccionResultado.classList.remove("oculto");

  // Guardar en localStorage por hoy
  const data = {
    edad, altura, peso, sexo, actividad, objetivo,
    calorias: Math.round(calorias), proteinas, carbohidratos, grasas
  };
  localStorage.setItem(`nutricion-${uid}`, JSON.stringify(data));
});

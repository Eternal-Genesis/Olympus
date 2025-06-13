import {
  auth,
  db,
  onAuthStateChanged,
  doc,
  setDoc
} from "./firebase.js";

// === Referencias ===
const pesoActualTexto = document.getElementById("peso-actual");
const graficoPesoCanvas = document.getElementById("grafico-peso");
const modalPeso = document.getElementById("modal-peso");
const formPeso = document.getElementById("form-peso");
const inputPeso = document.getElementById("input-peso");
const btnRegistrarPeso = document.getElementById("btn-registrar-peso");
const btnCancelarPeso = document.getElementById("btn-cancelar-peso");

const hoy = new Date().toISOString().split("T")[0];
let uid = null;
let historial = {};
let graficoPeso = null;

const pesoKey = (uid) => `historial-peso-${uid}`;

// === Autenticación ===
onAuthStateChanged(auth, (user) => {
  if (!user) return;
  uid = user.uid;

  const cache = localStorage.getItem(pesoKey(uid));
  historial = cache ? JSON.parse(cache) : {};

  renderPesoActual();
  renderGraficoPeso();
});

// === Mostrar el peso más reciente ===
function renderPesoActual() {
  const fechas = Object.keys(historial).sort();
  const ultima = fechas.at(-1);
  if (ultima) {
    pesoActualTexto.textContent = `${historial[ultima]} kg`;
  } else {
    pesoActualTexto.textContent = "-- kg";
  }
}

// === Dibujar gráfico ===
function renderGraficoPeso() {
  const fechas = Object.keys(historial).sort().slice(-12); // últimos 12 registros
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

// === Guardar nuevo peso ===
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

// === Abrir/Cerrar modal ===
btnRegistrarPeso.addEventListener("click", () => {
  modalPeso.classList.add("activo");
  inputPeso.focus();
});

btnCancelarPeso.addEventListener("click", cerrarModalPeso);

function cerrarModalPeso() {
  modalPeso.classList.remove("activo");
  formPeso.reset();
}

// avance.js corregido: guarda correctamente hábitos y asegura que el gráfico se renderice
import {
  auth,
  db,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc
} from "./firebase.js";

const hoy = new Date().toISOString().split("T")[0];

const habitosHoyKey = (uid) => `habitos-hoy-${uid}`;
const historialKey = (uid) => `historial-${uid}`;
const estadisticasKey = (uid) => `estadisticas-${uid}`;

let uid = null;
let habitos = [];

const contenedorHabitos = document.querySelector(".habitos-hoy");
const contenedorHistorial = document.querySelector(".lista-historial");
const modal = document.getElementById("modal-habito");
const form = document.getElementById("form-habito");
const inputNombre = document.getElementById("habito-nombre");
const inputId = document.getElementById("habito-id");
const btnCancelar = document.getElementById("btn-cancelar");
const btnNuevo = document.getElementById("btn-crear-habito");

onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  uid = user.uid;

  document.getElementById("loading")?.classList.remove("oculto");

  const cacheStats = localStorage.getItem(estadisticasKey(uid));
  if (cacheStats) renderGrafico(JSON.parse(cacheStats));

  await Promise.all([
    cargarHabitos(uid),
    cargarHistorial(uid),
    cargarEstadisticas(uid)
  ]);

  renderHabitos();
  document.getElementById("loading")?.classList.add("oculto");
});

async function cargarHabitos(uid) {
  const ref = doc(db, "usuarios", uid, "historialHabitos", hoy);
  const snap = await getDoc(ref);
  habitos = snap.exists() ? snap.data().items : [];
  localStorage.setItem(habitosHoyKey(uid), JSON.stringify(habitos));
}

async function guardarHabitos() {
  if (!uid) return;
  const ref = doc(db, "usuarios", uid, "historialHabitos", hoy);
  await setDoc(ref, { items: habitos }); // sin merge para asegurar reemplazo total
  localStorage.setItem(habitosHoyKey(uid), JSON.stringify(habitos));
}

function renderHabitos() {
  contenedorHabitos.innerHTML = "";
  habitos.forEach(h => {
    const div = document.createElement("div");
    div.className = "habito-item" + (h.completado ? " completado" : "");
    div.innerHTML = `
      <span>${h.nombre}</span>
      <div class="acciones-habito">
        <button data-accion="completar" data-id="${h.id}">
          ${h.completado ? "✓" : "Marcar"}
        </button>
        <div class="menu-container">
          <button class="btn-menu" data-id="${h.id}">⋯</button>
          <ul class="menu-opciones oculto" data-id="${h.id}">
            <li data-accion="editar">Editar</li>
            <li data-accion="eliminar">Eliminar</li>
          </ul>
        </div>
      </div>
    `;
    contenedorHabitos.appendChild(div);
  });
}

async function cargarHistorial(uid) {
  const dias = 4;
  const historial = [];
  contenedorHistorial.innerHTML = "";

  for (let i = 1; i <= dias; i++) {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - i);
    const diaStr = fecha.toISOString().split("T")[0];
    const ref = doc(db, "usuarios", uid, "historialHabitos", diaStr);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data();
      historial.push({ fecha: diaStr, items: data.items });
    }
  }

  localStorage.setItem(historialKey(uid), JSON.stringify(historial));
  renderHistorial(historial);
}

function renderHistorial(historial) {
  contenedorHistorial.innerHTML = "";
  historial.forEach(({ fecha, items }) => {
    const fechaObj = new Date(fecha);
    const fechaTexto = `${obtenerDiaSemana(fechaObj)} ${fechaObj.getDate().toString().padStart(2, '0')} ${obtenerMes(fechaObj)}`;
    const card = document.createElement("div");
    card.className = "habito-dia";
    card.innerHTML = `<h4>${fechaTexto}</h4>`;
    items.forEach(h => {
      const div = document.createElement("div");
      div.className = `habito ${h.completado ? '' : 'incompleto'}`;
      div.innerHTML = `<span class="estado">${h.completado ? '✓' : '✗'}</span>${h.nombre}`;
      card.appendChild(div);
    });
    contenedorHistorial.appendChild(card);
  });
}

async function cargarEstadisticas(uid) {
  const labels = [];
  const porcentajes = [];
  const detalles = [];

  for (let i = 30; i >= 1; i--) {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - i);
    const fechaStr = fecha.toISOString().split("T")[0];
    const ref = doc(db, "usuarios", uid, "historialHabitos", fechaStr);
    const snap = await getDoc(ref);

    labels.push(fecha.getDate().toString().padStart(2, "0"));

    if (snap.exists()) {
      const items = snap.data().items;
      const total = items.length;
      const completados = items.filter(h => h.completado).length;
      const porcentaje = total > 0 ? Math.round((completados / total) * 100) : 0;
      porcentajes.push(porcentaje);
      detalles.push(`${porcentaje}% completado (${completados} de ${total})`);
    } else {
      porcentajes.push(0);
      detalles.push("0% completado (0 de 0)");
    }
  }

  const datos = { labels, porcentajes, detalles };
  localStorage.setItem(estadisticasKey(uid), JSON.stringify(datos));
  renderGrafico(datos);
}

function renderGrafico({ labels, porcentajes, detalles }) {
  const canvas = document.getElementById("grafico-habitos");
  if (!canvas) return;
  canvas.style.display = "block"; // asegurar visibilidad
  const ctx = canvas.getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Porcentaje de cumplimiento diario",
        data: porcentajes,
        fill: true,
        borderColor: "#00f0ff",
        backgroundColor: "rgba(0, 240, 255, 0.1)",
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: "#00f0ff"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: (ctx) => detalles[ctx.dataIndex]
          },
          backgroundColor: "#2a2a2a",
          titleColor: "#00f0ff",
          bodyColor: "#fff"
        },
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: { color: "#aaa", callback: val => val + "%" },
          grid: { color: "#333", drawBorder: false }
        },
        x: {
          ticks: { color: "#aaa" },
          grid: { display: false }
        }
      }
    }
  });
}

function obtenerDiaSemana(f) {
  return ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][f.getDay()];
}

function obtenerMes(f) {
  return ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"][f.getMonth()];
}

contenedorHabitos.addEventListener("click", async e => {
  const btnMenu = e.target.closest(".btn-menu");
  if (btnMenu) {
    const menu = btnMenu.nextElementSibling;
    menu.classList.toggle("oculto");
    return;
  }

  const opcion = e.target.closest(".menu-opciones li");
  if (opcion) {
    const accion = opcion.dataset.accion;
    const id = parseInt(opcion.parentElement.dataset.id);
    const index = habitos.findIndex(h => h.id === id);
    if (index === -1) return;

    if (accion === "editar") abrirModal(habitos[index]);
    if (accion === "eliminar" && confirm("¿Eliminar este hábito?")) {
      habitos.splice(index, 1);
      await guardarHabitos();
    }

    renderHabitos();
    return;
  }

  const completar = e.target.closest("button[data-accion='completar']");
  if (completar) {
    const id = parseInt(completar.dataset.id);
    const index = habitos.findIndex(h => h.id === id);
    if (index !== -1) {
      habitos[index].completado = !habitos[index].completado;
      await guardarHabitos();
      renderHabitos();
    }
  }
});

document.addEventListener("click", (e) => {
  document.querySelectorAll(".menu-opciones").forEach(menu => {
    if (!menu.contains(e.target) && !menu.previousElementSibling.contains(e.target)) {
      menu.classList.add("oculto");
    }
  });
});

function abrirModal(habito = null) {
  modal.classList.add("activo");
  if (habito) {
    document.getElementById("modal-titulo").textContent = "Editar Hábito";
    inputNombre.value = habito.nombre;
    inputId.value = habito.id;
  } else {
    document.getElementById("modal-titulo").textContent = "Nuevo Hábito";
    form.reset();
    inputId.value = "";
  }
}

function cerrarModal() {
  modal.classList.remove("activo");
  form.reset();
  inputId.value = "";
}

form.addEventListener("submit", async e => {
  e.preventDefault();
  const nombre = inputNombre.value.trim();
  const id = inputId.value;
  if (!nombre || !uid) return;

  if (id) {
    const index = habitos.findIndex(h => h.id === parseInt(id));
    if (index !== -1) habitos[index].nombre = nombre;
  } else {
    habitos.push({ id: Date.now(), nombre, completado: false });
  }

  await guardarHabitos();
  cerrarModal();
  renderHabitos();
});

btnCancelar.addEventListener("click", cerrarModal);
btnNuevo.addEventListener("click", () => abrirModal());

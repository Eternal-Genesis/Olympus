import {
  auth,
  db,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc
} from "./firebase.js";

const hoy = new Date().toISOString().split("T")[0];
const diaSemana = new Date().getDay();
const habitosHoyKey = (uid) => `habitos-hoy-${uid}`;
const habitosBaseKey = (uid) => `habitos-base-${uid}`;
const historialKey = (uid) => `historial-${uid}`;
const sincronizadoKey = (uid) => `ultima-sincronizacion-${uid}`;

let uid = null;
let habitos = [];

const contenedorHabitos = document.querySelector(".habitos-hoy");
const modal = document.getElementById("modal-habito");
const form = document.getElementById("form-habito");
const inputNombre = document.getElementById("habito-nombre");
const inputHora = document.getElementById("habito-hora");
const inputId = document.getElementById("habito-id");
const btnCancelar = document.getElementById("btn-cancelar");
const btnNuevo = document.getElementById("btn-crear-habito");

onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  uid = user.uid;

  // Obtener hábitos base y filtrar solo los del día actual
  const base = JSON.parse(localStorage.getItem(habitosBaseKey(uid))) || [];
  habitos = base
    .filter(h => h.dias?.includes(diaSemana))
    .map(h => ({ ...h, completado: false }));

  localStorage.setItem(habitosHoyKey(uid), JSON.stringify(habitos));

  renderHabitos();
  document.querySelector(".seccion-hoy")?.classList.remove("oculto");

  const ultimaSync = localStorage.getItem(sincronizadoKey(uid));
  if (ultimaSync !== hoy) {
    await setDoc(doc(db, "usuarios", uid, "historialHabitos", hoy), { items: habitos });
    actualizarHistorialLocal();
    localStorage.setItem(sincronizadoKey(uid), hoy);
  }

  // Cambiar título dinámico según el día
  const diasSemanaNombre = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  document.getElementById("titulo-dia").textContent = `Rutina - ${diasSemanaNombre[diaSemana]}`;

  document.getElementById("loading")?.classList.add("oculto");
});

function actualizarHistorialLocal() {
  let historial = JSON.parse(localStorage.getItem(historialKey(uid))) || {};
  historial[hoy] = habitos;
  const fechas = Object.keys(historial).sort().slice(-30);
  const limpio = {};
  fechas.forEach(f => limpio[f] = historial[f]);
  localStorage.setItem(historialKey(uid), JSON.stringify(limpio));
}

function renderHabitos() {
  contenedorHabitos.innerHTML = "";
  const diasTexto = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  // Ordenar por hora
  habitos.sort((a, b) => {
    const ha = a.hora || "00:00";
    const hb = b.hora || "00:00";
    return ha.localeCompare(hb);
  });

  habitos.forEach(h => {
    const dias = h.dias?.map(d => diasTexto[d]).join(" - ") || "";
    const hora = h.hora ? ` | ${h.hora}` : "";
    const div = document.createElement("div");
    div.className = "habito-item" + (h.completado ? " completado" : "");
    div.innerHTML = `
      <div>
        <strong>${h.nombre}</strong>
        <div class="dias-programados">${dias}${hora}</div>
      </div>
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

form.addEventListener("submit", async e => {
  e.preventDefault();
  const nombre = inputNombre.value.trim();
  const hora = inputHora.value;
  const id = inputId.value;
  const dias = Array.from(form.querySelectorAll("input[name='dias']:checked"))
    .map(input => parseInt(input.value));

  if (!nombre || !uid || dias.length === 0 || !hora) return;

  if (id) {
    const index = habitos.findIndex(h => h.id === parseInt(id));
    if (index !== -1) {
      habitos[index].nombre = nombre;
      habitos[index].dias = dias;
      habitos[index].hora = hora;
    }
  } else {
    const nuevo = { id: Date.now(), nombre, completado: false, dias, hora };
    habitos.push(nuevo);

    const base = JSON.parse(localStorage.getItem(habitosBaseKey(uid))) || [];
    base.push({ id: nuevo.id, nombre: nuevo.nombre, dias, hora });
    localStorage.setItem(habitosBaseKey(uid), JSON.stringify(base));
  }

  localStorage.setItem(habitosHoyKey(uid), JSON.stringify(habitos));
  cerrarModal();
  renderHabitos();
});

btnCancelar.addEventListener("click", cerrarModal);
btnNuevo.addEventListener("click", () => abrirModal());

function abrirModal(habito = null) {
  modal.classList.add("activo");
  if (habito) {
    document.getElementById("modal-titulo").textContent = "Editar Hábito";
    inputNombre.value = habito.nombre;
    inputHora.value = habito.hora || "";
    inputId.value = habito.id;
    const checks = form.querySelectorAll("input[name='dias']");
    checks.forEach(c => c.checked = habito.dias?.includes(parseInt(c.value)));
  } else {
    document.getElementById("modal-titulo").textContent = "Nuevo Hábito";
    form.reset();
    inputHora.value = "";
    inputId.value = "";
  }
}

function cerrarModal() {
  modal.classList.remove("activo");
  form.reset();
  inputHora.value = "";
  inputId.value = "";
}

contenedorHabitos.addEventListener("click", async e => {
  const btnMenu = e.target.closest(".btn-menu");
  if (btnMenu) {
    const menu = btnMenu.nextElementSibling;
    const abierto = !menu.classList.contains("oculto");

    // Cierra otros menús antes
    document.querySelectorAll(".menu-opciones").forEach(m => m.classList.add("oculto"));

    if (!abierto) {
      menu.classList.remove("oculto");

      // Cierre automático tras salir del menú
      let timeout;
      menu.addEventListener("mouseleave", () => {
        timeout = setTimeout(() => {
          menu.classList.add("oculto");
        }, 2000);
      });

      menu.addEventListener("mouseenter", () => {
        clearTimeout(timeout);
      });
    }

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
    }

    localStorage.setItem(habitosHoyKey(uid), JSON.stringify(habitos));
    renderHabitos();
    return;
  }

  const completar = e.target.closest("button[data-accion='completar']");
  if (completar) {
    const id = parseInt(completar.dataset.id);
    const index = habitos.findIndex(h => h.id === id);
    if (index !== -1) {
      habitos[index].completado = !habitos[index].completado;
      localStorage.setItem(habitosHoyKey(uid), JSON.stringify(habitos));
      renderHabitos();
    }
  }
});

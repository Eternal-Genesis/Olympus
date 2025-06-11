// avance.js con historial visual de los últimos 4 días y 6 días de ejemplo

import { auth, db, onAuthStateChanged, doc, getDoc, setDoc } from "./firebase.js";

document.addEventListener("DOMContentLoaded", () => {
  let habitos = [];
  let uid = null;
  const hoy = new Date().toISOString().split("T")[0];

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
    await insertarHabitosEjemplo(uid); // Solo para demo visual
    await cargarHabitos(uid);
    renderHabitos();
    await cargarHistorial(uid);
  });

  async function cargarHabitos(uid) {
    const ref = doc(db, "usuarios", uid, "historialHabitos", hoy);
    const snap = await getDoc(ref);
    habitos = snap.exists() ? snap.data().items : [];
  }

  async function guardarHabitos() {
    if (!uid) return;
    const ref = doc(db, "usuarios", uid, "historialHabitos", hoy);
    await setDoc(ref, { items: habitos }, { merge: true });
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
    contenedorHistorial.innerHTML = "";

    for (let i = 1; i <= dias; i++) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - i);
      const diaStr = fecha.toISOString().split("T")[0];

      const ref = doc(db, "usuarios", uid, "historialHabitos", diaStr);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        const fechaTexto = obtenerDiaSemana(fecha) + " " + fecha.getDate().toString().padStart(2, '0') + " " + obtenerMes(fecha);

        const card = document.createElement("div");
        card.className = "habito-dia";
        card.innerHTML = `<h4>${fechaTexto}</h4>`;

        data.items.forEach(h => {
          const div = document.createElement("div");
          div.className = `habito ${h.completado ? '' : 'incompleto'}`;
          div.innerHTML = `<span class="estado">${h.completado ? '✓' : '✗'}</span>${h.nombre}`;
          card.appendChild(div);
        });

        contenedorHistorial.appendChild(card);
      }
    }
  }

  function obtenerDiaSemana(fecha) {
    return ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][fecha.getDay()];
  }

  function obtenerMes(fecha) {
    return ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"][fecha.getMonth()];
  }

  async function insertarHabitosEjemplo(uid) {
    const ejemplos = [
      { nombre: "Leer 10 páginas", completado: true },
      { nombre: "Beber agua", completado: false },
      { nombre: "Ejercicio", completado: true },
      { nombre: "Meditar", completado: false },
      { nombre: "Escribir diario", completado: true }
    ];

    for (let i = 1; i <= 6; i++) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - i);
      const fechaStr = fecha.toISOString().split("T")[0];

      const ref = doc(db, "usuarios", uid, "historialHabitos", fechaStr);
      const items = ejemplos.map((e, index) => ({
        id: i * 100 + index,
        nombre: e.nombre,
        completado: Math.random() > 0.5
      }));

      await setDoc(ref, { items }, { merge: true });
      console.log("Ejemplo insertado para:", fechaStr);
    }
  }

  document.addEventListener("click", (e) => {
    document.querySelectorAll(".menu-opciones").forEach(menu => {
      if (!menu.contains(e.target) && !menu.previousElementSibling.contains(e.target)) {
        menu.classList.add("oculto");
      }
    });
  });

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

      if (accion === "editar") {
        abrirModal(habitos[index]);
      } else if (accion === "eliminar") {
        if (confirm("¿Eliminar este hábito?")) {
          habitos.splice(index, 1);
          await guardarHabitos();
        }
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
      const nuevo = { id: Date.now(), nombre, completado: false };
      habitos.push(nuevo);
    }

    await guardarHabitos();
    cerrarModal();
    renderHabitos();
  });

  btnCancelar.addEventListener("click", cerrarModal);
  btnNuevo.addEventListener("click", () => abrirModal());
});

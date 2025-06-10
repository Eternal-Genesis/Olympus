document.addEventListener("DOMContentLoaded", () => {
  // Lista de hábitos (puede reemplazarse por localStorage o backend)
  let habitos = [
    { id: 1, nombre: "Meditar 10 min", completado: false },
    { id: 2, nombre: "Leer 5 páginas", completado: false },
    { id: 3, nombre: "Beber 2L de agua", completado: true },
  ];

  // Elementos del DOM
  const contenedorHabitos = document.querySelector(".habitos-hoy");
  const modal = document.getElementById("modal-habito");
  const form = document.getElementById("form-habito");
  const inputNombre = document.getElementById("habito-nombre");
  const inputId = document.getElementById("habito-id");
  const btnCancelar = document.getElementById("btn-cancelar");
  const btnNuevo = document.getElementById("btn-crear-habito");

  // Renderiza todos los hábitos
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

// Acciones del botón ⋯ y opciones del menú
contenedorHabitos.addEventListener("click", e => {
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
      }
    }

    renderHabitos();
    return;
  }
});

    // Acción: completar hábito
  const completar = e.target.closest("button[data-accion='completar']");
  if (completar) {
    const id = parseInt(completar.dataset.id);
    const index = habitos.findIndex(h => h.id === id);
    if (index !== -1) {
      habitos[index].completado = !habitos[index].completado;
      renderHabitos();
    }
  }

    // Acción: completar hábito
  const completar = e.target.closest("button[data-accion='completar']");
  if (completar) {
    const id = parseInt(completar.dataset.id);
    const index = habitos.findIndex(h => h.id === id);
    if (index !== -1) {
      habitos[index].completado = !habitos[index].completado;
      renderHabitos();
    }
  }

  // Muestra el modal para crear o editar
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

  // Cierra y limpia el modal
  function cerrarModal() {
    modal.classList.remove("activo");
    form.reset();
    inputId.value = "";
  }

  // Guardar hábito desde el formulario
  form.addEventListener("submit", e => {
    e.preventDefault();
    const nombre = inputNombre.value.trim();
    const id = inputId.value;

    if (!nombre) return;

    if (id) {
      const index = habitos.findIndex(h => h.id === parseInt(id));
      if (index !== -1) habitos[index].nombre = nombre;
    } else {
      const nuevo = { id: Date.now(), nombre, completado: false };
      habitos.push(nuevo);
    }

    cerrarModal();
    renderHabitos();
  });

  // Botón de cancelar en modal
  btnCancelar.addEventListener("click", cerrarModal);

  // Botón de nuevo hábito
  btnNuevo.addEventListener("click", () => abrirModal());

  // Inicializa la vista
  renderHabitos();
});

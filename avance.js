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
        <div>
          <button data-accion="completar" data-id="${h.id}">${h.completado ? "✓" : "Marcar"}</button>
          <button data-accion="editar" data-id="${h.id}">✏️</button>
          <button data-accion="eliminar" data-id="${h.id}">🗑️</button>
        </div>
      `;
      contenedorHabitos.appendChild(div);
    });
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

  // Delegación de eventos de acciones
  contenedorHabitos.addEventListener("click", e => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const accion = btn.dataset.accion;
    const id = parseInt(btn.dataset.id);
    const index = habitos.findIndex(h => h.id === id);
    if (index === -1) return;

    if (accion === "completar") {
      habitos[index].completado = !habitos[index].completado;
    } else if (accion === "editar") {
      abrirModal(habitos[index]);
    } else if (accion === "eliminar") {
      if (confirm("¿Eliminar este hábito?")) habitos.splice(index, 1);
    }

    renderHabitos();
  });

  // Inicializa la vista
  renderHabitos();
});

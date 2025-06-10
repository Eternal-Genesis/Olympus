document.addEventListener("DOMContentLoaded", () => {
  const habitosKey = 'habitosUsuario';
  const hoy = new Date().getDay();

  const cargarHabitos = () => JSON.parse(localStorage.getItem(habitosKey)) || [];
  const guardarHabitos = (habitos) => localStorage.setItem(habitosKey, JSON.stringify(habitos));

  const renderizarHabitosHoy = () => {
    const container = document.querySelector(".habitos-hoy");
    container.innerHTML = "";
    const habitos = cargarHabitos().filter(h => h.dias.includes(hoy));

    habitos.forEach(h => {
      const div = document.createElement("div");
      div.className = "habito-item" + (h.completadoHoy ? " completado" : "");
      div.innerHTML = `
        <span>${h.nombre}</span>
        <div>
          <button data-id="${h.id}" class="btn-completar">${h.completadoHoy ? "✓" : "Marcar"}</button>
          <button data-id="${h.id}" class="btn-eliminar">🗑️</button>
        </div>
      `;
      container.appendChild(div);

      div.querySelector(".btn-completar").onclick = () => {
        const todos = cargarHabitos();
        const target = todos.find(t => t.id === h.id);
        if (target) target.completadoHoy = true;
        guardarHabitos(todos);
        renderizarHabitosHoy();
      };

      div.querySelector(".btn-eliminar").onclick = () => {
        const actualizados = cargarHabitos().filter(t => t.id !== h.id);
        guardarHabitos(actualizados);
        renderizarHabitosHoy();
      };
    });
  };

  const modal = document.getElementById("modal-crear-habito");
  const btnAbrir = document.querySelector(".btn-crear-habito");
  const btnCerrar = document.getElementById("btn-cerrar-modal");

  btnAbrir.onclick = () => modal.style.display = "flex";
  btnCerrar.onclick = () => modal.style.display = "none";

  document.getElementById("form-crear-habito").addEventListener("submit", (e) => {
    e.preventDefault();
    const nombre = document.getElementById("input-nombre-habito").value.trim();
    const dias = [...document.querySelectorAll(".dias-checkboxes input:checked")].map(c => parseInt(c.value));
    if (!nombre || dias.length === 0) return alert("Completa el nombre y al menos un día");

    const nuevo = {
      id: crypto.randomUUID(),
      nombre,
      dias,
      completadoHoy: false
    };
    const todos = cargarHabitos();
    todos.push(nuevo);
    guardarHabitos(todos);
    modal.style.display = "none";
    e.target.reset();
    renderizarHabitosHoy();
  });

  renderizarHabitosHoy();
});

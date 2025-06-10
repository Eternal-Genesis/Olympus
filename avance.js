// avance.js
document.addEventListener("DOMContentLoaded", () => {
  const habitosKey = 'habitosUsuario';

  // Obtener día actual (0 = domingo, 6 = sábado)
  const hoy = new Date().getDay();

  // Cargar hábitos desde localStorage
  const cargarHabitos = () => {
    const data = localStorage.getItem(habitosKey);
    return data ? JSON.parse(data) : [];
  };

  const guardarHabitos = (habitos) => {
    localStorage.setItem(habitosKey, JSON.stringify(habitos));
  };

  const renderizarHabitosHoy = () => {
    const habitosContainer = document.querySelector(".habitos-hoy");
    habitosContainer.innerHTML = "";
    const habitos = cargarHabitos();

    const habitosDeHoy = habitos.filter(h => h.dias.includes(hoy));
    habitosDeHoy.forEach(h => {
      const div = document.createElement("div");
      div.className = "habito-item" + (h.completadoHoy ? " completado" : "");
      div.innerHTML = `
        <span>${h.nombre}</span>
        <div>
          <button data-id="${h.id}" class="btn-completar">${h.completadoHoy ? "✓" : "Marcar"}</button>
          <button data-id="${h.id}" class="btn-editar">✏️</button>
          <button data-id="${h.id}" class="btn-eliminar">🗑️</button>
        </div>
      `;
      habitosContainer.appendChild(div);
    });
  };

  renderizarHabitosHoy();
});

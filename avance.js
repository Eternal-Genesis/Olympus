document.addEventListener("DOMContentLoaded", () => {
  const habitosHoy = [
    { id: 1, nombre: "Meditar 10 min", completado: false },
    { id: 2, nombre: "Leer 5 páginas", completado: false },
    { id: 3, nombre: "Beber 2L de agua", completado: true },
  ];

  const objetivos = [
    {
      id: 1,
      titulo: "Salud Mental",
      descripcion: "Mejorar la calma y enfoque",
      habitos: ["Meditar 10 min", "Escribir diario"]
    },
    {
      id: 2,
      titulo: "Hábitos de Lectura",
      descripcion: "Leer a diario contenido valioso",
      habitos: ["Leer 5 páginas"]
    }
  ];

  const habitosContainer = document.querySelector(".habitos-hoy");
  const objetivosContainer = document.querySelector(".lista-objetivos");

  // Mostrar hábitos del día
  habitosHoy.forEach(h => {
    const div = document.createElement("div");
    div.className = "habito-item" + (h.completado ? " completado" : "");
    div.innerHTML = `
      <span>${h.nombre}</span>
      <button data-id="${h.id}">${h.completado ? "✓" : "Marcar"}</button>
    `;
    habitosContainer.appendChild(div);

    // Evento de marcar completado
    div.querySelector("button").addEventListener("click", () => {
      div.classList.toggle("completado");
      div.querySelector("button").textContent = "✓";
    });
  });

  // Mostrar objetivos
  objetivos.forEach(o => {
    const div = document.createElement("div");
    div.className = "objetivo-card";
    div.innerHTML = `
      <h3>${o.titulo}</h3>
      <p>${o.descripcion}</p>
      <ul>
        ${o.habitos.map(h => `<li>${h}</li>`).join("")}
      </ul>
    `;
    objetivosContainer.appendChild(div);
  });
});

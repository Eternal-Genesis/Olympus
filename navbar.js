// Espera a que cargue el DOM antes de insertar el navbar
document.addEventListener("DOMContentLoaded", () => {
  fetch("navbar.html")
    .then(response => {
      if (!response.ok) {
        throw new Error("No se pudo cargar navbar.html");
      }
      return response.text();
    })
    .then(data => {
      const navbarContainer = document.getElementById("navbar");
      if (navbarContainer) {
        navbarContainer.innerHTML = data;

        // === Animación del rayo eléctrico al hacer clic en OLYMPUS ===
        const logo = document.querySelector(".logo");
        const rayo = document.getElementById("rayo-electrico");

        if (logo && rayo) {
          logo.addEventListener("click", () => {
            rayo.classList.remove("rayo-animado"); // Reinicia animación
            void rayo.offsetWidth; // Fuerza reflow
            rayo.classList.add("rayo-animado");
          });
        }
      } else {
        console.warn("Elemento con id='navbar' no encontrado.");
      }
    })
    .catch(error => {
      console.error("Error cargando navbar:", error);
    });
});

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
      if (!navbarContainer) {
        console.warn("Elemento con id='navbar' no encontrado.");
        return;
      }

      // Inserta el navbar
      navbarContainer.innerHTML = data;

      // Crear y agregar el div del rayo al body
      const rayo = document.createElement("div");
      rayo.id = "rayo-electrico";
      document.body.appendChild(rayo);

      // Detectar el logo (OLYMPUS)
      const logo = document.querySelector(".logo");
      if (!logo) return;

      // Aplicar tema guardado
      const temaGuardado = localStorage.getItem("tema");
      if (temaGuardado === "claro") {
        document.body.classList.add("light-mode");
      }

      // Al hacer clic en OLYMPUS
      logo.addEventListener("click", () => {
        // Cambiar tema y guardar
        const esClaro = document.body.classList.toggle("light-mode");
        localStorage.setItem("tema", esClaro ? "claro" : "oscuro");

        // Activar animación del rayo
        rayo.classList.remove("rayo-animado");
        void rayo.offsetWidth; // Fuerza reflow
        rayo.classList.add("rayo-animado");
      });
    })
    .catch(error => {
      console.error("Error cargando navbar:", error);
    });
});

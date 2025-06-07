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

      // Crear y agregar el flash al body
      const flash = document.createElement("div");
      flash.id = "flash";
      document.body.appendChild(flash);

      // Detectar el logo (OLYMPUS)
      const logo = document.querySelector(".logo");
      if (!logo) return;

      // Aplicar tema guardado si lo hay
      const temaGuardado = localStorage.getItem("tema");
      if (temaGuardado === "claro") {
        document.body.classList.add("light-mode");
      }

      // Al hacer clic en OLYMPUS
      logo.addEventListener("click", () => {
        // Cambiar tema y guardar
        const esClaro = document.body.classList.toggle("light-mode");
        localStorage.setItem("tema", esClaro ? "claro" : "oscuro");

        // DESCARGA ELÉCTRICA VISUAL
        // Vibración
        document.body.classList.add("shake");
        setTimeout(() => {
          document.body.classList.remove("shake");
        }, 500);

        // Flash blanco
        flash.classList.remove("flash-activo");
        void flash.offsetWidth; // Fuerza reflow
        flash.classList.add("flash-activo");
      });
    })
    .catch(error => {
      console.error("Error cargando navbar:", error);
    });
});

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

      // Insertar el navbar
      navbarContainer.innerHTML = data;

      // Aplicar tema guardado si existe
      const temaGuardado = localStorage.getItem("tema");
      if (temaGuardado === "claro") {
        document.body.classList.add("light-mode");
      }

      // Redirigir a index al hacer clic en OLYMPUS
      const logo = document.querySelector(".logo");
      if (logo) {
        logo.addEventListener("click", () => {
          window.location.href = "index.html";
        });
      }
    })
    .catch(error => {
      console.error("Error cargando navbar:", error);
    });
});

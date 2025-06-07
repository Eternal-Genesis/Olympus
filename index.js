// Restaurar tema guardado por el usuario
const temaGuardado = localStorage.getItem("tema");
if (temaGuardado === "claro") {
  document.body.classList.add("light-mode");
}

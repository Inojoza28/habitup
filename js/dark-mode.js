const themeToggleBtn = document.getElementById("themeToggleBtn");
const themeToggleIcon = document.getElementById("themeToggleIcon");

// Carregar tema salvo no localStorage
document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme") || "dark-mode";
  document.body.className = savedTheme;
  updateThemeIcon(savedTheme);
});

// Alternar tema ao clicar no botão
themeToggleBtn.addEventListener("click", () => {
  const currentTheme = document.body.classList.contains("dark-mode")
    ? "dark-mode"
    : "light-mode";

  const newTheme = currentTheme === "dark-mode" ? "light-mode" : "dark-mode";

  document.body.className = newTheme;
  localStorage.setItem("theme", newTheme);

  updateThemeIcon(newTheme);
});

// Atualizar o ícone com base no tema
function updateThemeIcon(theme) {
  if (theme === "dark-mode") {
    themeToggleIcon.classList.remove("fa-sun");
    themeToggleIcon.classList.add("fa-moon");
  } else {
    themeToggleIcon.classList.remove("fa-moon");
    themeToggleIcon.classList.add("fa-sun");
  }
}

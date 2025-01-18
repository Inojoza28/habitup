// Seleciona o botão e a seção de referência
const scrollTopBtn = document.getElementById('scrollTopBtn');
const rewardsSection = document.querySelector('.reset');

// Evento de scroll para mostrar/ocultar o botão
window.addEventListener('scroll', () => {
  const sectionTop = rewardsSection.getBoundingClientRect().top; // Posição relativa da seção à viewport

  // Verifica se a seção chegou à parte visível da tela
  if (sectionTop <= 0) {
    scrollTopBtn.classList.add('show');
    scrollTopBtn.classList.remove('hide');
  } else {
    scrollTopBtn.classList.add('hide');
    scrollTopBtn.classList.remove('show');
  }
});

// Rola suavemente até o topo quando o botão é clicado
scrollTopBtn.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});
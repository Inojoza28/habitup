/******************************************************
 *  RASTREADOR DE HÁBITOS GAMIFICADO - HabitUp
 *  
 *  (Com streak, bestStreak, barra de progresso, 
 *   reset diário, campo de nome do usuário, drag-and-drop 
 *   e agora com "placeholder" para melhor feedback visual)
 ******************************************************/

// Botão Criar Hábito (modal antigo)
const addHabitBtn = document.getElementById('addHabitBtn');
const habitModal = document.getElementById('habitModal');
const modalTitle = document.getElementById('modalTitle');
const habitNameInput = document.getElementById('habitName');
const habitIconInput = document.getElementById('habitIcon');
const habitGoalInput = document.getElementById('habitGoal');
const saveHabitBtn = document.getElementById('saveHabitBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');

// Overlay único
const overlay = document.getElementById('overlay');
const habitsList = document.getElementById('habitsList');

// Modal de Boas-Vindas
const startNowBtn = document.getElementById('startNowBtn');
const welcomeModal = document.getElementById('welcomeModal');
const confirmWelcomeBtn = document.getElementById('confirmWelcomeBtn');
const userNameField = document.getElementById('userNameField');

// Exibição do nome do usuário
const userNameDisplay = document.getElementById('userNameDisplay');

// XP / Level
const levelValue = document.getElementById('levelValue');
const currentXpEl = document.getElementById('currentXp');
const xpToNextLevelEl = document.getElementById('xpToNextLevel');
const xpProgressEl = document.getElementById('xpProgress');
const mascotImg = document.getElementById('mascotImg');

/**
 * Estrutura de dados:
 * habits = [
 *   { 
 *     id, 
 *     name, 
 *     icon, 
 *     goal, 
 *     progress, 
 *     streak, 
 *     bestStreak, 
 *     lastCheckDate 
 *   },
 * ]
 */
let habits = [];
let currentXp = 0;
let xpToNextLevel = 50;
let level = 1;
let editingHabitId = null;
let userName = ''; // armazena o nome do usuário

// Placeholder para ocupar espaço ao arrastar
let placeholderEl = null;

/** ====== INICIALIZAÇÃO ====== */
document.addEventListener('DOMContentLoaded', () => {
  loadData();           
  resetDailyProgressIfNeeded();
  renderHabits();
  updateXpUI();
  checkUserName();      
});

/** ====== EVENTOS ====== */
// Modal de hábitos
addHabitBtn.addEventListener('click', () => openHabitModal(false));
saveHabitBtn.addEventListener('click', saveHabit);
cancelModalBtn.addEventListener('click', closeHabitModal);

// Overlay fecha modais se estiverem abertos
overlay.addEventListener('click', () => {
  if (!habitModal.classList.contains('hidden')) {
    closeHabitModal();
  }
  if (!welcomeModal.classList.contains('hidden')) {
    closeWelcomeModal();
  }
});

// Botão "Começar Agora" abre modal de boas-vindas
startNowBtn.addEventListener('click', () => {
  welcomeModal.classList.remove('hidden');
  overlay.classList.remove('hidden');
});

// Confirmar nome no modal de boas-vindas
confirmWelcomeBtn.addEventListener('click', confirmUserName);

/** ====== MODAL DE HÁBITO ====== */
function openHabitModal(isEdit, habitData = null) {
  habitModal.classList.remove('hidden');
  overlay.classList.remove('hidden');

  if (isEdit && habitData) {
    modalTitle.innerText = 'Editar Hábito';
    habitNameInput.value = habitData.name;
    habitIconInput.value = habitData.icon;
    habitGoalInput.value = habitData.goal;
    editingHabitId = habitData.id;
  } else {
    modalTitle.innerText = 'Novo Hábito';
    habitNameInput.value = '';
    habitIconInput.value = '';
    habitGoalInput.value = '';
    editingHabitId = null;
  }
}

function closeHabitModal() {
  habitModal.classList.add('hidden');
  overlay.classList.add('hidden');
}

/** ====== MODAL DE BOAS-VINDAS ====== */
function closeWelcomeModal() {
  welcomeModal.classList.add('hidden');
  overlay.classList.add('hidden');
}

function confirmUserName() {
  const nameValue = userNameField.value.trim();
  if (!nameValue) {
    alert('Por favor, digite seu nome.');
    return;
  }

  userName = nameValue;
  localStorage.setItem('habitUpUserName', userName);

  // Exibe no progress-section
  userNameDisplay.innerText = 'Olá, ' + userName + '!';
  userNameDisplay.classList.remove('hidden');

  // Fecha o modal
  closeWelcomeModal();
}

/** Verifica se já existe userName no localStorage e exibe */
function checkUserName() {
  const storedName = localStorage.getItem('habitUpUserName');
  if (storedName) {
    userName = storedName;
    userNameDisplay.innerText = 'Olá, ' + userName + '!';
    userNameDisplay.classList.remove('hidden');
  }
}

/** ====== SALVAR HÁBITO ====== */
function saveHabit() {
  const name = habitNameInput.value.trim();
  const icon = habitIconInput.value.trim() || '📌';
  const goal = parseInt(habitGoalInput.value.trim()) || 1;

  if (!name) {
    alert('Por favor, digite o nome do hábito.');
    return;
  }

  if (editingHabitId) {
    // Editando
    const idx = habits.findIndex(h => h.id == editingHabitId);
    habits[idx].name = name;
    habits[idx].icon = icon;
    habits[idx].goal = goal;
  } else {
    // Criando
    const newHabit = {
      id: Date.now(),
      name,
      icon,
      goal,
      progress: 0,
      streak: 0,
      bestStreak: 0,
      lastCheckDate: ''
    };
    habits.push(newHabit);
  }

  saveData();
  renderHabits();
  closeHabitModal();
}

/** ====== RENDERIZAR HÁBITOS ====== */
function renderHabits() {
  habitsList.innerHTML = '';

  habits.forEach(habit => {
    const li = document.createElement('li');
    li.className = 'habit-item';

    // Para arrastar e soltar
    li.setAttribute('draggable', 'true');
    li.dataset.habitId = habit.id;

    li.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', habit.id); 
      li.classList.add('dragging');

      // Criamos um placeholder no momento do dragstart
      placeholderEl = document.createElement('li');
      placeholderEl.className = 'habit-item placeholder';
      placeholderEl.style.height = li.offsetHeight + 'px'; 
      // altura igual ao item para ocupar o espaço na lista
    });

    li.addEventListener('dragend', () => {
      li.classList.remove('dragging');

      // remove qualquer placeholder existente
      if (placeholderEl && placeholderEl.parentNode) {
        placeholderEl.parentNode.removeChild(placeholderEl);
      }
      placeholderEl = null;
    });

    // Verifica se o hábito está completo
    if (habit.progress >= habit.goal) {
      li.classList.add('completed-today');
    } else {
      li.classList.remove('completed-today');
    }

    // Linha de topo
    const topDiv = document.createElement('div');
    topDiv.className = 'habit-top';

    // Info
    const infoDiv = document.createElement('div');
    infoDiv.className = 'habit-info';

    const iconSpan = document.createElement('span');
    iconSpan.className = 'emoji';
    iconSpan.innerText = habit.icon;

    const nameSpan = document.createElement('span');
    nameSpan.className = 'habit-name';
    nameSpan.innerText = habit.name;

    infoDiv.appendChild(iconSpan);
    infoDiv.appendChild(nameSpan);

    // Ações
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'habit-actions';

    // Botão Feito
    const doneBtn = document.createElement('button');
    doneBtn.className = 'action-btn';
    doneBtn.innerText = '✔️'; 
    doneBtn.title = 'Marcar Feito';
    doneBtn.addEventListener('click', e => {
      e.stopPropagation();
      incrementProgress(habit.id);
    });

    // Botão Editar
    const editBtn = document.createElement('button');
    editBtn.className = 'action-btn';
    editBtn.innerText = '✏️'; 
    editBtn.title = 'Editar Hábito';
    editBtn.addEventListener('click', e => {
      e.stopPropagation();
      openHabitModal(true, habit);
    });

    // Botão Deletar
    const delBtn = document.createElement('button');
    delBtn.className = 'action-btn';
    delBtn.innerText = '🗑️'; 
    delBtn.title = 'Excluir Hábito';
    delBtn.addEventListener('click', e => {
      e.stopPropagation();
      deleteHabit(habit.id);
    });

    actionsDiv.appendChild(doneBtn);
    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(delBtn);

    topDiv.appendChild(infoDiv);
    topDiv.appendChild(actionsDiv);

    // Detalhes (barra de progresso, streak)
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'habit-details';

    // Barra de Progresso
    const progressBar = document.createElement('div');
    progressBar.className = 'habit-progress-bar';
    const progressFill = document.createElement('div');
    progressFill.className = 'habit-progress-fill';
    const pct = ((habit.progress / habit.goal) * 100).toFixed(0);
    progressFill.style.width = (pct > 100 ? 100 : pct) + '%';
    progressBar.appendChild(progressFill);

    // Streak
    const pStreak = document.createElement('p');
    pStreak.innerText = `Streak: ${habit.streak} dia(s)`;

    // Best Streak
    const pBestStreak = document.createElement('p');
    pBestStreak.innerText = `Melhor sequencia: ${habit.bestStreak} dia(s)`;

    // Progresso diario
    const pProgress = document.createElement('p');
    pProgress.innerText = `Hoje: ${habit.progress}/${habit.goal}`;

    detailsDiv.appendChild(pProgress);
    detailsDiv.appendChild(progressBar);
    detailsDiv.appendChild(pStreak);
    detailsDiv.appendChild(pBestStreak);

    // Mostrar/Ocultar detalhes ao clicar na linha de topo
    topDiv.addEventListener('click', () => {
      detailsDiv.style.display = 
        (detailsDiv.style.display === 'flex') ? 'none' : 'flex';
    });

    li.appendChild(topDiv);
    li.appendChild(detailsDiv);
    habitsList.appendChild(li);
  });
}

// Eventos para drag-and-drop no UL (habitsList)
habitsList.addEventListener('dragover', (e) => {
  e.preventDefault(); 

  // Pegamos o item "dragging" e o "placeholder"
  const draggedItem = document.querySelector('.habit-item.dragging');
  if (!draggedItem || !placeholderEl) return;

  // Encontramos o elemento depois do qual vamos inserir o placeholder
  const afterElement = getDragAfterElement(habitsList, e.clientY);
  if (!afterElement) {
    // se não existe afterElement, solta no final
    habitsList.appendChild(placeholderEl);
  } else {
    habitsList.insertBefore(placeholderEl, afterElement);
  }
});

habitsList.addEventListener('drop', (e) => {
  e.preventDefault();
  const draggedHabitId = e.dataTransfer.getData('text/plain');

  // Deixamos a placeholder no local certo
  const afterElement = placeholderEl && placeholderEl.nextElementSibling;
  // se a placeholder está no final, afterElement será null

  reorderHabits(draggedHabitId, afterElement);

  // Remove a placeholder
  if (placeholderEl && placeholderEl.parentNode) {
    placeholderEl.parentNode.removeChild(placeholderEl);
  }
  placeholderEl = null;
});

/**
 * Calcula qual item vem logo depois da posição do mouse (y).
 * Se não houver item, retorna null (ou seja, final da lista).
 */
function getDragAfterElement(container, y) {
  const habitItems = [...container.querySelectorAll('.habit-item:not(.dragging):not(.placeholder)')];
  let closest = null;
  let closestOffset = Number.NEGATIVE_INFINITY;

  habitItems.forEach(item => {
    const box = item.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;

    if (offset < 0 && offset > closestOffset) {
      closestOffset = offset;
      closest = item;
    }
  });

  return closest; 
}

/**
 * Reordena o array 'habits' baseado no ID arrastado 
 * e no elemento 'afterElement'
 */
function reorderHabits(draggedHabitId, afterElement) {
  const draggedIndex = habits.findIndex(h => h.id == draggedHabitId);
  if (draggedIndex === -1) return;

  const [draggedItem] = habits.splice(draggedIndex, 1);

  if (!afterElement) {
    // se não existe afterElement, insere no fim
    habits.push(draggedItem);
  } else {
    const afterHabitId = afterElement.dataset.habitId;
    const afterIndex = habits.findIndex(h => h.id == afterHabitId);
    habits.splice(afterIndex, 0, draggedItem);
  }

  saveData();
  renderHabits();
}

/** ====== FUNÇÃO PARA RESETAR O PROGRESSO SE O DIA MUDOU ====== */
function resetDailyProgressIfNeeded() {
  const todayStr = getTodayStr();
  let updated = false;

  habits.forEach(habit => {
    if (habit.lastCheckDate !== todayStr) {
      // Zera o progress, removendo a cor "verde"
      habit.progress = 0;
      updated = true;
    }
  });

  if (updated) {
    saveData();
    renderHabits();
  }
}

/** ====== INCREMENTAR PROGRESSO & STREAK ====== */
function incrementProgress(habitId) {
  const habit = habits.find(h => h.id == habitId);
  if (!habit) return;

  if (habit.progress >= habit.goal) {
    alert('Você já atingiu a meta deste hábito hoje!');
    return;
  }

  // A vibração curta
  vibrateShort();

  const todayStr = getTodayStr();
  if (habit.lastCheckDate !== todayStr) {
    if (isYesterday(habit.lastCheckDate, todayStr)) {
      habit.streak++;
    } else {
      habit.streak = 1;
    }
    habit.lastCheckDate = todayStr;
  }

  habit.progress++;
  // Atualiza bestStreak
  if (habit.streak > habit.bestStreak) {
    habit.bestStreak = habit.streak;
  }

  // XP normal
  addXp(10);
  // Bônus se completou a meta
  if (habit.progress === habit.goal) {
    addXp(10);
    runConfetti();
  }

  saveData();
  renderHabits();
}

/** Exemplo de função de vibração */
function vibrateShort() {
  if ('vibrate' in navigator) {
    navigator.vibrate(50); 
  }
}


/** Funções auxiliares de data/streak */
function getTodayStr() {
  const d = new Date();
  return d.toISOString().slice(0,10);
}
function isYesterday(lastDateStr, todayStr) {
  if (!lastDateStr) return false;
  const last = new Date(lastDateStr);
  const today = new Date(todayStr);
  const diff = today - last;
  return diff === 86400000; // 24h em ms
}

/** ====== EXCLUIR HÁBITO ====== */
function deleteHabit(habitId) {
  if (!confirm('Excluir este hábito?')) return;
  habits = habits.filter(h => h.id !== habitId);
  saveData();
  renderHabits();
}

/** ====== XP / Level / Mascote ====== */
function addXp(amount) {
  currentXp += amount;
  if (currentXp >= xpToNextLevel) {
    levelUp();
  }
  updateXpUI();
}

function levelUp() {
  currentXp = currentXp - xpToNextLevel;
  level++;
  xpToNextLevel = Math.floor(xpToNextLevel * 1.3);
  bounceMascot();
  runConfetti();
}

function updateXpUI() {
  levelValue.innerText = level;
  currentXpEl.innerText = currentXp;
  xpToNextLevelEl.innerText = xpToNextLevel;

  const percent = Math.min(100, (currentXp / xpToNextLevel) * 100);
  xpProgressEl.style.width = percent + '%';

  saveData();
}

function bounceMascot() {
  mascotImg.classList.remove('bounce');
  void mascotImg.offsetWidth; // Força reflow
  mascotImg.classList.add('bounce');
}

/** ====== CONFETTI ====== */
function runConfetti() {
  const confettiContainer = document.createElement('div');
  confettiContainer.style.position = 'fixed';
  confettiContainer.style.top = 0;
  confettiContainer.style.left = 0;
  confettiContainer.style.width = '100%';
  confettiContainer.style.height = '100%';
  confettiContainer.style.pointerEvents = 'none';
  confettiContainer.style.zIndex = 9999;
  document.body.appendChild(confettiContainer);

  const colors = ['#fbc531', '#4a6fa1', '#e84118', '#9c88ff'];

  for (let i = 0; i < 50; i++) {
    const confetto = document.createElement('div');
    confetto.style.position = 'absolute';
    confetto.style.width = '8px';
    confetto.style.height = '8px';
    confetto.style.backgroundColor = 
      colors[Math.floor(Math.random() * colors.length)];
    confetto.style.top = '0px';
    confetto.style.left = (Math.random() * 100) + '%';
    confetto.style.opacity = 0.8;
    confetto.style.transform = `rotate(${Math.random() * 360}deg)`;

    confettiContainer.appendChild(confetto);

    const fallDuration = 2000 + Math.random() * 2000;
    confetto.animate([
      { transform: `translateY(0) rotate(${Math.random()*360}deg)`, opacity: 1 },
      { transform: `translateY(${window.innerHeight+100}px) rotate(${Math.random()*360}deg)`, opacity: 0 }
    ], {
      duration: fallDuration,
      easing: 'ease-out'
    });
  }

  setTimeout(() => {
    document.body.removeChild(confettiContainer);
  }, 4000);
}

/** ====== SALVAR e CARREGAR do localStorage ====== */
function saveData() {
  const data = {
    habits,
    currentXp,
    xpToNextLevel,
    level,
    userName
  };
  localStorage.setItem('habitUpData', JSON.stringify(data));
}

function loadData() {
  const raw = localStorage.getItem('habitUpData');
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    habits = data.habits || [];
    currentXp = data.currentXp || 0;
    xpToNextLevel = data.xpToNextLevel || 50;
    level = data.level || 1;
    userName = data.userName || '';
  } catch (e) {
    console.warn('Erro ao carregar localStorage:', e);
  }
}

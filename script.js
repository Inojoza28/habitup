/******************************************************
 *  RASTREADOR DE HÁBITOS GAMIFICADO - HabitUp
 *  
 *  (Streak/bestStreak só contando se completo no dia,
 *   reset diário à meia-noite local,
 *   drag-and-drop com placeholder,
 *   vibração curta no "Feito",
 *   modal de boas-vindas,
 *   modal de parabéns a cada nível múltiplo de 5,
 *   E agora: apenas o modal de parabéns NÃO fecha ao clicar no overlay)
 ******************************************************/

// Seletores gerais
const addHabitBtn = document.getElementById('addHabitBtn');
const habitModal = document.getElementById('habitModal');
const modalTitle = document.getElementById('modalTitle');
const habitNameInput = document.getElementById('habitName');
const habitIconInput = document.getElementById('habitIcon');
const habitGoalInput = document.getElementById('habitGoal');
const saveHabitBtn = document.getElementById('saveHabitBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');

const overlay = document.getElementById('overlay');
const habitsList = document.getElementById('habitsList');

// Modal de Boas-Vindas
const startNowBtn = document.getElementById('startNowBtn');
const welcomeModal = document.getElementById('welcomeModal');
const confirmWelcomeBtn = document.getElementById('confirmWelcomeBtn');
const userNameField = document.getElementById('userNameField');
const closeWelcomeBtn = document.getElementById('closeWelcomeBtn'); // opcional se quiser um botão "Fechar"

// Modal de Parabéns (nível múltiplo de 5)
const congratsModal = document.getElementById('congratsModal');
const congratsMessage = document.getElementById('congratsMessage');
const closeCongratsBtn = document.getElementById('closeCongratsBtn');

// Exibição do nome do usuário
const userNameDisplay = document.getElementById('userNameDisplay');

// XP / Level
const levelValue = document.getElementById('levelValue');
const currentXpEl = document.getElementById('currentXp');
const xpToNextLevelEl = document.getElementById('xpToNextLevel');
const xpProgressEl = document.getElementById('xpProgress');
const mascotImg = document.getElementById('mascotImg');

/** 
 * Array de frases motivacionais para cada múltiplo de 5 níveis.
 * Se o usuário passar do 50, usamos a última (fallback).
 */
const motivationalMessages = [
  "Você está decolando! Mantenha seus hábitos e conquiste resultados incríveis.",
  "Fantástico! Sua dedicação está pagando cada vez mais.",
  "Uau! A cada meta cumprida, você fica mais próximo do seu objetivo.",
  "Você é imparável! Continue no ritmo e veja sua vida evoluir.",
  "Nível novo, força renovada. Você está no caminho certo!",
  "É isso aí! Persistência é a chave para grandes conquistas.",
  "Que progresso maravilhoso! Cada esforço vale muito a pena.",
  "Você brilha quando supera seus próprios limites. Siga firme!",
  "Incrível! Sua disciplina inspira quem está à sua volta.",
  "Brilhante! A cada vitória, você prova do que é capaz."
];

/**
 * Estrutura de dados (exemplo):
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
let userName = '';

let placeholderEl = null; // para drag-and-drop

/** ====== INICIALIZAÇÃO ====== */
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  resetDailyProgressIfNeeded();
  renderHabits();
  updateXpUI();
  checkUserName();

  // Se existir um botão "Fechar" no modal de boas-vindas
  if (closeWelcomeBtn) {
    closeWelcomeBtn.addEventListener('click', closeWelcomeModal);
  }

  // Fechar modal de Parabéns pelo botão (não pelo overlay)
  if (closeCongratsBtn) {
    closeCongratsBtn.addEventListener('click', () => {
      if (congratsModal) congratsModal.classList.add('hidden');
      overlay.classList.add('hidden');
    });
  }

  // Certifica que confirmWelcomeBtn chama confirmUserName()
  if (confirmWelcomeBtn) {
    confirmWelcomeBtn.addEventListener('click', confirmUserName);
  }

  // Overlay: fecha todos os modais, MENOS o modal de Parabéns
  overlay.addEventListener('click', () => {
    // Se o modal de parabéns estiver aberto, não faz nada
    if (congratsModal && !congratsModal.classList.contains('hidden')) {
      return; 
    }
    // Fecha habitModal ou welcomeModal se abertos
    if (!habitModal.classList.contains('hidden')) {
      closeHabitModal();
    }
    if (!welcomeModal.classList.contains('hidden')) {
      closeWelcomeModal();
    }
  });
});

/** ====== EVENTOS DO MODAL DE HÁBITO ====== */
addHabitBtn.addEventListener('click', () => openHabitModal(false));
saveHabitBtn.addEventListener('click', saveHabit);
cancelModalBtn.addEventListener('click', closeHabitModal);

// Botão "Começar Agora" abre modal de Boas-Vindas
startNowBtn.addEventListener('click', () => {
  welcomeModal.classList.remove('hidden');
  overlay.classList.remove('hidden');
});

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
  userNameDisplay.innerText = 'Olá, ' + userName + '!';
  userNameDisplay.classList.remove('hidden');

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
    const idx = habits.findIndex(h => h.id == editingHabitId);
    habits[idx].name = name;
    habits[idx].icon = icon;
    habits[idx].goal = goal;
  } else {
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

    // Arrastar e Soltar
    li.setAttribute('draggable', 'true');
    li.dataset.habitId = habit.id;

    li.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', habit.id); 
      li.classList.add('dragging');

      placeholderEl = document.createElement('li');
      placeholderEl.className = 'habit-item placeholder';
      placeholderEl.style.height = li.offsetHeight + 'px';
    });

    li.addEventListener('dragend', () => {
      li.classList.remove('dragging');
      if (placeholderEl && placeholderEl.parentNode) {
        placeholderEl.parentNode.removeChild(placeholderEl);
      }
      placeholderEl = null;
    });

    // Indica visualmente se está completo hoje
    if (habit.progress >= habit.goal) {
      li.classList.add('completed-today');
    } else {
      li.classList.remove('completed-today');
    }

    // Parte superior do item
    const topDiv = document.createElement('div');
    topDiv.className = 'habit-top';

    // Info do hábito (ícone + nome)
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

    // Ações (botões Feito/Editar/Excluir)
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'habit-actions';

    const doneBtn = document.createElement('button');
    doneBtn.className = 'action-btn';
    doneBtn.innerText = '✔️'; 
    doneBtn.title = 'Marcar Feito';
    doneBtn.addEventListener('click', e => {
      e.stopPropagation();
      incrementProgress(habit.id);
    });

    const editBtn = document.createElement('button');
    editBtn.className = 'action-btn';
    editBtn.innerText = '✏️'; 
    editBtn.title = 'Editar Hábito';
    editBtn.addEventListener('click', e => {
      e.stopPropagation();
      openHabitModal(true, habit);
    });

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

    // Detalhes (barra de progresso, streak, bestStreak)
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'habit-details';

    const progressBar = document.createElement('div');
    progressBar.className = 'habit-progress-bar';
    const progressFill = document.createElement('div');
    progressFill.className = 'habit-progress-fill';

    const pct = ((habit.progress / habit.goal) * 100).toFixed(0);
    progressFill.style.width = (pct > 100 ? 100 : pct) + '%';
    progressBar.appendChild(progressFill);

    const pStreak = document.createElement('p');
    pStreak.innerText = `Streak: ${habit.streak} dia(s)`;
    const pBestStreak = document.createElement('p');
    pBestStreak.innerText = `Melhor sequencia: ${habit.bestStreak} dia(s)`;
    const pProgress = document.createElement('p');
    pProgress.innerText = `Hoje: ${habit.progress}/${habit.goal}`;

    detailsDiv.appendChild(pProgress);
    detailsDiv.appendChild(progressBar);
    detailsDiv.appendChild(pStreak);
    detailsDiv.appendChild(pBestStreak);

    // Ao clicar na parte superior, expande/colapsa detalhes
    topDiv.addEventListener('click', () => {
      detailsDiv.style.display = 
        (detailsDiv.style.display === 'flex') ? 'none' : 'flex';
    });

    li.appendChild(topDiv);
    li.appendChild(detailsDiv);
    habitsList.appendChild(li);
  });
}

// DRAGOVER
habitsList.addEventListener('dragover', (e) => {
  e.preventDefault(); 
  const draggedItem = document.querySelector('.habit-item.dragging');
  if (!draggedItem || !placeholderEl) return;

  const afterElement = getDragAfterElement(habitsList, e.clientY);
  if (!afterElement) {
    habitsList.appendChild(placeholderEl);
  } else {
    habitsList.insertBefore(placeholderEl, afterElement);
  }
});

// DROP
habitsList.addEventListener('drop', (e) => {
  e.preventDefault();
  const draggedHabitId = e.dataTransfer.getData('text/plain');
  const afterElement = placeholderEl && placeholderEl.nextElementSibling;

  reorderHabits(draggedHabitId, afterElement);

  if (placeholderEl && placeholderEl.parentNode) {
    placeholderEl.parentNode.removeChild(placeholderEl);
  }
  placeholderEl = null;
});

/** Retorna o item após o qual o placeholder deve ser inserido, 
 *  com base na posição do mouse (e.clientY).
 */
function getDragAfterElement(container, y) {
  const items = [...container.querySelectorAll('.habit-item:not(.dragging):not(.placeholder)')];
  let closest = null;
  let closestOffset = Number.NEGATIVE_INFINITY;

  items.forEach(item => {
    const box = item.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closestOffset) {
      closestOffset = offset;
      closest = item;
    }
  });

  return closest;
}

/** Reordena array 'habits' */
function reorderHabits(draggedHabitId, afterElement) {
  const draggedIndex = habits.findIndex(h => h.id == draggedHabitId);
  if (draggedIndex === -1) return;

  const [draggedItem] = habits.splice(draggedIndex, 1);

  if (!afterElement) {
    habits.push(draggedItem);
  } else {
    const afterHabitId = afterElement.dataset.habitId;
    const afterIndex = habits.findIndex(h => h.id == afterHabitId);
    habits.splice(afterIndex, 0, draggedItem);
  }

  saveData();
  renderHabits();
}

/** 
 * Se for um novo dia, zera progress mas mantém streak / bestStreak
 */
function resetDailyProgressIfNeeded() {
  const todayStr = getLocalDateStr();
  let updated = false;
  habits.forEach(habit => {
    // Se lastCheckDate não for igual a hoje, significa que o hábito NÃO foi completado hoje
    if (habit.lastCheckDate !== todayStr) {
      habit.progress = 0;
      habit.streak = 0; // Zera a streak se o hábito não foi concluído hoje
      updated = true;
    }
  });
  if (updated) {
    saveData();
    renderHabits();
  }
}


/** 
 * incrementProgress: 
 * - Se completou meta, aumenta streak e bestStreak
 */
function incrementProgress(habitId) {
  const habit = habits.find(h => h.id == habitId);
  if (!habit) return;

  if (habit.progress >= habit.goal) {
    alert('Você já atingiu a meta deste hábito hoje!');
    return;
  }

  vibrateShort();
  
  // Incrementa o progresso parcial
  habit.progress++;
  addXp(10);
  
  const todayStr = getLocalDateStr();
  
  // Atualiza o lastCheckDate a cada clique para salvar a data de interação
  habit.lastCheckDate = todayStr;
  
  // Se o hábito for COMPLETO exatamente (quando progress atinge a meta)
  if (habit.progress === habit.goal) {
    // Verifica se o hábito foi completado ontem para manter a sequência
    if (habit.lastCheckDate && isLocalYesterday(habit.lastCheckDate, todayStr)) {
      habit.streak++;
    } else {
      habit.streak = 1;
    }
    
    // Garante que a data de conclusão seja a de hoje
    habit.lastCheckDate = todayStr;
    
    // Atualiza a melhor sequência se necessário
    if (habit.streak > habit.bestStreak) {
      habit.bestStreak = habit.streak;
    }
    
    // XP bônus e feedback visual
    addXp(10);
    runConfetti();
  }

  saveData();
  renderHabits();
}


/** Vibração curta */
function vibrateShort() {
  if ('vibrate' in navigator) {
    navigator.vibrate(50);
  }
}

/** Data local "YYYY-MM-DD" */
function getLocalDateStr() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function isLocalYesterday(lastDateStr, todayStr) {
  if (!lastDateStr) return false;
  const lastDate = new Date(lastDateStr + 'T00:00:00');
  const todayDate = new Date(todayStr + 'T00:00:00');
  const diff = todayDate - lastDate;
  return diff === 86400000; // 24h
}

/** Excluir hábito */
function deleteHabit(habitId) {
  if (!confirm('Excluir este hábito?')) return;
  habits = habits.filter(h => h.id != habitId);
  saveData();
  renderHabits();
}

/** XP / Level / Mascote */
function addXp(amount) {
  currentXp += amount;
  if (currentXp >= xpToNextLevel) {
    levelUp();
  }
  updateXpUI();
}

function levelUp() {
  currentXp -= xpToNextLevel;
  level++;
  xpToNextLevel = Math.floor(xpToNextLevel * 1.3);
  bounceMascot();
  runConfetti();
  
  // Chama a notificação de troféu para cada nível completado.
  showTrophyNotification();

  // Se o nível for múltiplo de 5, mostra o modal de parabéns (mantém-se o comportamento original)
  if (level % 5 === 0) {
    showCongratulationsModal(level);
  }
  
  saveData();
  updateXpUI();
}

// Função para exibir a notificação de troféu com "+1" COM áudio
function showTrophyNotification() {
  const notif = document.getElementById('trophyNotification');
  
  // Reproduz a trilha sonora
  const levelSound = document.getElementById('levelSound');
  if (levelSound) {
    levelSound.currentTime = 0;
    levelSound.play();
  }
  
  notif.classList.remove('hidden');
  notif.style.animation = 'slideUp 3s forwards';
  
  setTimeout(() => {
    notif.classList.add('hidden');
    notif.style.animation = '';
  }, 3000);
}

// Função para exibir a notificação de troféu com "+1" SEM áudio
// function showTrophyNotification() {
//   const notif = document.getElementById('trophyNotification');
//   // Remove a classe que oculta e aplica a animação
//   notif.classList.remove('hidden');
//   notif.style.animation = 'slideUp 3s forwards';
  
//   // Após a animação (1s), oculta novamente e reseta a animação
//   setTimeout(() => {
//     notif.classList.add('hidden');
//     notif.style.animation = '';
//   }, 3000);
// }


/** Modal de Parabéns */
function showCongratulationsModal(currentLevel) {
  const idx = (currentLevel / 5) - 1;
  const msg = motivationalMessages[idx] ||
    "Você é incrível! Continue firme e supere seus próprios recordes!";

  if (congratsMessage) {
    congratsMessage.innerText = `Você alcançou o nível ${currentLevel}!\n\n${msg}`;
  }
  if (congratsModal) {
    congratsModal.classList.remove('hidden');
  }
  overlay.classList.remove('hidden');
}

/** Atualiza UI */
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
  void mascotImg.offsetWidth;
  mascotImg.classList.add('bounce');
}

/** Confetti */
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
    confetto.style.transform = `rotate(${Math.random()*360}deg)`;

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

/** SALVAR & CARREGAR */
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


function resetAllData() {
  
  if (!confirm("Você realmente deseja resetar todos os dados? Essa ação é irreversível!")) {
    return;
  }
  
  // Zera o array de hábitos
  habits.forEach(habit => {
    habit.progress = 0;
    habit.streak = 0;
    habit.bestStreak = 0;
    habit.lastCheckDate = '';
  });
  // Zera o XP / Nível
  currentXp = 0;
  xpToNextLevel = 50;
  level = 1;
  // (Opcional) Zera o nome do usuário, se desejar reiniciar do início
  userName = '';
  
  // Salva as mudanças e re-renderiza
  saveData();
  renderHabits();
  updateXpUI();
  checkUserName(); // Se quiser resetar o nome, pode removê-lo também do localStorage
  
  console.log('Todos os dados foram zerados!');
}













// Variáveis globais para controlar o lembrete diário
let remindersActive = false;
let reminderTimeoutId = null;

// Função que agenda o lembrete diário para as 20:00
function scheduleDailyReminder() {
  const now = new Date();
  const reminderTime = new Date();
  reminderTime.setHours(20, 0, 0, 0); // Define para as 20:00

  let timeToReminder = reminderTime - now;
  if (timeToReminder < 0) {
    // Se já passou, agenda para amanhã (24h = 86400000 ms)
    timeToReminder += 86400000;
  }

  reminderTimeoutId = setTimeout(() => {
    // Verifica se a API de Notificações está disponível
    if ('Notification' in window) {
      if (Notification.permission === "granted") {
        new Notification("Hora de registrar seus hábitos!", {
          body: "Não se esqueça de atualizar seus hábitos hoje.",
          icon: "imgs/logo-habitup.png" // Ajuste o caminho para o seu ícone
        });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            new Notification("Hora de registrar seus hábitos!", {
              body: "Não se esqueça de atualizar seus hábitos hoje.",
              icon: "imgs/logo-habitup.png"
            });
          }
        });
      }
    }
    // Reagenda o lembrete somente se ainda estiver ativo
    if (remindersActive) {
      scheduleDailyReminder();
    }
  }, timeToReminder);
}

// Função para ativar/desativar o lembrete diário com confirmação
function toggleDailyReminder() {
  const toggleBtn = document.getElementById('notificationToggle');
  if (!remindersActive) {
    if (confirm("Deseja ativar o lembrete diário para registrar seus hábitos?")) {
      // Se a permissão não foi concedida, solicita
      if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            remindersActive = true;
            scheduleDailyReminder();
            // Atualiza o botão para ativado: ícone sem traço e com classe active (amarelo)
            toggleBtn.innerHTML = '<i class="fa-solid fa-bell"></i>';
            toggleBtn.classList.add('active');
            localStorage.setItem('reminderMode', 'enabled');
          }
        });
      } else if ("Notification" in window && Notification.permission === "granted") {
        remindersActive = true;
        scheduleDailyReminder();
        toggleBtn.innerHTML = '<i class="fa-solid fa-bell"></i>';
        toggleBtn.classList.add('active');
        localStorage.setItem('reminderMode', 'enabled');
      }
    }
  } else {
    if (confirm("Deseja desativar o lembrete diário?")) {
      remindersActive = false;
      if (reminderTimeoutId) {
        clearTimeout(reminderTimeoutId);
      }
      // Atualiza o botão para desativado: ícone com traço e remove classe active
      toggleBtn.innerHTML = '<i class="fa-solid fa-bell-slash"></i>';
      toggleBtn.classList.remove('active');
      localStorage.setItem('reminderMode', 'disabled');
    }
  }
}

// Vincula o evento de clique ao botão de notificação ao carregar o DOM
document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('notificationToggle');
  toggleBtn.addEventListener('click', toggleDailyReminder);
});


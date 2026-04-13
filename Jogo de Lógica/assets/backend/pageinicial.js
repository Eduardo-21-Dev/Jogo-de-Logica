// ===== LESSONS DATA =====
const lessons = [
  {
    id: 1,
    title: 'Introdução ao CSS',
    description: 'Aprenda os conceitos básicos de CSS e como estilizar elementos HTML',
    difficulty: 'easy',
    completed: false,
    progress: 0,
    current: true
  },
  {
    id: 2,
    title: 'Seletores CSS',
    description: 'Domine os diferentes tipos de seletores CSS para estilizar elementos com precisão',
    difficulty: 'easy',
    completed: false,
    progress: 0,
    locked: true
  },
  {
    id: 3,
    title: 'Modelos de Box e Espaçamentos',
    description: 'Understand margin, padding, border e como eles afetam o layout',
    difficulty: 'easy',
    completed: false,
    progress: 0,
    locked: true
  },
  {
    id: 4,
    title: 'Flexbox - O Poder do Layout Flexível',
    description: 'Domine Flexbox e crie layouts responsivos e modernos com facilidade',
    difficulty: 'medium',
    completed: false,
    progress: 0,
    locked: true
  },
  {
    id: 5,
    title: 'Grid CSS - Layouts Avançados',
    description: 'Aprenda a usar CSS Grid para criar layouts complexos e poderosos',
    difficulty: 'medium',
    completed: false,
    progress: 0,
    locked: true
  },
  {
    id: 6,
    title: 'Animações e Transições',
    description: 'Crie animações suaves e transições impressionantes com CSS',
    difficulty: 'hard',
    completed: false,
    progress: 0,
    locked: true
  },
  {
    id: 7,
    title: 'Transformações 3D',
    description: 'Crie efeitos 3D impressionantes usando CSS Transforms',
    difficulty: 'hard',
    completed: false,
    progress: 0,
    locked: true
  },
  {
    id: 8,
    title: 'Projeto Final - Website Completo',
    description: 'Combine todos os conhecimentos e crie um website responsivo completo',
    difficulty: 'expert',
    completed: false,
    progress: 0,
    locked: true
  }
];

// ===== GAME STATE =====
const gameState = {
  currentLesson: 1,
  completedLessons: 0,
  totalLessons: 8,
  timeInvested: '0m',
  progressPercentage: 0,
  achievements: 0,
  streak: 0
};

// ===== DOM ELEMENTS =====
const menuBtn = document.getElementById('menuBtn');

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  initializeUI();
  setupEventListeners();
  updateProgress();
});

// ===== INITIALIZE UI =====
function initializeUI() {
  updateProgress();
  setupLessonCards();
  logWelcomeMessage();
}

// ===== SETUP EVENT LISTENERS =====
function setupEventListeners() {
  // Lesson card clicks
  document.querySelectorAll('.lesson-card').forEach((card, index) => {
    card.addEventListener('click', () => handleLessonClick(index + 1));
  });
  
  // Start lesson button
  const startLessonBtns = document.querySelectorAll('.btn-lesson-start');
  startLessonBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleStartLesson();
    });
  });
  
  // Menu button
  menuBtn.addEventListener('click', toggleMenu);
}

// ===== UPDATE PROGRESS =====
function updateProgress() {
  // Progress tracking removido - stats bar desativada
}

// ===== SETUP LESSON CARDS ANIMATIONS =====
function setupLessonCards() {
  const cards = document.querySelectorAll('.timeline-item');
  cards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1}s`;
  });
}

// ===== HANDLE LESSON CLICK =====
function handleLessonClick(lessonId) {
  const lesson = lessons[lessonId - 1];
  
  if (lesson.locked) {
    showNotification(
      `🔒 Complete a Lição ${lessonId - 1} primeiro!`,
      'warning'
    );
    return;
  }
  
  if (lesson.completed) {
    showNotification(
      `✓ Você já completou "${lesson.title}"!`,
      'info'
    );
  } else if (lesson.current) {
    showNotification(
      `▶️ Clique em "Continuar Lição" para prosseguir!`,
      'info'
    );
  }
}

// ===== HANDLE START LESSON =====
function handleStartLesson() {
  const currentLesson = lessons.find(l => l.current);
  
  if (!currentLesson) {
    showNotification('Nenhuma lição ativa encontrada!', 'warning');
    return;
  }
  
  showNotification(
    `🚀 Iniciando "${currentLesson.title}"...`,
    'success'
  );
  
  // Simulate loading lesson page
  setTimeout(() => {
    // Aqui você pode redirecionar para a página da lição
    console.log(`Carregando lição: ${currentLesson.title}`);
    // window.location.href = `lesson-${currentLesson.id}.html`;
  }, 800);
}

// ===== HANDLE LESSON COMPLETION =====
function completeLesson(lessonId) {
  const lesson = lessons[lessonId - 1];
  
  if (!lesson.completed) {
    lesson.completed = true;
    lesson.progress = 100;
    
    // Unlock next lesson
    if (lessonId < lessons.length) {
      lessons[lessonId].locked = false;
    }
    
    gameState.completedLessons++;
    gameState.streak++;
    updateProgress();
    
    showNotification(
      `🎉 Parabéns! Você completou "${lesson.title}"!`,
      'success'
    );
  }
}

// ===== NOTIFICATIONS =====
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    padding: 1rem 1.5rem;
    background: ${getNotificationColor(type)};
    color: ${type === 'info' || type === 'warning' ? '#000' : '#fff'};
    border-radius: 8px;
    font-weight: bold;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.4);
    z-index: 10000;
    animation: slideInRight 0.3s ease;
    max-width: 400px;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function getNotificationColor(type) {
  const colors = {
    success: '#00ff41',
    danger: '#ff4757',
    warning: '#ffa502',
    info: '#00d4ff'
  };
  return colors[type] || colors.info;
}

// ===== MENU =====
function toggleMenu() {
  showNotification('📋 Menu de Opções (Em Desenvolvimento)', 'info');
}

// ===== ADD CUSTOM ANIMATIONS =====
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(100px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes slideOutRight {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(100px);
    }
  }

  .timeline-item {
    animation: fadeInUp 0.6s ease-out forwards;
    opacity: 0;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(style);

// ===== WELCOME MESSAGE =====
function logWelcomeMessage() {
  console.log('%c🎮 Bem-vindo ao CSS MASTER! 🎮', 'font-size: 20px; color: #0066cc; font-weight: bold;');
  console.log('%cAprenda CSS de forma divertida e interativa!', 'font-size: 14px; color: #7209b7; font-weight: bold;');
  console.log('%cProgressão: 0 de 8 lições completadas (0%)', 'font-size: 12px; color: #00b366;');
  console.log('%cComece pela Lição 1: Introdução ao CSS', 'font-size: 12px; color: #ff9900;');
}

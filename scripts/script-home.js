// Script para a página principal de escolha

// Cache de elementos DOM
const cache = {
  apiStatus: null,
  cards: null,
  buttons: null
};

// Inicializar cache
function initCache() {
  cache.apiStatus = document.getElementById('api-status');
  cache.cards = document.querySelectorAll('.modulo-card');
  cache.buttons = document.querySelectorAll('.modulo-btn, .btn-status');
}

// Testar status da API com debounce
let apiCheckTimeout;
async function testarStatusAPI() {
  clearTimeout(apiCheckTimeout);
  
  const statusElement = cache.apiStatus;
  if (!statusElement) return;
  
  statusElement.textContent = '🔄 Verificando...';
  
  try {
    const response = await fetch('http://localhost:3000/clientes', {
      method: 'GET',
      mode: 'cors'
    });
    
    if (response.ok) {
      statusElement.textContent = '🟢 Online';
      statusElement.style.color = '#22c55e';
    } else {
      statusElement.textContent = '🟡 Erro';
      statusElement.style.color = '#f59e0b';
    }
  } catch (error) {
    statusElement.textContent = '🔴 Offline';
    statusElement.style.color = '#ef4444';
  }
}

// Adicionar efeitos com event delegation
function addEffects() {
  // Efeito hover nos cards
  document.addEventListener('mouseover', function(e) {
    const card = e.target.closest('.modulo-card');
    if (card) {
      card.style.transform = 'translateY(-8px) scale(1.02)';
    }
  });
  
  document.addEventListener('mouseout', function(e) {
    const card = e.target.closest('.modulo-card');
    if (card) {
      card.style.transform = 'translateY(0) scale(1)';
    }
  });
  
  // Ripple effect nos botões
  document.addEventListener('click', function(e) {
    const button = e.target.closest('.modulo-btn, .btn-status');
    if (!button) return;
    
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.5);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s ease-out;
      pointer-events: none;
    `;
    
    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
  });
}

// Adicionar CSS para ripple effect
function addRippleCSS() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// Inicialização quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  initCache();
  addEffects();
  addRippleCSS();
  
  // Verificar status com delay
  setTimeout(testarStatusAPI, 500);
  
  // Verificar status periodicamente (a cada 30 segundos)
  setInterval(testarStatusAPI, 30000);
});

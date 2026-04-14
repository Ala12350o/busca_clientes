// Script de Autenticação
if (typeof API_BASE_URL === 'undefined') {
  var API_BASE_URL = 'http://localhost:3000';
}

// ============ FUNÇÕES DE UI ============
function mostrarErro(mensagem) {
  const erroDiv = document.getElementById('erro');
  if (erroDiv) {
    erroDiv.textContent = mensagem;
    erroDiv.classList.remove('hidden');
  }
}

function esconderErro() {
  const erroDiv = document.getElementById('erro');
  if (erroDiv) erroDiv.classList.add('hidden');
}

function mostrarSucesso() {
  const sucessoDiv = document.getElementById('sucesso');
  if (sucessoDiv) sucessoDiv.classList.remove('hidden');
}

// ============ FUNÇÕES DE AUTENTICAÇÃO ============
function isLoggedIn() {
  return localStorage.getItem('usuarioLogado') !== null;
}

function getUsuarioLogado() {
  const usuario = localStorage.getItem('usuarioLogado');
  return usuario ? JSON.parse(usuario) : null;
}

function login(usuario) {
  localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
}

function logout() {
  localStorage.removeItem('usuarioLogado');
  window.location.href = '/login.html';
}

// ============ VERIFICAÇÃO DE AUTENTICAÇÃO ============
function checkAuth() {
  // Se estiver na página de login ou cadastro, não precisa verificar
  const path = window.location.pathname;
  const currentPage = window.location.href;
  
  // Páginas públicas que não precisam de login
  const isPublicPage = path.includes('login.html') || path.includes('cadastro.html') || 
                       currentPage.endsWith('login.html') || currentPage.endsWith('cadastro.html');
  
  if (isPublicPage) {
    // Se já estiver logado e tentar acessar login/cadastro, redireciona para home
    if (isLoggedIn()) {
      window.location.href = '/index.html';
    }
    return;
  }
  
  // Para todas as outras páginas protegidas, verifica se está logado
  if (!isLoggedIn()) {
    window.location.href = '/login.html';
  }
}

// ============ LOGIN ============
async function fazerLogin(email, senha) {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Email ou senha incorretos');
    }
    
    const data = await response.json();
    login(data.usuario);
    return data;
  } catch (error) {
    throw error;
  }
}

// ============ CADASTRO ============
async function cadastrarUsuario(dados) {
  try {
    const response = await fetch(`${API_BASE_URL}/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao cadastrar usuário');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
}

// ============ EVENT LISTENERS ============
document.addEventListener('DOMContentLoaded', function() {
  console.log('script-login.js loaded, current page:', window.location.href);
  
  // Toggle senha visível/oculto
  const toggleSenha = document.getElementById('toggle-senha');
  if (toggleSenha) {
    toggleSenha.addEventListener('click', function() {
      const senhaInput = document.getElementById('senha');
      if (senhaInput.type === 'password') {
        senhaInput.type = 'text';
        toggleSenha.textContent = '🙈';
      } else {
        senhaInput.type = 'password';
        toggleSenha.textContent = '👁️';
      }
    });
  }
  
  // Verifica autenticação em todas as páginas
  checkAuth();
  
  // Form de Login
  const formLogin = document.getElementById('form-login');
  if (formLogin) {
    formLogin.addEventListener('submit', async function(e) {
      e.preventDefault();
      esconderErro();
      
      const email = document.getElementById('email').value.trim();
      const senha = document.getElementById('senha').value;
      
      try {
        await fazerLogin(email, senha);
        window.location.href = '/index.html';
      } catch (error) {
        mostrarErro(error.message || 'Erro ao fazer login. Tente novamente.');
      }
    });
  }
  
  // Form de Cadastro
  const formCadastro = document.getElementById('form-cadastro');
  if (formCadastro) {
    formCadastro.addEventListener('submit', async function(e) {
      e.preventDefault();
      esconderErro();
      
      const dados = {
        codigo: parseInt(document.getElementById('codigo').value),
        nome: document.getElementById('nome').value.trim(),
        email: document.getElementById('email').value.trim(),
        senha: document.getElementById('senha').value
      };
      
      // Validações
      if (!dados.codigo || dados.codigo < 1) {
        mostrarErro('Código inválido. Digite um número maior que 0.');
        return;
      }
      
      if (dados.nome.length < 3) {
        mostrarErro('Nome deve ter pelo menos 3 caracteres.');
        return;
      }
      
      if (dados.senha.length < 6) {
        mostrarErro('Senha deve ter pelo menos 6 caracteres.');
        return;
      }
      
      try {
        await cadastrarUsuario(dados);
        mostrarSucesso();
        
        // Redireciona para login após 2 segundos
        setTimeout(() => {
          window.location.href = '/login.html';
        }, 2000);
      } catch (error) {
        mostrarErro(error.message || 'Erro ao cadastrar. Tente novamente.');
      }
    });
  }
});

// ============ EXPORTAR FUNÇÕES GLOBAIS ============
window.logout = logout;
window.isLoggedIn = isLoggedIn;
window.getUsuarioLogado = getUsuarioLogado;

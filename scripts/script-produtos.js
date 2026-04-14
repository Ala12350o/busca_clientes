// Script de Produtos - Versão Refatorada
if (typeof API_BASE_URL === 'undefined') {
  var API_BASE_URL = 'http://localhost:3000';
}

// Estado global
const state = {
  loading: false
};

// ============ FUNÇÕES UTILITÁRIAS ============
function formatarValor(valor) {
  return parseFloat(valor).toFixed(2);
}

function validarId(id) {
  const num = parseInt(id);
  return !isNaN(num) && num > 0;
}

// ============ FUNÇÕES DE API ============
async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

async function criarProduto(dados) {
  const response = await fetch(`${API_BASE_URL}/produtos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });
  
  if (!response.ok) {
    if (response.status === 400 || response.status === 409) {
      throw new Error('ID já cadastrado. Tente outro ID.');
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Erro ao cadastrar produto');
  }
  
  return response.json();
}

async function buscarProduto(id) {
  try {
    return await apiRequest(`/produtos/${id}`);
  } catch (error) {
    if (error.message.includes('404')) return null;
    throw error;
  }
}

async function listarProdutos() {
  return apiRequest('/produtos');
}

async function deletarProdutoAPI(id) {
  const response = await fetch(`${API_BASE_URL}/produtos/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  // DELETE pode retornar 204 No Content (sem body)
  if (response.status === 204) {
    return { success: true };
  }
  
  return response.json().catch(() => ({ success: true }));
}

async function atualizarProduto(id, dados) {
  const response = await fetch(`${API_BASE_URL}/produtos/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json().catch(() => ({ success: true }));
}

// ============ FUNÇÕES DE UI ============
function mostrarErro(mensagem) {
  const erroDiv = document.getElementById('erro-produtos');
  const resultadoDiv = document.getElementById('resultado-produtos');
  
  if (erroDiv) {
    erroDiv.textContent = mensagem;
    erroDiv.classList.remove('hidden');
  }
  if (resultadoDiv) resultadoDiv.innerHTML = '';
}

function esconderErro() {
  const erroDiv = document.getElementById('erro-produtos');
  if (erroDiv) erroDiv.classList.add('hidden');
}

function mostrarLoading() {
  const resultadoDiv = document.getElementById('resultado-produtos');
  if (resultadoDiv) {
    resultadoDiv.innerHTML = '<div class="loading">Carregando...</div>';
  }
}

function mostrarSucesso(dados) {
  const resultadoDiv = document.getElementById('resultado-produtos');
  resultadoDiv.innerHTML = `
    <div class="cliente-card">
      <h3>Produto Cadastrado com Sucesso!</h3>
      <p><strong>ID:</strong> ${dados.id}</p>
      <p><strong>Nome:</strong> ${dados.nome}</p>
      <p><strong>Valor:</strong> R$ ${formatarValor(dados.valor)}</p>
      <p><strong>Descrição:</strong> ${dados.descricao}</p>
      <button class="btn-salvar" onclick="buscarTodosProdutos()">Ver Todos os Produtos</button>
    </div>
  `;
}

function templateProduto(produto) {
  return `
    <div class="cliente-card">
      <button class="btn-delete-x" onclick="confirmarDeletarProduto('${produto.id}')" title="Deletar Produto">×</button>
      <h3>${produto.nome}</h3>
      <p><strong>ID:</strong> ${produto.id}</p>
      <p><strong>Valor:</strong> R$ ${formatarValor(produto.valor)}</p>
      <p><strong>Descrição:</strong> ${produto.descricao}</p>
      <div class="card-actions">
        <button class="btn-editar" onclick="editarProduto(${produto.id})" title="Editar Produto">✎ Editar</button>
      </div>
    </div>
  `;
}

// ============ FUNÇÕES PRINCIPAIS ============
async function buscarTodosProdutos() {
  if (state.loading) return;
  state.loading = true;
  
  try {
    esconderErro();
    mostrarLoading();
    
    const usuario = getUsuarioLogado();
    if (!usuario) {
      mostrarErro('Usuário não está logado.');
      state.loading = false;
      return;
    }
    
    const todosProdutos = await listarProdutos();
    const produtos = todosProdutos.filter(p => p.usuario_codigo === usuario.codigo);
    const resultadoDiv = document.getElementById('resultado-produtos');
    
    if (!produtos || produtos.length === 0) {
      resultadoDiv.innerHTML = '<p>Nenhum produto encontrado para este usuário.</p>';
    } else {
      resultadoDiv.innerHTML = produtos.map(p => templateProduto(p)).join('');
    }
  } catch (error) {
    mostrarErro(error.name === 'TypeError' && error.message.includes('fetch') 
      ? 'API não está online. Verifique se o servidor está rodando em localhost:3000'
      : `Erro ao buscar produtos: ${error.message}`);
  } finally {
    state.loading = false;
  }
}

async function buscarProdutoPorId() {
  if (state.loading) return;
  state.loading = true;
  
  const idInput = document.getElementById('produto-id');
  const id = idInput.value.trim();
  
  if (!validarId(id)) {
    mostrarErro('ID inválido. Digite um número maior que 0.');
    state.loading = false;
    return;
  }
  
  try {
    esconderErro();
    mostrarLoading();
    
    const usuario = getUsuarioLogado();
    if (!usuario) {
      mostrarErro('Usuário não está logado.');
      state.loading = false;
      return;
    }
    
    const produto = await buscarProduto(id);
    const resultadoDiv = document.getElementById('resultado-produtos');
    
    if (!produto) {
      resultadoDiv.innerHTML = '<p>Produto não encontrado com este ID.</p>';
    } else if (produto.usuario_codigo != usuario.codigo) {
      resultadoDiv.innerHTML = '<p>Produto não encontrado com este ID.</p>';
    } else {
      resultadoDiv.innerHTML = templateProduto(produto);
    }
  } catch (error) {
    mostrarErro(error.name === 'TypeError' && error.message.includes('fetch')
      ? 'API não está online. Verifique se o servidor está rodando em localhost:3000'
      : 'Erro ao buscar produto. Tente novamente mais tarde.');
  } finally {
    state.loading = false;
  }
}

async function testarConexaoAPI() {
  try {
    esconderErro();
    const resultadoDiv = document.getElementById('resultado-produtos');
    resultadoDiv.innerHTML = '<div class="loading">Testando conexão...</div>';
    
    const data = await listarProdutos();
    resultadoDiv.innerHTML = `
      <div class="cliente-card">
        <h3>Conexão OK!</h3>
        <p>API respondendo. ${data.length} produtos encontrados.</p>
      </div>
    `;
  } catch (error) {
    mostrarErro('Falha na conexão com API.');
  }
}

// ============ CADASTRO ============
async function cadastrarProduto() {
  const resultadoDiv = document.getElementById('resultado-produtos');
  esconderErro();
  
  // Buscar próximo ID disponível
  let proximoId = 1;
  try {
    const todosProdutos = await listarProdutos();
    if (todosProdutos && todosProdutos.length > 0) {
      const maxId = Math.max(...todosProdutos.map(p => parseInt(p.id) || 0));
      proximoId = maxId + 1;
    }
  } catch (error) {
    console.error('Erro ao buscar produtos para gerar ID:', error);
  }
  
  resultadoDiv.innerHTML = `
    <div class="cliente-card">
      <h3>Cadastrar Novo Produto</h3>
      <form id="form-cadastro">
        <div class="form-group">
          <label>ID:</label>
          <input type="text" id="input-id" value="${proximoId}" readonly style="background-color: #e9ecef; cursor: not-allowed;">
          <small style="color: #6c757d;">ID gerado automaticamente</small>
        </div>
        <div class="form-group">
          <label>Nome *:</label>
          <input type="text" id="input-nome" required>
        </div>
        <div class="form-group">
          <label>Valor *:</label>
          <input type="number" id="input-valor" min="0.01" step="0.01" placeholder="0.00" required>
        </div>
        <div class="form-group">
          <label>Descrição *:</label>
          <textarea id="input-descricao" rows="4" required></textarea>
        </div>
        <button type="submit" class="btn-salvar">Salvar Produto</button>
        <button type="button" class="btn-cancelar" onclick="limparResultado()">Cancelar</button>
      </form>
    </div>
  `;
  
  // Submit do formulário
  document.getElementById('form-cadastro').addEventListener('submit', async function(e) {
    e.preventDefault();
    if (state.loading) return;
    
    const usuario = getUsuarioLogado();
    if (!usuario) {
      mostrarErro('Usuário não está logado.');
      state.loading = false;
      return;
    }
    
    const dados = {
      id: parseInt(document.getElementById('input-id').value),
      nome: document.getElementById('input-nome').value.trim(),
      valor: parseFloat(document.getElementById('input-valor').value),
      descricao: document.getElementById('input-descricao').value.trim(),
      usuario_codigo: usuario.codigo
    };
    
    // Validações
    if (dados.nome.length < 3) {
      mostrarErro('Nome inválido. Digite pelo menos 3 caracteres.');
      return;
    }
    
    if (!dados.valor || dados.valor <= 0) {
      mostrarErro('Valor inválido. Digite um valor maior que 0.');
      return;
    }
    
    if (dados.descricao.length < 10) {
      mostrarErro('Descrição inválida. Digite pelo menos 10 caracteres.');
      return;
    }
    
    state.loading = true;
    mostrarLoading();
    
    try {
      await criarProduto(dados);
      mostrarSucesso(dados);
    } catch (error) {
      mostrarErro(error.message);
    } finally {
      state.loading = false;
    }
  });
}

// ============ DELETAR ============
async function confirmarDeletarProduto(id) {
  if (state.loading) return;
  state.loading = true;
  mostrarLoading();
  
  try {
    const usuario = getUsuarioLogado();
    if (!usuario) {
      mostrarErro('Usuário não está logado.');
      state.loading = false;
      return;
    }
    
    const produto = await buscarProduto(id);
    
    if (!produto) {
      mostrarErro('Produto não encontrado.');
      state.loading = false;
      return;
    }
    
    if (produto.usuario_codigo != usuario.codigo) {
      mostrarErro('Você não tem permissão para deletar este produto.');
      state.loading = false;
      return;
    }
    
    // Mostrar confirmação
    const resultadoDiv = document.getElementById('resultado-produtos');
    resultadoDiv.innerHTML = `
      <div class="cliente-card">
        <h3>Confirmar Deleção</h3>
        <p>Tem certeza que deseja deletar este produto?</p>
        ${templateProduto(produto)}
        <button class="btn-deletar" onclick="executarDeletar('${id}')">Sim, Deletar</button>
        <button class="btn-cancelar" onclick="buscarTodosProdutos()">Cancelar</button>
      </div>
    `;
  } catch (error) {
    mostrarErro('Erro ao buscar produto.');
  } finally {
    state.loading = false;
  }
}

async function deletarProduto() {
  const resultadoDiv = document.getElementById('resultado-produtos');
  esconderErro();
  
  resultadoDiv.innerHTML = `
    <div class="cliente-card">
      <h3>Deletar Produto</h3>
      <p>Digite o ID do produto:</p>
      <div class="form-group">
        <input type="number" id="input-id-deletar" min="1" placeholder="Ex: 1">
      </div>
      <button class="btn-salvar" onclick="confirmarDeletar()">Buscar e Deletar</button>
      <button class="btn-cancelar" onclick="limparResultado()">Cancelar</button>
    </div>
  `;
  
  document.getElementById('input-id-deletar').focus();
}

async function confirmarDeletar() {
  const id = document.getElementById('input-id-deletar').value.trim();
  
  if (!validarId(id)) {
    mostrarErro('ID inválido. Digite um número maior que 0.');
    return;
  }
  
  if (state.loading) return;
  state.loading = true;
  mostrarLoading();
  
  try {
    const produto = await buscarProduto(id);
    
    if (!produto) {
      mostrarErro('Produto não encontrado com este ID.');
      state.loading = false;
      return;
    }
    
    // Mostrar confirmação
    const resultadoDiv = document.getElementById('resultado-produtos');
    resultadoDiv.innerHTML = `
      <div class="cliente-card">
        <h3>Confirmar Deleção</h3>
        <p>Tem certeza que deseja deletar este produto?</p>
        ${templateProduto(produto)}
        <button class="btn-deletar" onclick="executarDeletar('${id}')">Sim, Deletar</button>
        <button class="btn-cancelar" onclick="deletarProduto()">Cancelar</button>
      </div>
    `;
  } catch (error) {
    mostrarErro('Erro ao buscar produto.');
  } finally {
    state.loading = false;
  }
}

async function executarDeletar(id) {
  if (state.loading) return;
  state.loading = true;
  mostrarLoading();
  
  try {
    await deletarProdutoAPI(id);
    
    const resultadoDiv = document.getElementById('resultado-produtos');
    resultadoDiv.innerHTML = `
      <div class="cliente-card">
        <h3>Produto Deletado com Sucesso!</h3>
        <p>ID ${id} removido.</p>
        <button class="btn-salvar" onclick="buscarTodosProdutos()">Ver Todos</button>
      </div>
    `;
  } catch (error) {
    mostrarErro(`Erro ao deletar: ${error.message}`);
  } finally {
    state.loading = false;
  }
}

async function editarProduto(id) {
  if (state.loading) return;
  state.loading = true;
  mostrarLoading();
  
  try {
    const usuario = getUsuarioLogado();
    if (!usuario) {
      mostrarErro('Usuário não está logado.');
      state.loading = false;
      return;
    }
    
    const produto = await buscarProduto(id);
    
    if (!produto) {
      mostrarErro('Produto não encontrado.');
      state.loading = false;
      return;
    }
    
    if (produto.usuario_codigo != usuario.codigo) {
      mostrarErro('Você não tem permissão para editar este produto.');
      state.loading = false;
      return;
    }
    
    const resultadoDiv = document.getElementById('resultado-produtos');
    resultadoDiv.innerHTML = `
      <div class="cliente-card">
        <h3>Editar Produto</h3>
        <form id="form-edicao-produto">
          <div class="form-group">
            <label>ID:</label>
            <input type="text" value="${produto.id}" disabled style="background-color: #e9ecef;">
          </div>
          <div class="form-group">
            <label>Nome *:</label>
            <input type="text" id="edit-nome" value="${produto.nome}" required>
          </div>
          <div class="form-group">
            <label>Valor *:</label>
            <input type="number" id="edit-valor" value="${produto.valor}" min="0.01" step="0.01" required>
          </div>
          <div class="form-group">
            <label>Descrição *:</label>
            <textarea id="edit-descricao" rows="4" required>${produto.descricao}</textarea>
          </div>
          <button type="submit" class="btn-salvar">Salvar Alterações</button>
          <button type="button" class="btn-cancelar" onclick="buscarTodosProdutos()">Cancelar</button>
        </form>
      </div>
    `;
    
    document.getElementById('form-edicao-produto').addEventListener('submit', async function(e) {
      e.preventDefault();
      if (state.loading) return;
      
      const dados = {
        nome: document.getElementById('edit-nome').value.trim(),
        valor: parseFloat(document.getElementById('edit-valor').value),
        descricao: document.getElementById('edit-descricao').value.trim(),
        usuario_codigo: usuario.codigo
      };
      
      if (dados.nome.length < 3) {
        mostrarErro('Nome inválido. Digite pelo menos 3 caracteres.');
        return;
      }
      
      if (!dados.valor || dados.valor <= 0) {
        mostrarErro('Valor inválido. Digite um valor maior que 0.');
        return;
      }
      
      if (dados.descricao.length < 10) {
        mostrarErro('Descrição inválida. Digite pelo menos 10 caracteres.');
        return;
      }
      
      state.loading = true;
      mostrarLoading();
      
      try {
        await atualizarProduto(id, dados);
        resultadoDiv.innerHTML = `
          <div class="cliente-card">
            <h3>Produto Atualizado com Sucesso!</h3>
            <p>ID: ${id}</p>
            <button class="btn-salvar" onclick="buscarTodosProdutos()">Ver Todos os Produtos</button>
          </div>
        `;
      } catch (error) {
        mostrarErro(`Erro ao atualizar: ${error.message}`);
      } finally {
        state.loading = false;
      }
    });
  } catch (error) {
    mostrarErro('Erro ao buscar produto para edição.');
  } finally {
    state.loading = false;
  }
}

function limparResultado() {
  const resultadoDiv = document.getElementById('resultado-produtos');
  if (resultadoDiv) resultadoDiv.innerHTML = '';
  esconderErro();
}

// ============ INICIALIZAÇÃO ============
document.addEventListener('DOMContentLoaded', function() {
  // Apenas números no campo de busca ID
  const idInput = document.getElementById('produto-id');
  if (idInput) {
    idInput.addEventListener('input', function(e) {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });
  }
});

// ============ EXPORTAR FUNÇÕES GLOBAIS ============
window.cadastrarProduto = cadastrarProduto;
window.deletarProduto = deletarProduto;
window.buscarTodosProdutos = buscarTodosProdutos;
window.buscarProdutoPorId = buscarProdutoPorId;
window.testarConexaoAPI = testarConexaoAPI;
window.confirmarDeletar = confirmarDeletar;
window.confirmarDeletarProduto = confirmarDeletarProduto;
window.executarDeletar = executarDeletar;
window.limparResultado = limparResultado;
window.editarProduto = editarProduto;

console.log('script-produtos.js loaded, functions exported:', Object.keys(window).filter(k => ['cadastrarProduto', 'buscarTodosProdutos', 'buscarProdutoPorId'].includes(k)));

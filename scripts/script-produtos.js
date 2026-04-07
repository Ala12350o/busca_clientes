// Script otimizado para produtos com campos: ID, nome, descrição, valor
const API_BASE_URL = 'http://localhost:3000';

// Cache de elementos e estado
const state = {
  cache: {},
  loading: false,
  currentForm: null
};

// Utilitários
const utils = {
  // Cache DOM elements
  getElement(id) {
    if (!state.cache[id]) {
      state.cache[id] = document.getElementById(id);
    }
    return state.cache[id];
  },
  
  // Validadores
  validators: {
    id: (id) => id && !isNaN(id) && parseInt(id) > 0,
    nome: (nome) => nome && nome.trim().length >= 3,
    valor: (valor) => valor && parseFloat(valor) > 0,
    descricao: (descricao) => descricao && descricao.trim().length >= 10
  },
  
  // Template de produto
  productTemplate(produto) {
    return `
      <div class="cliente-card">
        <h3>${produto.nome}</h3>
        <p><strong>ID:</strong> ${produto.id}</p>
        <p><strong>Nome:</strong> ${produto.nome}</p>
        <p><strong>Valor:</strong> R$ ${parseFloat(produto.valor).toFixed(2)}</p>
        <p><strong>Descrição:</strong> ${produto.descricao}</p>
      </div>
    `;
  },
  
  // Renderização
  renderProducts(products) {
    if (!products || products.length === 0) {
      return '<p>Nenhum produto encontrado.</p>';
    }
    return products.map(produto => utils.productTemplate(produto)).join('');
  }
};

// Gerenciamento de UI
const ui = {
  mostrarErro(mensagem) {
    const erroDiv = utils.getElement('erro-produtos');
    const resultadoDiv = utils.getElement('resultado-produtos');
    
    if (erroDiv) {
      erroDiv.textContent = mensagem;
      erroDiv.classList.remove('hidden');
    }
    if (resultadoDiv) {
      resultadoDiv.innerHTML = '';
    }
  },
  
  esconderErro() {
    const erroDiv = utils.getElement('erro-produtos');
    if (erroDiv) {
      erroDiv.classList.add('hidden');
    }
  },
  
  mostrarLoading() {
    const resultadoDiv = utils.getElement('resultado-produtos');
    if (resultadoDiv) {
      resultadoDiv.innerHTML = '<div class="loading">🔄 Buscando produtos...</div>';
    }
  },
  
  limparResultado() {
    const resultadoDiv = utils.getElement('resultado-produtos');
    if (resultadoDiv) {
      resultadoDiv.innerHTML = '';
    }
    ui.esconderErro();
  }
};

// API Client
const api = {
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        mode: 'cors',
        ...options
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  
  async getAllProducts() {
    return api.request('/produtos');
  },
  
  async getProductById(id) {
    try {
      return await api.request(`/produtos/${id}`);
    } catch (error) {
      if (error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  },
  
  async createProduct(productData) {
    return api.request('/produtos', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  },
  
  async updateProduct(id, productData) {
    return api.request(`/produtos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
  },
  
  async deleteProduct(id) {
    return api.request(`/produtos/${id}`, { method: 'DELETE' });
  }
};

// Manipuladores de eventos
const handlers = {
  async testarConexaoAPI() {
    const resultadoDiv = utils.getElement('resultado-produtos');
    
    try {
      ui.esconderErro();
      resultadoDiv.innerHTML = '<div class="loading">Testando conexão com API...</div>';
      
      const data = await api.getAllProducts();
      resultadoDiv.innerHTML = `
        <div class="cliente-card">
          <h3>Teste de Conexão Bem-Sucedido!</h3>
          <p><strong>Status:</strong> 200</p>
          <p><strong>Produtos encontrados:</strong> ${data.length}</p>
          <p><strong>API respondendo:</strong> Sim</p>
          <details style="margin-top: 10px;">
            <summary>Ver dados brutos</summary>
            <pre style="background: #f8f9fa; padding: 10px; border-radius: 5px; overflow-x: auto;">
${JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </div>
      `;
    } catch (error) {
      ui.mostrarErro(`Falha no teste de conexão: ${error.message}`);
    }
  },
  
  async buscarTodosProdutos() {
    if (state.loading) return;
    state.loading = true;
    
    try {
      ui.esconderErro();
      ui.mostrarLoading();
      
      const produtos = await api.getAllProducts();
      const resultadoDiv = utils.getElement('resultado-produtos');
      resultadoDiv.innerHTML = utils.renderProducts(produtos);
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        ui.mostrarErro('API não está online. Verifique se o servidor está rodando em localhost:3000');
      } else {
        ui.mostrarErro(`Erro ao buscar produtos: ${error.message}`);
      }
    } finally {
      state.loading = false;
    }
  },
  
  async buscarProdutoPorId() {
    if (state.loading) return;
    state.loading = true;
    
    const idInput = utils.getElement('produto-id');
    const id = idInput.value.trim();
    
    if (!utils.validators.id(id)) {
      ui.mostrarErro('❌ ID inválido. Digite um número maior que 0.');
      state.loading = false;
      return;
    }
    
    try {
      ui.esconderErro();
      ui.mostrarLoading();
      
      const produto = await api.getProductById(id);
      const resultadoDiv = utils.getElement('resultado-produtos');
      
      if (!produto) {
        resultadoDiv.innerHTML = '<p>Produto não encontrado com este ID.</p>';
      } else {
        resultadoDiv.innerHTML = utils.productTemplate(produto);
      }
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        ui.mostrarErro('❌ API não está online. Verifique se o servidor está rodando em localhost:3000');
      } else {
        ui.mostrarErro('❌ Erro ao buscar produto. Tente novamente mais tarde.');
      }
    } finally {
      state.loading = false;
    }
  }
};

// Formulários CRUD
const forms = {
  mostrarFormulario(tipo, dados = {}) {
    const templates = {
      cadastrar: `
        <div class="cliente-card">
          <h3>📝 Cadastrar Novo Produto</h3>
          <form id="form-produto" data-tipo="cadastrar">
            ${forms.gerarCampos(dados)}
            <div class="form-group">
              <button type="submit" class="btn-salvar">💾 Salvar Produto</button>
              <button type="button" class="btn-cancelar" onclick="ui.limparResultado()">❌ Cancelar</button>
            </div>
          </form>
        </div>
      `,
      atualizar: `
        <div class="cliente-card">
          <h3>✏️ Atualizar Produto</h3>
          <form id="form-produto" data-tipo="atualizar">
            ${forms.gerarCampos(dados, true)}
            <div class="form-group">
              <button type="submit" class="btn-salvar">💾 Atualizar Produto</button>
              <button type="button" class="btn-cancelar" onclick="ui.limparResultado()">❌ Cancelar</button>
            </div>
          </form>
        </div>
      `,
      buscarParaAtualizar: `
        <div class="cliente-card">
          <h3>✏️ Atualizar Produto</h3>
          <p>Digite o ID do produto que deseja atualizar:</p>
          <div class="form-group">
            <label for="id-busca">ID *:</label>
            <input type="text" id="id-busca" placeholder="Digite o ID do produto" required>
            <button type="button" class="btn-salvar" onclick="forms.buscarParaAtualizar()">🔍 Buscar Produto</button>
          </div>
          <button type="button" class="btn-cancelar" onclick="ui.limparResultado()">❌ Cancelar</button>
        </div>
      `,
      buscarParaDeletar: `
        <div class="cliente-card">
          <h3>🗑️ Deletar Produto</h3>
          <p>Digite o ID do produto que deseja deletar:</p>
          <div class="form-group">
            <label for="id-busca">ID *:</label>
            <input type="text" id="id-busca" placeholder="Digite o ID do produto" required>
            <button type="button" class="btn-salvar" onclick="forms.buscarParaDeletar()">🔍 Buscar Produto</button>
          </div>
          <button type="button" class="btn-cancelar" onclick="ui.limparResultado()">❌ Cancelar</button>
        </div>
      `,
      confirmarDeletar: (produto, id) => `
        <div class="cliente-card">
          <h3>⚠️ Confirmar Deleção</h3>
          <p>Tem certeza que deseja deletar o seguinte produto?</p>
          ${utils.productTemplate(produto)}
          <div class="form-group">
            <button type="button" class="btn-deletar" onclick="forms.confirmarDeletar('${id}')">🗑️ Sim, Deletar Produto</button>
            <button type="button" class="btn-cancelar" onclick="ui.limparResultado()">❌ Cancelar</button>
          </div>
        </div>
      `
    };
    
    const resultadoDiv = utils.getElement('resultado-produtos');
    resultadoDiv.innerHTML = templates[tipo];
    
    // Adicionar evento de submit
    const form = resultadoDiv.querySelector('#form-produto');
    if (form) {
      form.addEventListener('submit', forms.handleSubmit);
    }
  },
  
  gerarCampos(dados = {}, readonly = false) {
    return `
      <div class="form-group">
        <label for="id">ID *:</label>
        <input type="text" id="id" value="${dados.id || ''}" ${readonly ? 'readonly' : ''} required>
      </div>
      <div class="form-group">
        <label for="nome">Nome *:</label>
        <input type="text" id="nome" value="${dados.nome || ''}" required>
      </div>
      <div class="form-group">
        <label for="valor">Valor *:</label>
        <input type="number" id="valor" value="${dados.valor || ''}" min="0.01" step="0.01" required>
      </div>
      <div class="form-group">
        <label for="descricao">Descrição *:</label>
        <textarea id="descricao" rows="4" required>${dados.descricao || ''}</textarea>
      </div>
    `;
  },
  
  async handleSubmit(e) {
    e.preventDefault();
    if (state.loading) return;
    
    const form = e.target;
    const tipo = form.dataset.tipo;
    const formData = new FormData(form);
    
    const dados = {
      id: parseInt(formData.get('id') || 0),
      nome: formData.get('nome')?.trim(),
      valor: parseFloat(formData.get('valor') || 0),
      descricao: formData.get('descricao')?.trim()
    };
    
    // Validações
    if (!utils.validators.id(dados.id)) {
      ui.mostrarErro('❌ ID inválido. Digite um número maior que 0.');
      return;
    }
    
    if (!utils.validators.nome(dados.nome)) {
      ui.mostrarErro('❌ Nome inválido. Digite pelo menos 3 caracteres.');
      return;
    }
    
    if (!utils.validators.valor(dados.valor)) {
      ui.mostrarErro('❌ Valor inválido. Digite um valor maior que 0.');
      return;
    }
    
    if (!utils.validators.descricao(dados.descricao)) {
      ui.mostrarErro('❌ Descrição inválida. Digite pelo menos 10 caracteres.');
      return;
    }
    
    state.loading = true;
    
    try {
      ui.esconderErro();
      ui.mostrarLoading();
      
      let resultado;
      if (tipo === 'cadastrar') {
        resultado = await api.createProduct(dados);
        ui.mostrarSucesso('Produto Cadastrado', resultado, 'cadastrar');
      } else if (tipo === 'atualizar') {
        resultado = await api.updateProduct(dados.id, dados);
        ui.mostrarSucesso('Produto Atualizado', resultado, 'atualizar');
      }
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        ui.mostrarErro('❌ API não está online. Verifique se o servidor está rodando em localhost:3000');
      } else {
        ui.mostrarErro(`❌ Erro ao ${tipo === 'cadastrar' ? 'cadastrar' : 'atualizar'} produto: ${error.message}`);
      }
    } finally {
      state.loading = false;
    }
  },
  
  async buscarParaAtualizar() {
    const idInput = utils.getElement('id-busca');
    const id = idInput.value.trim();
    
    if (!utils.validators.id(id)) {
      ui.mostrarErro('❌ ID inválido. Digite um número maior que 0.');
      return;
    }
    
    try {
      ui.esconderErro();
      ui.mostrarLoading();
      
      const produto = await api.getProductById(id);
      
      if (!produto) {
        ui.mostrarErro('❌ Produto não encontrado com este ID.');
      } else {
        forms.mostrarFormulario('atualizar', produto);
      }
    } catch (error) {
      ui.mostrarErro('❌ Erro ao buscar produto. Tente novamente mais tarde.');
    }
  },
  
  async buscarParaDeletar() {
    const idInput = utils.getElement('id-busca');
    const id = idInput.value.trim();
    
    if (!utils.validators.id(id)) {
      ui.mostrarErro('❌ ID inválido. Digite um número maior que 0.');
      return;
    }
    
    try {
      ui.esconderErro();
      ui.mostrarLoading();
      
      const produto = await api.getProductById(id);
      
      if (!produto) {
        ui.mostrarErro('❌ Produto não encontrado com este ID.');
      } else {
        forms.mostrarFormulario('confirmarDeletar', produto, id);
      }
    } catch (error) {
      ui.mostrarErro('❌ Erro ao buscar produto. Tente novamente mais tarde.');
    }
  },
  
  async confirmarDeletar(id) {
    if (state.loading) return;
    state.loading = true;
    
    try {
      ui.esconderErro();
      ui.mostrarLoading();
      
      await api.deleteProduct(id);
      
      const resultadoDiv = utils.getElement('resultado-produtos');
      resultadoDiv.innerHTML = `
        <div class="cliente-card">
          <h3>✅ Produto Deletado com Sucesso!</h3>
          <p>O produto com ID ${id} foi removido do sistema.</p>
          <button class="btn-salvar" onclick="handlers.buscarTodosProdutos()">🔄 Ver Todos os Produtos</button>
        </div>
      `;
    } catch (error) {
      ui.mostrarErro(`❌ Erro ao deletar produto: ${error.message}`);
    } finally {
      state.loading = false;
    }
  },
  
  mostrarSucesso(titulo, produto, acao) {
    const resultadoDiv = utils.getElement('resultado-produtos');
    resultadoDiv.innerHTML = `
      <div class="cliente-card">
        <h3>✅ ${titulo} com Sucesso!</h3>
        ${utils.productTemplate(produto)}
        <button class="btn-salvar" onclick="handlers.buscarTodosProdutos()">🔄 Ver Todos os Produtos</button>
      </div>
    `;
  }
};

// Funções globais para compatibilidade
async function cadastrarProduto() {
  forms.mostrarFormulario('cadastrar');
}

async function atualizarProduto() {
  forms.mostrarFormulario('buscarParaAtualizar');
}

async function deletarProduto() {
  forms.mostrarFormulario('buscarParaDeletar');
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
  // Inicialização do campo de ID
  const idInput = utils.getElement('produto-id');
  if (idInput) {
    idInput.addEventListener('input', function(e) {
      // Permitir apenas números
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });
  }
});

// Export para uso global
window.handlers = handlers;
window.forms = forms;
window.utils = utils;
window.ui = ui;

// Exportar funções globais individualmente
window.cadastrarProduto = cadastrarProduto;
window.atualizarProduto = atualizarProduto;
window.deletarProduto = deletarProduto;
window.buscarTodosProdutos = handlers.buscarTodosProdutos;
window.buscarProdutoPorId = handlers.buscarProdutoPorId;
window.testarConexaoAPI = handlers.testarConexaoAPI;
window.limparResultado = ui.limparResultado;

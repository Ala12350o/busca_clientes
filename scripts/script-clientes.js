// Script otimizado para clientes
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
  
  // Formatador de CPF
  formatCPF(cpf) {
    const cpfStr = String(cpf).replace(/\D/g, '');
    return cpfStr
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  },
  
  // Validações
  validators: {
    cpf: (cpf) => cpf && cpf.length === 11,
    nome: (nome) => nome && nome.trim().length >= 3,
    idade: (idade) => idade && idade >= 1 && idade <= 120,
    endereco: (endereco) => endereco && endereco.trim().length >= 5,
    bairro: (bairro) => bairro && bairro.trim().length >= 3,
    contato: (contato) => contato && contato.trim().length >= 3
  },
  
  // Máscara de CPF
  applyCPFField(input) {
    input.addEventListener('input', function(e) {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length <= 11) {
        value = value.replace(/(\d{3})(\d)/, '$1.$2')
                    .replace(/(\d{3})(\d)/, '$1.$2')
                    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      }
      e.target.value = value;
    });
  },
  
  // Template de cliente
  clientTemplate(cliente) {
    return `
      <div class="cliente-card">
        <h3>${cliente.nome}</h3>
        <p><strong>CPF:</strong> <span class="cpf">${utils.formatCPF(String(cliente.cpf))}</span></p>
        <p><strong>Idade:</strong> ${cliente.idade} anos</p>
        <p><strong>Endereço:</strong> ${cliente.endereco}</p>
        <p><strong>Bairro:</strong> ${cliente.bairro}</p>
        <p><strong>Contato:</strong> ${cliente.contato}</p>
      </div>
    `;
  },
  
  // Renderização
  renderClients(clients) {
    if (!clients || clients.length === 0) {
      return '<p>Nenhum cliente encontrado.</p>';
    }
    return clients.map(cliente => utils.clientTemplate(cliente)).join('');
  }
};

// Gerenciamento de UI
const ui = {
  mostrarErro(mensagem) {
    const erroDiv = utils.getElement('erro');
    const resultadoDiv = utils.getElement('resultado');
    
    if (erroDiv) {
      erroDiv.textContent = mensagem;
      erroDiv.classList.remove('hidden');
    }
    if (resultadoDiv) {
      resultadoDiv.innerHTML = '';
    }
  },
  
  esconderErro() {
    const erroDiv = utils.getElement('erro');
    if (erroDiv) {
      erroDiv.classList.add('hidden');
    }
  },
  
  mostrarLoading() {
    const resultadoDiv = utils.getElement('resultado');
    if (resultadoDiv) {
      resultadoDiv.innerHTML = '<div class="loading">Carregando...</div>';
    }
  },
  
  limparResultado() {
    const resultadoDiv = utils.getElement('resultado');
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
  
  async getAllClients() {
    return api.request('/clientes');
  },
  
  async getClientByCPF(cpf) {
    try {
      return await api.request(`/clientes/${cpf}`);
    } catch (error) {
      if (error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  },
  
  async createClient(clientData) {
    const response = await fetch(`${API_BASE_URL}/clientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clientData)
    });
    
    if (response.status === 409) {
      throw new Error('CPF já cadastrado. Este CPF não pode ser duplicado.');
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },
  
  async updateClient(cpf, clientData) {
    return api.request(`/clientes/${cpf}`, {
      method: 'PUT',
      body: JSON.stringify(clientData)
    });
  },
  
  async deleteClient(cpf) {
    return api.request(`/clientes/${cpf}`, { method: 'DELETE' });
  }
};

// Manipuladores de eventos
const handlers = {
  async testarConexaoAPI() {
    const resultadoDiv = utils.getElement('resultado');
    
    try {
      ui.esconderErro();
      resultadoDiv.innerHTML = '<div class="loading">Testando conexão com API...</div>';
      
      const data = await api.getAllClients();
      resultadoDiv.innerHTML = `
        <div class="cliente-card">
          <h3>Teste de Conexão Bem-Sucedido!</h3>
          <p><strong>Status:</strong> 200</p>
          <p><strong>Clientes encontrados:</strong> ${data.length}</p>
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
  
  async buscarTodosClientes() {
    if (state.loading) return;
    state.loading = true;
    
    try {
      ui.esconderErro();
      ui.mostrarLoading();
      
      const clientes = await api.getAllClients();
      const resultadoDiv = utils.getElement('resultado');
      resultadoDiv.innerHTML = utils.renderClients(clientes);
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        ui.mostrarErro('API não está online. Verifique se o servidor está rodando em localhost:3000');
      } else {
        ui.mostrarErro(`Erro ao buscar clientes: ${error.message}`);
      }
    } finally {
      state.loading = false;
    }
  },
  
  async buscarClientePorCpf() {
    if (state.loading) return;
    state.loading = true;
    
    const cpfInput = utils.getElement('cpf');
    const cpf = cpfInput.value.replace(/\D/g, '');
    
    if (!utils.validators.cpf(cpf)) {
      ui.mostrarErro('CPF inválido. Digite 11 números.');
      state.loading = false;
      return;
    }
    
    try {
      ui.esconderErro();
      ui.mostrarLoading();
      
      const cliente = await api.getClientByCPF(cpf);
      const resultadoDiv = utils.getElement('resultado');
      
      if (!cliente) {
        resultadoDiv.innerHTML = '<p>Cliente não encontrado com este CPF.</p>';
      } else {
        resultadoDiv.innerHTML = utils.clientTemplate(cliente);
      }
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        ui.mostrarErro('API não está online. Verifique se o servidor está rodando em localhost:3000');
      } else {
        ui.mostrarErro('Erro ao buscar cliente. Tente novamente mais tarde.');
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
          <h3>Cadastrar Novo Cliente</h3>
          <form id="form-cliente" data-tipo="cadastrar">
            ${forms.gerarCampos(dados)}
            <div class="form-group">
              <button type="submit" class="btn-salvar">Salvar Cliente</button>
              <button type="button" class="btn-cancelar" onclick="ui.limparResultado()">Cancelar</button>
            </div>
          </form>
        </div>
      `,
      atualizar: `
        <div class="cliente-card">
          <h3>Atualizar Cliente</h3>
          <form id="form-cliente" data-tipo="atualizar">
            ${forms.gerarCampos(dados, true)}
            <div class="form-group">
              <button type="submit" class="btn-salvar">Atualizar Cliente</button>
              <button type="button" class="btn-cancelar" onclick="ui.limparResultado()">Cancelar</button>
            </div>
          </form>
        </div>
      `,
      buscarParaAtualizar: `
        <div class="cliente-card">
          <h3>Atualizar Cliente</h3>
          <p>Digite o CPF do cliente que deseja atualizar:</p>
          <div class="form-group">
            <label for="cpf-busca">CPF *:</label>
            <input type="text" id="cpf-busca" maxlength="14" placeholder="Ex: 123.456.789-00" required>
            <button type="button" class="btn-salvar" onclick="forms.buscarParaAtualizar()">Buscar Cliente</button>
          </div>
          <button type="button" class="btn-cancelar" onclick="ui.limparResultado()">Cancelar</button>
        </div>
      `,
      buscarParaDeletar: `
        <div class="cliente-card">
          <h3>Deletar Cliente</h3>
          <p>Digite o CPF do cliente que deseja deletar:</p>
          <div class="form-group">
            <label for="cpf-busca">CPF *:</label>
            <input type="text" id="cpf-busca" maxlength="14" placeholder="Ex: 123.456.789-00" required>
            <button type="button" class="btn-salvar" onclick="forms.buscarParaDeletar()">Buscar Cliente</button>
          </div>
          <button type="button" class="btn-cancelar" onclick="ui.limparResultado()">Cancelar</button>
        </div>
      `,
      confirmarDeletar: (cliente, cpf) => `
        <div class="cliente-card">
          <h3>Confirmar Deleção</h3>
          <p>Tem certeza que deseja deletar o seguinte cliente?</p>
          ${utils.clientTemplate(cliente)}
          <div class="form-group">
            <button type="button" class="btn-deletar" onclick="forms.confirmarDeletar('${cpf}')">Deletar Cliente</button>
            <button type="button" class="btn-cancelar" onclick="ui.limparResultado()">Cancelar</button>
          </div>
        </div>
      `
    };
    
    const resultadoDiv = utils.getElement('resultado');
    resultadoDiv.innerHTML = templates[tipo];
    
    // Aplicar máscaras CPF
    if (tipo !== 'confirmarDeletar') {
      const cpfInputs = resultadoDiv.querySelectorAll('input[type="text"][id*="cpf"], input[id="cpf-busca"]');
      cpfInputs.forEach(input => utils.applyCPFField(input));
    }
    
    // Adicionar evento de submit
    const form = resultadoDiv.querySelector('#form-cliente');
    if (form) {
      form.addEventListener('submit', forms.handleSubmit);
    }
  },
  
  gerarCampos(dados = {}, readonly = false) {
    return `
      <div class="form-group">
        <label for="cpf">CPF *:</label>
        <input type="text" id="cpf" value="${utils.formatCPF(dados.cpf || '')}" ${readonly ? 'readonly' : ''} required>
      </div>
      <div class="form-group">
        <label for="nome">Nome Completo *:</label>
        <input type="text" id="nome" value="${dados.nome || ''}" required>
      </div>
      <div class="form-group">
        <label for="idade">Idade *:</label>
        <input type="number" id="idade" value="${dados.idade || ''}" min="1" max="120" required>
      </div>
      <div class="form-group">
        <label for="endereco">Endereço *:</label>
        <input type="text" id="endereco" value="${dados.endereco || ''}" required>
      </div>
      <div class="form-group">
        <label for="bairro">Bairro *:</label>
        <input type="text" id="bairro" value="${dados.bairro || ''}" required>
      </div>
      <div class="form-group">
        <label for="contato">Contato *:</label>
        <input type="text" id="contato" value="${dados.contato || ''}" required>
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
      cpf: parseInt(formData.get('cpf')?.replace(/\D/g, '') || 0),
      nome: formData.get('nome')?.trim(),
      idade: parseInt(formData.get('idade') || 0),
      endereco: formData.get('endereco')?.trim(),
      bairro: formData.get('bairro')?.trim(),
      contato: formData.get('contato')?.trim()
    };
    
    // Validações
    if (!utils.validators.cpf(dados.cpf)) {
      ui.mostrarErro('CPF inválido. Digite 11 números.');
      return;
    }
    
    if (!utils.validators.nome(dados.nome)) {
      ui.mostrarErro('Nome inválido. Digite pelo menos 3 caracteres.');
      return;
    }
    
    if (!utils.validators.idade(dados.idade)) {
      ui.mostrarErro('Idade inválida. Digite um valor entre 1 e 120.');
      return;
    }
    
    if (!utils.validators.endereco(dados.endereco)) {
      ui.mostrarErro('Endereço inválido. Digite pelo menos 5 caracteres.');
      return;
    }
    
    if (!utils.validators.bairro(dados.bairro)) {
      ui.mostrarErro('Bairro inválido. Digite pelo menos 3 caracteres.');
      return;
    }
    
    if (!utils.validators.contato(dados.contato)) {
      ui.mostrarErro('Contato inválido. Digite pelo menos 3 caracteres.');
      return;
    }
    
    state.loading = true;
    
    try {
      ui.esconderErro();
      ui.mostrarLoading();
      
      let resultado;
      if (tipo === 'cadastrar') {
        resultado = await api.createClient(dados);
        ui.mostrarSucesso('Cliente Cadastrado', resultado, 'cadastrar');
      } else if (tipo === 'atualizar') {
        resultado = await api.updateClient(dados.cpf, dados);
        ui.mostrarSucesso('Cliente Atualizado', resultado, 'atualizar');
      }
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        ui.mostrarErro('API não está online. Verifique se o servidor está rodando em localhost:3000');
      } else {
        ui.mostrarErro(`Erro ao ${tipo === 'cadastrar' ? 'cadastrar' : 'atualizar'} cliente: ${error.message}`);
      }
    } finally {
      state.loading = false;
    }
  },
  
  async buscarParaAtualizar() {
    const cpfInput = utils.getElement('cpf-busca');
    const cpf = cpfInput.value.replace(/\D/g, '');
    
    if (!utils.validators.cpf(cpf)) {
      ui.mostrarErro('CPF inválido. Digite 11 números.');
      return;
    }
    
    try {
      ui.esconderErro();
      ui.mostrarLoading();
      
      const cliente = await api.getClientByCPF(cpf);
      
      if (!cliente) {
        ui.mostrarErro('Cliente não encontrado com este CPF.');
      } else {
        forms.mostrarFormulario('atualizar', cliente);
      }
    } catch (error) {
      ui.mostrarErro('Erro ao buscar cliente. Tente novamente mais tarde.');
    }
  },
  
  async buscarParaDeletar() {
    const cpfInput = utils.getElement('cpf-busca');
    const cpf = cpfInput.value.replace(/\D/g, '');
    
    if (!utils.validators.cpf(cpf)) {
      ui.mostrarErro('CPF inválido. Digite 11 números.');
      return;
    }
    
    try {
      ui.esconderErro();
      ui.mostrarLoading();
      
      const cliente = await api.getClientByCPF(cpf);
      
      if (!cliente) {
        ui.mostrarErro('Cliente não encontrado com este CPF.');
      } else {
        forms.mostrarFormulario('confirmarDeletar', cliente, cpf);
      }
    } catch (error) {
      ui.mostrarErro('Erro ao buscar cliente. Tente novamente mais tarde.');
    }
  },
  
  async confirmarDeletar(cpf) {
    if (state.loading) return;
    state.loading = true;
    
    try {
      ui.esconderErro();
      ui.mostrarLoading();
      
      await api.deleteClient(cpf);
      
      const resultadoDiv = utils.getElement('resultado');
      resultadoDiv.innerHTML = `
        <div class="cliente-card">
          <h3>Cliente Deletado com Sucesso!</h3>
          <p>O cliente com CPF ${utils.formatCPF(cpf)} foi removido do sistema.</p>
          <button class="btn-salvar" onclick="handlers.buscarTodosClientes()">Ver Todos os Clientes</button>
        </div>
      `;
    } catch (error) {
      ui.mostrarErro(`Erro ao deletar cliente: ${error.message}`);
    } finally {
      state.loading = false;
    }
  },
  
  mostrarSucesso(titulo, cliente, acao) {
    const resultadoDiv = utils.getElement('resultado');
    resultadoDiv.innerHTML = `
      <div class="cliente-card">
        <h3>${titulo} com Sucesso!</h3>
        ${utils.clientTemplate(cliente)}
        <button class="btn-salvar" onclick="handlers.buscarTodosClientes()">Ver Todos os Clientes</button>
      </div>
    `;
  }
};

// Funções globais para compatibilidade
async function cadastrarCliente() {
  forms.mostrarFormulario('cadastrar');
}

async function atualizarCliente() {
  forms.mostrarFormulario('buscarParaAtualizar');
}

async function deletarCliente() {
  forms.mostrarFormulario('buscarParaDeletar');
}

// Export para uso global
window.handlers = handlers;
window.forms = forms;
window.utils = utils;
window.ui = ui;

// Exportar funções globais individualmente
window.cadastrarCliente = cadastrarCliente;
window.atualizarCliente = atualizarCliente;
window.deletarCliente = deletarCliente;
window.buscarTodosClientes = handlers.buscarTodosClientes;
window.buscarClientePorCpf = handlers.buscarClientePorCpf;
window.testarConexaoAPI = handlers.testarConexaoAPI;
window.limparResultado = ui.limparResultado;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
  // Aplicar máscara ao campo principal de CPF
  const cpfInput = utils.getElement('cpf');
  if (cpfInput) {
    utils.applyCPFField(cpfInput);
  }
});

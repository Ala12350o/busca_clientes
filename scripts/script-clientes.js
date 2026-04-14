// Script de Clientes - Versão Refatorada
if (typeof API_BASE_URL === 'undefined') {
  var API_BASE_URL = 'http://localhost:3000';
}

// Estado global
const state = {
  loading: false
};

// ============ FUNÇÕES UTILITÁRIAS ============
function formatarCPF(cpf) {
  return String(cpf).replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function validarCPF(cpf) {
  const numeros = String(cpf).replace(/\D/g, '');
  if (numeros.length !== 11) return false;
  
  const invalidos = ['00000000000', '11111111111', '22222222222', '33333333333',
    '44444444444', '55555555555', '66666666666', '77777777777',
    '88888888888', '99999999999'];
  
  if (invalidos.includes(numeros)) return false;
  return /^\d{11}$/.test(numeros);
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

async function criarCliente(dados) {
  const response = await fetch(`${API_BASE_URL}/clientes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });
  
  if (!response.ok) {
    if (response.status === 400 || response.status === 409) {
      throw new Error('CPF já cadastrado. Tente outro CPF.');
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Erro ao cadastrar cliente');
  }
  
  return response.json();
}

async function buscarCliente(cpf) {
  try {
    return await apiRequest(`/clientes/${cpf}`);
  } catch (error) {
    if (error.message.includes('404')) return null;
    throw error;
  }
}

async function listarClientes() {
  return apiRequest('/clientes');
}

async function deletarClienteAPI(cpf) {
  const response = await fetch(`${API_BASE_URL}/clientes/${cpf}`, {
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

async function atualizarCliente(cpf, dados) {
  const response = await fetch(`${API_BASE_URL}/clientes/${encodeURIComponent(cpf)}`, {
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
  const erroDiv = document.getElementById('erro');
  const resultadoDiv = document.getElementById('resultado');
  
  if (erroDiv) {
    erroDiv.textContent = mensagem;
    erroDiv.classList.remove('hidden');
  }
  if (resultadoDiv) resultadoDiv.innerHTML = '';
}

function esconderErro() {
  const erroDiv = document.getElementById('erro');
  if (erroDiv) erroDiv.classList.add('hidden');
}

function mostrarLoading() {
  const resultadoDiv = document.getElementById('resultado');
  if (resultadoDiv) {
    resultadoDiv.innerHTML = '<div class="loading">Carregando...</div>';
  }
}

function mostrarSucesso(dados) {
  const resultadoDiv = document.getElementById('resultado');
  resultadoDiv.innerHTML = `
    <div class="cliente-card">
      <h3>Cliente Cadastrado com Sucesso!</h3>
      <p><strong>CPF:</strong> ${formatarCPF(dados.cpf)}</p>
      <p><strong>Nome:</strong> ${dados.nome}</p>
      <p><strong>Idade:</strong> ${dados.idade} anos</p>
      <p><strong>Endereço:</strong> ${dados.endereco}</p>
      <p><strong>Bairro:</strong> ${dados.bairro}</p>
      <p><strong>Contato:</strong> ${dados.contato}</p>
      <button class="btn-salvar" onclick="buscarTodosClientes()">Ver Todos os Clientes</button>
    </div>
  `;
}

function templateCliente(cliente) {
  return `
    <div class="cliente-card">
      <button class="btn-delete-x" onclick="confirmarDeletarCliente('${cliente.cpf}')" title="Deletar Cliente">×</button>
      <h3>${cliente.nome}</h3>
      <p><strong>CPF:</strong> ${formatarCPF(cliente.cpf)}</p>
      <p><strong>Idade:</strong> ${cliente.idade} anos</p>
      <p><strong>Endereço:</strong> ${cliente.endereco}</p>
      <p><strong>Bairro:</strong> ${cliente.bairro}</p>
      <p><strong>Contato:</strong> ${cliente.contato}</p>
      <div class="card-actions">
        <button class="btn-editar" onclick="editarCliente('${cliente.cpf}')" title="Editar Cliente">✎ Editar</button>
      </div>
    </div>
  `;
}

// ============ FUNÇÕES PRINCIPAIS ============
async function buscarTodosClientes() {
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
    
    const todosClientes = await listarClientes();
    const clientes = todosClientes.filter(c => c.usuario_codigo === usuario.codigo);
    const resultadoDiv = document.getElementById('resultado');
    
    if (!clientes || clientes.length === 0) {
      resultadoDiv.innerHTML = '<p>Nenhum cliente encontrado para este usuário.</p>';
    } else {
      resultadoDiv.innerHTML = clientes.map(c => templateCliente(c)).join('');
    }
  } catch (error) {
    mostrarErro(error.name === 'TypeError' && error.message.includes('fetch') 
      ? 'API não está online. Verifique se o servidor está rodando em localhost:3000'
      : `Erro ao buscar clientes: ${error.message}`);
  } finally {
    state.loading = false;
  }
}

async function buscarClientePorCpf() {
  if (state.loading) return;
  state.loading = true;
  
  const cpfInput = document.getElementById('cpf');
  const cpf = cpfInput.value.replace(/\D/g, '');
  
  if (!validarCPF(cpf)) {
    mostrarErro('CPF inválido. Digite 11 números.');
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
    
    const cliente = await buscarCliente(cpf);
    const resultadoDiv = document.getElementById('resultado');
    
    if (!cliente) {
      resultadoDiv.innerHTML = '<p>Cliente não encontrado com este CPF.</p>';
    } else if (cliente.usuario_codigo != usuario.codigo) {
      resultadoDiv.innerHTML = '<p>Cliente não encontrado com este CPF.</p>';
    } else {
      resultadoDiv.innerHTML = templateCliente(cliente);
    }
  } catch (error) {
    mostrarErro(error.name === 'TypeError' && error.message.includes('fetch')
      ? 'API não está online. Verifique se o servidor está rodando em localhost:3000'
      : 'Erro ao buscar cliente. Tente novamente mais tarde.');
  } finally {
    state.loading = false;
  }
}

async function testarConexaoAPI() {
  try {
    esconderErro();
    const resultadoDiv = document.getElementById('resultado');
    resultadoDiv.innerHTML = '<div class="loading">Testando conexão...</div>';
    
    const data = await listarClientes();
    resultadoDiv.innerHTML = `
      <div class="cliente-card">
        <h3>Conexão OK!</h3>
        <p>API respondendo. ${data.length} clientes encontrados.</p>
      </div>
    `;
  } catch (error) {
    mostrarErro('Falha na conexão com API.');
  }
}

// ============ CADASTRO ============
async function cadastrarCliente() {
  const resultadoDiv = document.getElementById('resultado');
  esconderErro();
  
  resultadoDiv.innerHTML = `
    <div class="cliente-card">
      <h3>Cadastrar Novo Cliente</h3>
      <form id="form-cadastro">
        <div class="form-group">
          <label>CPF *:</label>
          <input type="text" id="input-cpf" maxlength="14" placeholder="123.456.789-00" required>
        </div>
        <div class="form-group">
          <label>Nome Completo *:</label>
          <input type="text" id="input-nome" required>
        </div>
        <div class="form-group">
          <label>Idade *:</label>
          <input type="number" id="input-idade" min="1" max="120" required>
        </div>
        <div class="form-group">
          <label>Endereço *:</label>
          <input type="text" id="input-endereco" required>
        </div>
        <div class="form-group">
          <label>Bairro *:</label>
          <input type="text" id="input-bairro" required>
        </div>
        <div class="form-group">
          <label>Contato *:</label>
          <input type="text" id="input-contato" required>
        </div>
        <button type="submit" class="btn-salvar">Salvar Cliente</button>
        <button type="button" class="btn-cancelar" onclick="limparResultado()">Cancelar</button>
      </form>
    </div>
  `;
  
  // Máscara de CPF
  const cpfInput = document.getElementById('input-cpf');
  cpfInput.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      value = value.replace(/(\d{3})(\d)/, '$1.$2')
                   .replace(/(\d{3})(\d)/, '$1.$2')
                   .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    e.target.value = value;
  });
  
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
      cpf: document.getElementById('input-cpf').value.replace(/\D/g, ''),
      nome: document.getElementById('input-nome').value.trim(),
      idade: parseInt(document.getElementById('input-idade').value),
      endereco: document.getElementById('input-endereco').value.trim(),
      bairro: document.getElementById('input-bairro').value.trim(),
      contato: document.getElementById('input-contato').value.trim(),
      usuario_codigo: usuario.codigo
    };
    
    // Validações
    if (!validarCPF(dados.cpf)) {
      mostrarErro('CPF inválido. Digite 11 números.');
      return;
    }
    
    if (dados.nome.length < 3) {
      mostrarErro('Nome inválido. Digite pelo menos 3 caracteres.');
      return;
    }
    
    if (!dados.idade || dados.idade < 1 || dados.idade > 120) {
      mostrarErro('Idade inválida. Digite um valor entre 1 e 120.');
      return;
    }
    
    if (dados.endereco.length < 5) {
      mostrarErro('Endereço inválido. Digite pelo menos 5 caracteres.');
      return;
    }
    
    if (dados.bairro.length < 3) {
      mostrarErro('Bairro inválido. Digite pelo menos 3 caracteres.');
      return;
    }
    
    if (dados.contato.length < 3) {
      mostrarErro('Contato inválido. Digite pelo menos 3 caracteres.');
      return;
    }
    
    state.loading = true;
    mostrarLoading();
    
    try {
      // Verificar se CPF já existe para este usuário antes de cadastrar
      const todosClientes = await listarClientes();
      const clienteExistente = todosClientes.find(c => c.cpf === dados.cpf && c.usuario_codigo === usuario.codigo);
      if (clienteExistente) {
        mostrarErro('Este CPF já foi cadastrado por este usuário. Tente outro CPF.');
        state.loading = false;
        return;
      }
      
      await criarCliente(dados);
      mostrarSucesso(dados);
    } catch (error) {
      mostrarErro(error.message);
    } finally {
      state.loading = false;
    }
  });
}

// ============ DELETAR ============
async function confirmarDeletarCliente(cpf) {
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
    
    const cliente = await buscarCliente(cpf);
    
    if (!cliente) {
      mostrarErro('Cliente não encontrado.');
      state.loading = false;
      return;
    }
    
    if (cliente.usuario_codigo != usuario.codigo) {
      mostrarErro('Você não tem permissão para deletar este cliente.');
      state.loading = false;
      return;
    }
    
    // Mostrar confirmação
    const resultadoDiv = document.getElementById('resultado');
    resultadoDiv.innerHTML = `
      <div class="cliente-card">
        <h3>Confirmar Deleção</h3>
        <p>Tem certeza que deseja deletar este cliente?</p>
        ${templateCliente(cliente)}
        <button class="btn-deletar" onclick="executarDeletar('${cpf}')">Sim, Deletar</button>
        <button class="btn-cancelar" onclick="buscarTodosClientes()">Cancelar</button>
      </div>
    `;
  } catch (error) {
    mostrarErro('Erro ao buscar cliente.');
  } finally {
    state.loading = false;
  }
}

async function deletarCliente() {
  const resultadoDiv = document.getElementById('resultado');
  esconderErro();
  
  resultadoDiv.innerHTML = `
    <div class="cliente-card">
      <h3>Deletar Cliente</h3>
      <p>Digite o CPF do cliente:</p>
      <div class="form-group">
        <input type="text" id="input-cpf-deletar" maxlength="14" placeholder="123.456.789-00">
      </div>
      <button class="btn-salvar" onclick="confirmarDeletar()">Buscar e Deletar</button>
      <button class="btn-cancelar" onclick="limparResultado()">Cancelar</button>
    </div>
  `;
  
  // Máscara de CPF
  const cpfInput = document.getElementById('input-cpf-deletar');
  cpfInput.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      value = value.replace(/(\d{3})(\d)/, '$1.$2')
                   .replace(/(\d{3})(\d)/, '$1.$2')
                   .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    e.target.value = value;
  });
  
  cpfInput.focus();
}

async function confirmarDeletar() {
  const cpf = document.getElementById('input-cpf-deletar').value.replace(/\D/g, '');
  
  if (!validarCPF(cpf)) {
    mostrarErro('CPF inválido. Digite 11 números.');
    return;
  }
  
  if (state.loading) return;
  state.loading = true;
  mostrarLoading();
  
  try {
    const cliente = await buscarCliente(cpf);
    
    if (!cliente) {
      mostrarErro('Cliente não encontrado com este CPF.');
      state.loading = false;
      return;
    }
    
    // Mostrar confirmação
    const resultadoDiv = document.getElementById('resultado');
    resultadoDiv.innerHTML = `
      <div class="cliente-card">
        <h3>Confirmar Deleção</h3>
        <p>Tem certeza que deseja deletar este cliente?</p>
        ${templateCliente(cliente)}
        <button class="btn-deletar" onclick="executarDeletar('${cpf}')">Sim, Deletar</button>
        <button class="btn-cancelar" onclick="deletarCliente()">Cancelar</button>
      </div>
    `;
  } catch (error) {
    mostrarErro('Erro ao buscar cliente.');
  } finally {
    state.loading = false;
  }
}

async function executarDeletar(cpf) {
  if (state.loading) return;
  state.loading = true;
  mostrarLoading();
  
  try {
    await deletarClienteAPI(cpf);
    
    const resultadoDiv = document.getElementById('resultado');
    resultadoDiv.innerHTML = `
      <div class="cliente-card">
        <h3>Cliente Deletado com Sucesso!</h3>
        <p>CPF ${formatarCPF(cpf)} removido.</p>
        <button class="btn-salvar" onclick="buscarTodosClientes()">Ver Todos</button>
      </div>
    `;
  } catch (error) {
    mostrarErro(`Erro ao deletar: ${error.message}`);
  } finally {
    state.loading = false;
  }
}

async function editarCliente(cpf) {
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
    
    const cliente = await buscarCliente(cpf);
    
    if (!cliente) {
      mostrarErro('Cliente não encontrado.');
      state.loading = false;
      return;
    }
    
    if (cliente.usuario_codigo != usuario.codigo) {
      mostrarErro('Você não tem permissão para editar este cliente.');
      state.loading = false;
      return;
    }
    
    const resultadoDiv = document.getElementById('resultado');
    resultadoDiv.innerHTML = `
      <div class="cliente-card">
        <h3>Editar Cliente</h3>
        <form id="form-edicao">
          <div class="form-group">
            <label>CPF:</label>
            <input type="text" value="${formatarCPF(cliente.cpf)}" disabled style="background-color: #e9ecef;">
          </div>
          <div class="form-group">
            <label>Nome Completo *:</label>
            <input type="text" id="edit-nome" value="${cliente.nome}" required>
          </div>
          <div class="form-group">
            <label>Idade *:</label>
            <input type="number" id="edit-idade" value="${cliente.idade}" min="1" max="120" required>
          </div>
          <div class="form-group">
            <label>Endereço *:</label>
            <input type="text" id="edit-endereco" value="${cliente.endereco}" required>
          </div>
          <div class="form-group">
            <label>Bairro *:</label>
            <input type="text" id="edit-bairro" value="${cliente.bairro}" required>
          </div>
          <div class="form-group">
            <label>Contato *:</label>
            <input type="text" id="edit-contato" value="${cliente.contato}" required>
          </div>
          <button type="submit" class="btn-salvar">Salvar Alterações</button>
          <button type="button" class="btn-cancelar" onclick="buscarTodosClientes()">Cancelar</button>
        </form>
      </div>
    `;
    
    document.getElementById('form-edicao').addEventListener('submit', async function(e) {
      e.preventDefault();
      if (state.loading) return;
      
      const dados = {
        nome: document.getElementById('edit-nome').value.trim(),
        idade: parseInt(document.getElementById('edit-idade').value),
        endereco: document.getElementById('edit-endereco').value.trim(),
        bairro: document.getElementById('edit-bairro').value.trim(),
        contato: document.getElementById('edit-contato').value.trim(),
        usuario_codigo: usuario.codigo
      };
      
      if (dados.nome.length < 3) {
        mostrarErro('Nome inválido. Digite pelo menos 3 caracteres.');
        return;
      }
      
      if (!dados.idade || dados.idade < 1 || dados.idade > 120) {
        mostrarErro('Idade inválida. Digite um valor entre 1 e 120.');
        return;
      }
      
      if (dados.endereco.length < 5) {
        mostrarErro('Endereço inválido. Digite pelo menos 5 caracteres.');
        return;
      }
      
      if (dados.bairro.length < 3) {
        mostrarErro('Bairro inválido. Digite pelo menos 3 caracteres.');
        return;
      }
      
      if (dados.contato.length < 3) {
        mostrarErro('Contato inválido. Digite pelo menos 3 caracteres.');
        return;
      }
      
      state.loading = true;
      mostrarLoading();
      
      try {
        await atualizarCliente(cpf, dados);
        resultadoDiv.innerHTML = `
          <div class="cliente-card">
            <h3>Cliente Atualizado com Sucesso!</h3>
            <p>CPF: ${formatarCPF(cpf)}</p>
            <button class="btn-salvar" onclick="buscarTodosClientes()">Ver Todos os Clientes</button>
          </div>
        `;
      } catch (error) {
        mostrarErro(`Erro ao atualizar: ${error.message}`);
      } finally {
        state.loading = false;
      }
    });
  } catch (error) {
    mostrarErro('Erro ao buscar cliente para edição.');
  } finally {
    state.loading = false;
  }
}

function limparResultado() {
  const resultadoDiv = document.getElementById('resultado');
  if (resultadoDiv) resultadoDiv.innerHTML = '';
  esconderErro();
}

// ============ INICIALIZAÇÃO ============
document.addEventListener('DOMContentLoaded', function() {
  // Máscara no campo de busca
  const cpfInput = document.getElementById('cpf');
  if (cpfInput) {
    cpfInput.addEventListener('input', function(e) {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length <= 11) {
        value = value.replace(/(\d{3})(\d)/, '$1.$2')
                     .replace(/(\d{3})(\d)/, '$1.$2')
                     .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      }
      e.target.value = value;
    });
  }
});

// ============ EXPORTAR FUNÇÕES GLOBAIS ============
window.cadastrarCliente = cadastrarCliente;
window.deletarCliente = deletarCliente;
window.buscarTodosClientes = buscarTodosClientes;
window.buscarClientePorCpf = buscarClientePorCpf;
window.testarConexaoAPI = testarConexaoAPI;
window.confirmarDeletar = confirmarDeletar;
window.confirmarDeletarCliente = confirmarDeletarCliente;
window.executarDeletar = executarDeletar;
window.limparResultado = limparResultado;
window.editarCliente = editarCliente;

console.log('script-clientes.js loaded, functions exported:', Object.keys(window).filter(k => ['cadastrarCliente', 'buscarTodosClientes', 'buscarClientePorCpf'].includes(k)));

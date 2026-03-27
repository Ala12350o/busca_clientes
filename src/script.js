const API_BASE_URL = 'http://localhost:3000';

// Função para testar a API
async function testarConexaoAPI() {
  const resultadoDiv = document.getElementById('resultado');
  
  try {
    esconderErro();
    resultadoDiv.innerHTML = '<div class="loading">Testando conexão com API...</div>';
    
    const response = await fetch(`${API_BASE_URL}/clientes`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors'
    });
    
    console.log('Teste de conexão - Status:', response.status);
    console.log('Teste de conexão - Headers:', response.headers);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Teste de conexão - Dados:', data);
    
    resultadoDiv.innerHTML = `
      <div class="cliente-card">
        <h3>✅ Teste de Conexão Bem-Sucedido!</h3>
        <p><strong>Status:</strong> ${response.status}</p>
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
    console.error('Teste de conexão falhou:', error);
    mostrarErro(`❌ Falha no teste de conexão: ${error.message}`);
  }
}

function formatarCPF(cpf) {
  // Converte para string e remove caracteres não numéricos
  const cpfStr = String(cpf).replace(/\D/g, '');
  
  // Formata como XXX.XXX.XXX-XX
  return cpfStr
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function mostrarErro(mensagem) {
  const erroDiv = document.getElementById('erro');
  const resultadoDiv = document.getElementById('resultado');
  
  erroDiv.textContent = mensagem;
  erroDiv.classList.remove('hidden');
  resultadoDiv.innerHTML = '';
}

function esconderErro() {
  const erroDiv = document.getElementById('erro');
  erroDiv.classList.add('hidden');
}

function mostrarLoading() {
  const resultadoDiv = document.getElementById('resultado');
  resultadoDiv.innerHTML = '<div class="loading">Carregando...</div>';
}

function renderizarCliente(cliente) {
  return `
    <div class="cliente-card">
      <h3>${cliente.nome}</h3>
      <p><strong>CPF:</strong> <span class="cpf">${formatarCPF(String(cliente.cpf))}</span></p>
      <p><strong>Idade:</strong> ${cliente.idade} anos</p>
      <p><strong>Endereço:</strong> ${cliente.endereco}</p>
      <p><strong>Bairro:</strong> ${cliente.bairro}</p>
      <p><strong>Contato:</strong> ${cliente.contato}</p>
    </div>
  `;
}

function renderizarTodosClientes(clientes) {
  if (clientes.length === 0) {
    return '<p>Nenhum cliente encontrado.</p>';
  }
  
  return clientes.map(cliente => renderizarCliente(cliente)).join('');
}

async function buscarTodosClientes() {
  const resultadoDiv = document.getElementById('resultado');
  
  try {
    esconderErro();
    mostrarLoading();
    
    console.log('Fazendo requisição para:', `${API_BASE_URL}/clientes`);
    
    const response = await fetch(`${API_BASE_URL}/clientes`);
    
    console.log('Status da resposta:', response.status);
    console.log('Response OK:', response.ok);
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
    }
    
    const clientes = await response.json();
    console.log('Clientes recebidos:', clientes);
    resultadoDiv.innerHTML = renderizarTodosClientes(clientes);
    
  } catch (error) {
    console.error('Erro completo ao buscar todos os clientes:', error);
    console.error('Tipo do erro:', error.name);
    console.error('Mensagem do erro:', error.message);
    
    if (error.name === 'TypeError' && (error.message.includes('fetch') || error.message.includes('Network'))) {
      mostrarErro('❌ API não está online. Verifique se o servidor está rodando em localhost:3000');
    } else if (error.name === 'SyntaxError') {
      mostrarErro('❌ Erro ao processar resposta da API. Verifique o formato dos dados.');
    } else {
      mostrarErro(`❌ Erro ao buscar clientes: ${error.message}`);
    }
  }
}

async function buscarClientePorCpf() {
  const cpfInput = document.getElementById('cpf');
  const resultadoDiv = document.getElementById('resultado');
  const cpf = cpfInput.value.replace(/\D/g, '');
  
  if (!cpf || cpf.length !== 11) {
    mostrarErro('❌ CPF inválido. Digite 11 números.');
    return;
  }
  
  try {
    esconderErro();
    mostrarLoading();
    
    const response = await fetch(`${API_BASE_URL}/clientes/${cpf}`);
    
    if (response.status === 404) {
      resultadoDiv.innerHTML = '<p>Cliente não encontrado com este CPF.</p>';
      return;
    }
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    const cliente = await response.json();
    resultadoDiv.innerHTML = renderizarCliente(cliente);
    
  } catch (error) {
    console.error('Erro ao buscar cliente por CPF:', error);
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      mostrarErro('❌ API não está online. Verifique se o servidor está rodando em localhost:3000');
    } else {
      mostrarErro('❌ Erro ao buscar cliente. Tente novamente mais tarde.');
    }
  }
}

document.getElementById('cpf').addEventListener('input', function(e) {
  let value = e.target.value.replace(/\D/g, '');
  
  if (value.length <= 11) {
    value = value.replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  
  e.target.value = value;
});
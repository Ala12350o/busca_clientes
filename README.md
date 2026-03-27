# � Sistema de Busca de Clientes

Este é um sistema web para buscar informações de clientes utilizando uma API REST. A aplicação permite buscar todos os clientes cadastrados ou buscar um cliente específico por CPF. Desenvolvido com HTML, CSS e JavaScript puro, sem bibliotecas externas.

---

## 🚀 Funcionalidades

- **Buscar Todos os Clientes**: Lista completa de todos os clientes cadastrados na API
- **Buscar por CPF**: Encontra um cliente específico utilizando seu CPF (único)
- **Validação de CPF**: Formatação automática e validação do campo CPF
- **Tratamento de Erros**: Mensagens amigáveis para API offline ou erros de conexão
- **Interface Responsiva**: Design moderno e adaptável para diferentes dispositivos

---

## 📋 Estrutura de Dados

Cada cliente possui os seguintes campos:
- **cpf** (único, não pode repetir)
- **nome**
- **idade** 
- **endereco**
- **bairro**
- **contato**

---

## 🌐 Tecnologias Utilizadas

- HTML5
- CSS3
- JavaScript ES6+
- API REST (localhost:3000)

---

## 🔧 Endpoints da API

A aplicação espera uma API rodando em `localhost:3000` com os seguintes endpoints:

### GET `/clientes`
Retorna todos os clientes cadastrados.

**Exemplo de resposta:**
```json
[
  {
    "cpf": "12345678901",
    "nome": "João Silva",
    "idade": 30,
    "endereco": "Rua das Flores, 123",
    "bairro": "Centro",
    "contato": "(11) 98765-4321"
  }
]
```

### GET `/clientes/{cpf}`
Retorna um cliente específico pelo CPF.

**Parâmetros:**
- `cpf`: CPF do cliente (apenas números)

**Exemplo de resposta:**
```json
{
  "cpf": "12345678901",
  "nome": "João Silva",
  "idade": 30,
  "endereco": "Rua das Flores, 123",
  "bairro": "Centro",
  "contato": "(11) 98765-4321"
}
```

---

## ⚠️ Importante

- A API precisa estar rodando em `localhost:3000` para a aplicação funcionar
- Se a API estiver offline, a aplicação exibirá uma mensagem de erro clara
- O CPF é tratado como identificador único na base de dados

---

## 🚀 Como Usar

1. Certifique-se de que a API está rodando em `localhost:3000`
2. Abra o arquivo `src/index.html` no navegador
3. Use o botão "Buscar Todos os Clientes" para ver todos os registros
4. Digite um CPF no formato `XXX.XXX.XXX-XX` para busca específica

---

## 🎨 Features da Interface

- Formatação automática de CPF durante a digitação
- Indicador de carregamento durante as requisições
- Cards elegantes para exibir informações dos clientes
- Mensagens de erro claras e informativas
- Design responsivo e moderno



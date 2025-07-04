# 📊 Jira Dashboard - Sistema Completo de Análise e Relatórios

Um dashboard profissional para visualização, filtro, análise e exportação de issues do Jira, desenvolvido com **Flask (Python)** no backend e **React** no frontend.

![Dashboard](https://img.shields.io/badge/Status-Prod%20Ready-brightgreen)
![Backend](https://img.shields.io/badge/Backend-Flask%20Python-blue)
![Frontend](https://img.shields.io/badge/Frontend-React%20Vite-61dafb)
![API](https://img.shields.io/badge/API-Jira%20REST-orange)

---

## 🎯 **Funcionalidades Principais**

### 📈 **Dashboard Interativo**
- **Estatísticas em tempo real**: Total de issues, issues recentes, resolvidas
- **Gráficos dinâmicos**: Distribuição por status, tipo, prioridade, responsável
- **Timeline visual**: Criação e resolução de issues nos últimos 30 dias
- **Métricas personalizadas**: Todas atualizadas conforme filtros aplicados

### 🔍 **Sistema de Filtros Avançados**
- **Filtro por projeto**: Selecione qualquer projeto do Jira
- **Filtro por versão/release**: Análise por versão específica
- **Filtros detalhados**: Status, tipo, prioridade, responsável, reporter
- **Filtros por data**: Criação entre datas específicas
- **Busca textual**: Pesquisa em chave, resumo, status e tipo

### 📋 **Planilha Interativa**
- **Visualização tabular**: Issues organizadas em tabela responsiva
- **Paginação inteligente**: Navegação eficiente entre páginas
- **Ordenação**: Por qualquer coluna da tabela
- **Dados em tempo real**: Sincronização automática com filtros

### 📤 **Exportação XLSX**
- **Exporta todos os dados filtrados**: Não apenas a página visível
- **Formato profissional**: Colunas bem organizadas com todos os campos
- **Nome automático**: Arquivo nomeado com projeto e data
- **Compatível com Excel**: Formato .xlsx padrão

### 🔄 **Sincronização com Jira**
- **API REST oficial**: Integração direta com Atlassian Jira
- **Autenticação segura**: Basic Auth com API Token
- **Dados atualizados**: Botão de sincronização manual
- **Fallback inteligente**: Dados de exemplo em caso de erro

---

## 🏗️ **Arquitetura do Sistema**

```
jira2-repo/
├── 🐍 jira-dashboard/          # Backend Flask (Python)
│   ├── src/
│   │   ├── routes/             # Rotas da API REST
│   │   │   ├── auth.py         # Autenticação
│   │   │   ├── jira_real.py    # Integração Jira
│   │   │   └── ...
│   │   ├── services/           # Lógica de negócio
│   │   │   └── jira_service.py # Serviço principal Jira
│   │   ├── models/             # Modelos de dados
│   │   └── main.py             # Aplicação principal
│   ├── requirements.txt        # Dependências Python
│   └── venv/                   # Ambiente virtual
│
├── ⚛️ jira-frontend/           # Frontend React
│   ├── src/
│   │   ├── components/         # Componentes UI (shadcn/ui)
│   │   ├── pages/             # Páginas da aplicação
│   │   ├── lib/               # Utilitários
│   │   └── App.jsx            # Componente principal
│   ├── package.json           # Dependências Node.js
│   └── dist/                  # Build de produção
│
├── 🚀 start_all.bat           # Script Windows
├── 🚀 start_all.sh            # Script Linux/macOS
└── 📖 README.md               # Este arquivo
```

---

## ⚡ **Instalação Rápida**

### 🔧 **Pré-requisitos**
- **Python 3.11+** (para backend)
- **Node.js 18+** (para frontend)
- **Conta no Jira** (com API Token)
- **Git** (para clone do repositório)

### 🚀 **Instalação Automática**

#### **Windows:**
```powershell
git clone <seu-repositorio>
cd jira2-repo
./start_all.bat
```

#### **Linux/macOS:**
```bash
git clone <seu-repositorio>
cd jira2-repo
chmod +x start_all.sh
./start_all.sh
```

### 📝 **Instalação Manual**

#### **1. Backend (Flask):**
```bash
cd jira-dashboard

# Criar ambiente virtual
python -m venv venv

# Ativar ambiente virtual
# Windows:
.\venv\Scripts\Activate.ps1
# Linux/macOS:
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Executar servidor
python src/main.py
```
✅ **Backend rodando em:** http://localhost:5000

#### **2. Frontend (React):**
```bash
cd jira-frontend

# Instalar dependências
npm install
# ou com pnpm:
npm install -g pnpm
pnpm install

# Executar servidor de desenvolvimento
npm run dev
# ou:
pnpm run dev
```
✅ **Frontend rodando em:** http://localhost:5173

---

## ⚙️ **Configuração do Jira**

### 🔑 **1. Obter API Token**
1. Acesse: https://id.atlassian.com/manage-profile/security/api-tokens
2. Clique em **"Create API token"**
3. Dê um nome (ex: "Dashboard Jira")
4. **Copie o token gerado** (você só verá uma vez!)

### 🔧 **2. Configurar Variáveis de Ambiente**
Edite o arquivo `jira-dashboard/src/routes/jira_real.py`:

```python
JIRA_CONFIG = {
    'base_url': 'https://sua-empresa.atlassian.net',  # Sua URL do Jira
    'email': 'seu.email@empresa.com',                 # Seu email
    'api_token': 'seu_api_token_aqui'                 # Token da etapa anterior
}
```

### 🔐 **3. Alternativa com Variáveis de Ambiente**
Crie um arquivo `.env` na pasta `jira-dashboard/`:

```env
JIRA_BASE_URL=https://sua-empresa.atlassian.net
JIRA_EMAIL=seu.email@empresa.com
JIRA_API_TOKEN=seu_api_token_aqui
```

---

## 🎮 **Como Usar**

### 🏠 **1. Acessando o Dashboard**
1. Abra http://localhost:5173
2. Faça login (usuário: `admin`, senha: `admin`)
3. Você verá a tela principal do dashboard

### 📊 **2. Selecionando Projeto**
1. No topo da tela, clique no dropdown **"Selecione um projeto"**
2. Escolha o projeto desejado
3. Todos os dados serão carregados automaticamente

### 🎛️ **3. Aplicando Filtros**
1. **Filtro rápido de versão**: Dropdown ao lado do projeto
2. **Filtros avançados**: Aba "Filtros" no topo
   - Status, tipo, prioridade
   - Responsável, reporter
   - Datas de criação
   - Busca textual

### 📈 **4. Navegando pelas Abas**
- **📊 Dashboard**: Visão geral com gráficos e estatísticas
- **📋 Planilha**: Tabela detalhada das issues
- **🔍 Filtros**: Configuração avançada de filtros

### 📤 **5. Exportando Dados**
1. Configure os filtros desejados
2. Clique no botão **"📥 Exportar XLSX"**
3. O arquivo será baixado com todas as issues filtradas

### 🔄 **6. Sincronizando Dados**
- Clique no botão **"🔄 Sincronizar"** para atualizar com dados do Jira
- A sincronização respeita todos os filtros ativos

---

## 🛠️ **Tecnologias Utilizadas**

### 🐍 **Backend**
- **Flask 2.3+**: Framework web minimalista
- **Flask-CORS**: Habilitação de CORS para frontend
- **Requests**: Cliente HTTP para API do Jira
- **Base64**: Autenticação Basic Auth
- **JSON**: Manipulação de dados

### ⚛️ **Frontend**
- **React 18**: Library de interface
- **Vite**: Build tool moderna e rápida
- **shadcn/ui**: Componentes UI profissionais
- **Tailwind CSS**: Framework CSS utilitário
- **Lucide React**: Ícones modernos
- **XLSX**: Exportação para Excel

### 🔗 **Integração**
- **Jira REST API v3**: API oficial da Atlassian
- **Fetch API**: Cliente HTTP nativo
- **JSON**: Formato de dados padrão

---

## 🚨 **Solução de Problemas**

### ❌ **Backend não inicia**
```bash
# Verifique se está no ambiente virtual
source venv/bin/activate  # Linux/macOS
.\venv\Scripts\Activate.ps1  # Windows

# Reinstale dependências
pip install -r requirements.txt

# Execute novamente
python src/main.py
```

### ❌ **Frontend não carrega**
```bash
# Limpe cache e reinstale
rm -rf node_modules package-lock.json  # Linux/macOS
rmdir /s node_modules & del package-lock.json  # Windows

npm install
npm run dev
```

### ❌ **Erro de conexão com Jira**
1. ✅ Verifique a URL do Jira
2. ✅ Confirme o email e API token
3. ✅ Teste acesso manual ao Jira
4. ✅ Verifique permissões do usuário

### ❌ **Exportação XLSX vazia**
- ✅ Verifique se há dados na tabela
- ✅ Remova filtros muito restritivos
- ✅ Teste sem filtros primeiro
- ✅ Veja logs do backend para erros

### ❌ **Filtros não funcionam**
- ✅ Clique em "Limpar Filtros" e teste novamente
- ✅ Recarregue a página (F5)
- ✅ Verifique se o projeto está selecionado

---

## 📋 **Funcionalidades Detalhadas**

### 🎯 **Sistema de Autenticação**
- Login simples com usuário/senha
- Sessão armazenada no localStorage
- Redirecionamento automático

### 📊 **Dashboard Analytics**
- **Cards de métricas**: Total, recentes, resolvidas
- **Gráfico de pizza**: Distribuição por status
- **Gráfico de barras**: Tipos de issue
- **Timeline**: Criação vs resolução

### 🔍 **Filtros Inteligentes**
- **Filtros dinâmicos**: Opções carregadas do Jira
- **Combinação múltipla**: Vários filtros simultâneos
- **Persistência**: Filtros mantidos durante navegação
- **Reset inteligente**: Limpeza seletiva

### 📋 **Tabela Avançada**
- **Paginação**: 50 items por página
- **Colunas fixas**: Chave, resumo, status, etc.
- **Responsividade**: Adaptação a diferentes telas
- **Performance**: Virtualização para grandes volumes

### 📤 **Exportação Robusta**
- **Todos os dados**: Não apenas página atual
- **Filtros aplicados**: Respeita seleções ativas
- **Formatação**: Colunas bem organizadas
- **Nomenclatura**: Arquivo com projeto e data

---

## 🤝 **Contribuindo**

1. **Fork** o repositório
2. **Clone** seu fork: `git clone <seu-fork>`
3. **Crie uma branch**: `git checkout -b feature/nova-funcionalidade`
4. **Commit** suas mudanças: `git commit -m "Add nova funcionalidade"`
5. **Push** para a branch: `git push origin feature/nova-funcionalidade`
6. **Abra um Pull Request**

---

## 📞 **Suporte**

- 🐛 **Bugs**: Abra uma issue no GitHub
- 💡 **Sugestões**: Use as Discussions do GitHub
- 📧 **Contato direto**: Entre em contato com a equipe
- 📖 **Documentação**: Este README contém tudo que você precisa

---

## 📄 **Licença**

Este projeto está sob licença **MIT**. Veja o arquivo `LICENSE` para mais detalhes.

---

## 🎉 **Créditos**

Desenvolvido com ❤️ pela equipe de desenvolvimento.

**Tecnologias que tornaram isso possível:**
- [Flask](https://flask.palletsprojects.com/) - Framework web Python
- [React](https://reactjs.org/) - Library JavaScript
- [Vite](https://vitejs.dev/) - Build tool moderna
- [shadcn/ui](https://ui.shadcn.com/) - Componentes UI
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [Jira REST API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/) - API oficial

---

**🚀 Pronto para usar! Qualquer dúvida, consulte este README ou abra uma issue.** 
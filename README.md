# Jira Dashboard

Dashboard completo para visualização, filtro e análise de issues do Jira, com backend em Flask e frontend em React.

## Estrutura do Projeto

```
Jira_GIT/
├── jira-dashboard/   # Backend Flask
├── jira-frontend/    # Frontend React
```

---

## 1. Backend (Flask)

### Pré-requisitos
- Python 3.11+
- pip

### Instalação e Execução

```bash
cd jira-dashboard
python -m venv venv
# Ative o ambiente virtual:
# Windows:
.\venv\Scripts\Activate.ps1
# Linux/macOS:
source venv/bin/activate
pip install -r requirements.txt
python src/main.py
```
O backend estará disponível em http://localhost:5000

---

## 2. Frontend (React)

### Pré-requisitos
- Node.js 18+
- pnpm (ou npm)

### Instalação e Execução

```bash
cd jira-frontend
# Instale o pnpm se não tiver:
npm install -g pnpm
pnpm install
pnpm run dev
```
O frontend estará disponível em http://localhost:5173

---

## 3. Uso

- Selecione um projeto no topo da tela.
- (Opcional) Selecione uma versão ao lado do projeto.
- Use a aba "Filtros" para refinar por status, tipo, prioridade, responsável, reporter, datas, etc.
- Todos os cards, gráficos, timeline e tabela refletem os filtros ativos.
- Clique em "Sincronizar" para atualizar os dados do Jira.

---

## 4. Dicas e Troubleshooting

- **Erro de permissão no frontend:** Feche o editor/terminal, apague `node_modules`, `pnpm-lock.yaml` e rode `pnpm install` novamente.
- **Erro de Select Radix:** Nunca use `<SelectItem value="">` fora do placeholder. O código já está protegido contra isso.
- **Backend não inicia:** Certifique-se de ativar o venv e rodar `python src/main.py` na pasta `jira-dashboard`.
- **API não responde:** Verifique se o backend está rodando em http://localhost:5000 e se o frontend está configurado para consumir desse endereço.
- **Filtros não refletem:** Todos os filtros ativos afetam todos os dados do dashboard. Se não refletir, recarregue a página.

---

## 5. Estrutura dos diretórios principais

- `jira-dashboard/src/` - Código do backend Flask
- `jira-frontend/src/` - Código do frontend React

---

## 6. Contato

Dúvidas ou sugestões? Abra uma issue ou entre em contato com o responsável pelo projeto. 
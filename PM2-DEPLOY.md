# 🚀 Deploy com PM2 - Jira Dashboard

O PM2 garante que sua aplicação rode de forma estável, com restart automático e monitoramento.

## 📋 Pré-requisitos

- Node.js instalado
- Python3 instalado
- Acesso SSH à EC2

## 🎯 Deploy Rápido

### 1. Conectar na EC2
```bash
ssh -i sua-chave.pem ubuntu@SEU_IP_EC2
```

### 2. Ir para o diretório do projeto
```bash
cd /caminho/para/jira2-repo
```

### 3. Fazer pull das últimas mudanças
```bash
git pull origin main
```

### 4. Executar deploy completo
```bash
chmod +x deploy-pm2.sh pm2-control.sh
./deploy-pm2.sh
```

## 🎛️ Controle das Aplicações

### Script de Controle Simples
```bash
# Ver status
./pm2-control.sh status

# Iniciar aplicações
./pm2-control.sh start

# Parar aplicações
./pm2-control.sh stop

# Reiniciar aplicações
./pm2-control.sh restart

# Ver logs em tempo real
./pm2-control.sh logs

# Deploy completo
./pm2-control.sh deploy
```

### Comandos PM2 Diretos
```bash
# Ver status
pm2 status

# Ver logs
pm2 logs

# Reiniciar aplicação específica
pm2 restart jira-backend
pm2 restart jira-frontend

# Parar todas
pm2 stop all

# Deletar todas
pm2 delete all
```

## 📁 Estrutura de Logs

```
logs/
├── backend-error.log     # Erros do backend
├── backend-out.log       # Output do backend
├── backend-combined.log  # Todos os logs do backend
├── frontend-error.log    # Erros do frontend
├── frontend-out.log      # Output do frontend
└── frontend-combined.log # Todos os logs do frontend
```

## 🔧 Configuração Personalizada

### Alterar Credenciais
Edite o arquivo `ecosystem.config.js`:
```javascript
env: {
  LOGIN_USERNAME: 'seu_usuario',
  LOGIN_PASSWORD: 'sua_senha',
  SECRET_KEY: 'sua_chave_secreta'
}
```

### Alterar Portas
- Backend: Edite `jira-dashboard/src/main.py` linha final
- Frontend: Edite `ecosystem.config.js` na seção do frontend

## 🛡️ Benefícios do PM2

✅ **Restart Automático** - Se a aplicação falhar, reinicia sozinha
✅ **Monitoramento** - CPU, memória, uptime
✅ **Logs Organizados** - Separados por aplicação
✅ **Startup Automático** - Inicia com o sistema
✅ **Zero Downtime** - Reinicialização sem interrupção

## 🆘 Solução de Problemas

### Aplicação não inicia
```bash
# Ver logs de erro
pm2 logs jira-backend --err
pm2 logs jira-frontend --err

# Verificar configuração
pm2 show jira-backend
```

### Frontend não carrega
```bash
# Verificar se o build foi feito
ls -la jira-frontend/dist/

# Recriar build
cd jira-frontend && npm run build
```

### Backend com erro
```bash
# Verificar ambiente virtual
source jira-dashboard/venv/bin/activate
pip list

# Verificar variáveis de ambiente
pm2 show jira-backend
```

## 🔄 Atualizações

Para atualizar a aplicação:
```bash
git pull origin main
./pm2-control.sh deploy
```

## 📊 Monitoramento

### PM2 Monitor (Interface Web)
```bash
# Instalar monitor
pm2 install pm2-server-monit

# Acessar: http://SEU_IP:9615
```

### Comandos de Monitoramento
```bash
# CPU e Memória em tempo real
pm2 monit

# Informações detalhadas
pm2 info jira-backend
pm2 info jira-frontend
``` 
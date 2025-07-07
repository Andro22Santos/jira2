#!/bin/bash

echo "🚀 Deploy Jira Dashboard com PM2"
echo "=================================="

# Obtém o IP público da EC2 automaticamente
EC2_PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null)

if [ -n "$EC2_PUBLIC_IP" ]; then
    export VITE_API_URL="http://$EC2_PUBLIC_IP:5001/api"
    echo "🌐 IP da EC2 detectado: $EC2_PUBLIC_IP"
else
    export VITE_API_URL="http://localhost:5001/api"
    echo "⚠️  IP não detectado, usando localhost"
fi

# 1. Instalar PM2 globalmente se não estiver instalado
echo "📦 Verificando PM2..."
if ! command -v pm2 &> /dev/null; then
    echo "Instalando PM2..."
    npm install -g pm2
else
    echo "PM2 já está instalado"
fi

# 2. Criar diretório de logs
echo "📁 Criando diretório de logs..."
mkdir -p logs

# 3. Parar processos anteriores se existirem
echo "🛑 Parando processos anteriores..."
pm2 stop jira-backend jira-frontend 2>/dev/null || true
pm2 delete jira-backend jira-frontend 2>/dev/null || true

# 4. Preparar backend
echo "🔧 Preparando backend..."
cd jira-dashboard || exit 1

# Ativar ambiente virtual
if [ ! -d "venv" ]; then
    echo "Criando ambiente virtual..."
    python3 -m venv venv
fi

source venv/bin/activate

# Instalar dependências do backend
pip install -r requirements.txt

cd ../

# 5. Preparar frontend
echo "🎨 Preparando frontend..."
cd jira-frontend || exit 1

# Instalar dependências do frontend
npm install --legacy-peer-deps

# Fazer build do frontend
echo "🔨 Fazendo build do frontend com API_URL: $VITE_API_URL"
npm run build

# Instalar serve globalmente se não estiver instalado
if ! command -v serve &> /dev/null; then
    echo "Instalando serve..."
    npm install -g serve
fi

cd ../

# 6. Iniciar aplicações com PM2
echo "🚀 Iniciando aplicações com PM2..."
pm2 start ecosystem.config.js

# 7. Salvar configuração PM2 para reinicialização automática
pm2 save
pm2 startup

echo ""
echo "✅ Deploy concluído!"
echo "==================="
echo "📱 Frontend: http://$EC2_PUBLIC_IP:3001"
echo "🔧 Backend:  http://$EC2_PUBLIC_IP:5001"
echo ""
echo "📋 Comandos úteis:"
echo "pm2 status           - Ver status das aplicações"
echo "pm2 logs             - Ver logs em tempo real"
echo "pm2 restart all      - Reiniciar todas as aplicações"
echo "pm2 stop all         - Parar todas as aplicações"
echo "pm2 delete all       - Remover todas as aplicações"
echo ""
echo "📁 Logs salvos em: ./logs/" 
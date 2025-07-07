#!/bin/bash

echo "🚀 Iniciando deploy do Jira Dashboard com PM2..."

# Detectar IP da EC2 automaticamente
if command -v curl >/dev/null 2>&1; then
    PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null)
fi

if [ -z "$PUBLIC_IP" ]; then
    PUBLIC_IP=$(hostname -I | awk '{print $1}' 2>/dev/null)
fi

if [ -z "$PUBLIC_IP" ]; then
    echo "❌ Não foi possível detectar o IP automaticamente"
    echo "💡 Execute: export VITE_API_URL='http://SEU_IP:5001/api' antes de rodar este script"
    exit 1
fi

echo "🌐 IP detectado: $PUBLIC_IP"
echo "🔗 Frontend será acessível em: http://$PUBLIC_IP:3001"
echo "🔗 Backend será acessível em: http://$PUBLIC_IP:5001"

# Parar aplicações existentes (se houver)
echo "⏹️ Parando aplicações existentes..."
pm2 stop jira-dashboard-backend jira-dashboard-frontend 2>/dev/null || true
pm2 delete jira-dashboard-backend jira-dashboard-frontend 2>/dev/null || true

# Criar diretório de logs
mkdir -p logs

# Instalar dependências do backend
echo "📦 Instalando dependências do backend..."
cd jira-dashboard
pip3 install -r requirements.txt --quiet
cd ..

# Configurar e buildar frontend com URL da API correta
echo "🎨 Buildando frontend com API_URL: http://$PUBLIC_IP:5001/api"
export VITE_API_URL="http://$PUBLIC_IP:5001/api"
cd jira-frontend
npm install --silent
npm run build
cd ..

# Instalar serve globalmente se não estiver instalado
if ! command -v serve >/dev/null 2>&1; then
    echo "📦 Instalando serve..."
    npm install -g serve
fi

# Iniciar aplicações com PM2
echo "🚀 Iniciando aplicações com PM2..."
pm2 start ecosystem.config.js

# Aguardar um pouco para as aplicações iniciarem
sleep 3

# Mostrar status
echo ""
echo "📊 Status das aplicações:"
pm2 status

echo ""
echo "✅ Deploy concluído!"
echo "🌐 Acesse o dashboard em: http://$PUBLIC_IP:3001"
echo "🔧 Backend disponível em: http://$PUBLIC_IP:5001"
echo ""
echo "📝 Para monitorar:"
echo "   pm2 logs jira-dashboard-backend"
echo "   pm2 logs jira-dashboard-frontend"
echo ""
echo "🛠️ Para controlar:"
echo "   ./pm2-control.sh status"
echo "   ./pm2-control.sh restart all" 
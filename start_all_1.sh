#!/bin/bash

# Obtém o IP público da EC2 automaticamente
EC2_PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null)

# Se conseguir obter o IP, usa ele, senão usa localhost
if [ -n "$EC2_PUBLIC_IP" ]; then
    export VITE_API_URL="http://$EC2_PUBLIC_IP:5001/api"
    echo "🌐 Configurando API URL: http://$EC2_PUBLIC_IP:5001/api"
else
    export VITE_API_URL="http://localhost:5001/api"
    echo "⚠️  IP público não detectado, usando localhost"
fi

# Configurações de produção para reduzir logs
export FLASK_ENV=production

# Ativa o ambiente virtual do backend
cd jira-dashboard || exit 1
source venv/bin/activate

# Inicia o backend Flask em background (porta 5001)
cd src || exit 1
nohup python3 main.py > ../../backend.log 2>&1 &

# Volta para a raiz do frontend
cd ../../jira-frontend || exit 1

# Instala dependências do frontend
npm install --legacy-peer-deps

# Faz o build do frontend com a variável de ambiente definida
echo "🔨 Fazendo build do frontend com API_URL: $VITE_API_URL"
npm run build

# Sobe o frontend em modo produção usando npx serve (porta 3001)
echo "🚀 Iniciando frontend na porta 3001"
npx serve -s dist -l 3001 > ../frontend.log 2>&1 &

echo "✅ Aplicação iniciada!"
echo "📱 Frontend: http://localhost:3001 (ou http://$EC2_PUBLIC_IP:3001)"
echo "🔧 Backend: http://localhost:5001 (ou http://$EC2_PUBLIC_IP:5001)"
echo "📋 Logs: backend.log e frontend.log"
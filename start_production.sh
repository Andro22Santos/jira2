#!/bin/bash

# CONFIGURAÇÃO MANUAL - SUBSTITUA COM O IP PÚBLICO DA SUA EC2
EC2_IP="SEU_IP_AQUI"  # Exemplo: "18.118.123.45"

# Se não definiu o IP, tenta detectar automaticamente
if [ "$EC2_IP" = "SEU_IP_AQUI" ]; then
    echo "⚠️  Detectando IP automaticamente..."
    EC2_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null)
    
    if [ -z "$EC2_IP" ]; then
        echo "❌ Não foi possível detectar o IP. Edite o script e defina o EC2_IP manualmente."
        exit 1
    fi
fi

# Define a URL da API
export VITE_API_URL="http://$EC2_IP:5001/api"
echo "🌐 Configurando API URL: $VITE_API_URL"

# Para o frontend acessar de qualquer IP
export HOST=0.0.0.0

# Ativa o ambiente virtual do backend
cd jira-dashboard || exit 1
source venv/bin/activate

# Mata processos anteriores se existirem
pkill -f "python3 main.py" 2>/dev/null
pkill -f "serve -s dist" 2>/dev/null

# Inicia o backend Flask em background (porta 5001)
cd src || exit 1
echo "🔧 Iniciando backend na porta 5001..."
nohup python3 main.py > ../../backend.log 2>&1 &
BACKEND_PID=$!

# Volta para a raiz do frontend
cd ../../jira-frontend || exit 1

# Instala dependências do frontend
echo "📦 Instalando dependências do frontend..."
npm install --legacy-peer-deps

# Faz o build do frontend com a variável de ambiente definida
echo "🔨 Fazendo build do frontend com API_URL: $VITE_API_URL"
npm run build

# Sobe o frontend em modo produção usando npx serve (porta 3001)
echo "🚀 Iniciando frontend na porta 3001..."
npx serve -s dist -l 3001 -H 0.0.0.0 > ../frontend.log 2>&1 &
FRONTEND_PID=$!

echo ""
echo "✅ Aplicação iniciada com sucesso!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 Frontend: http://$EC2_IP:3001"
echo "🔧 Backend:  http://$EC2_IP:5001"
echo "📋 Logs:     backend.log e frontend.log"
echo "🔑 PIDs:     Backend=$BACKEND_PID, Frontend=$FRONTEND_PID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Para parar a aplicação:"
echo "kill $BACKEND_PID $FRONTEND_PID" 
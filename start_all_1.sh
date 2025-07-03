#!/bin/bash

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

# Faz o build do frontend
npm run build

# Sobe o frontend em modo produção usando npx serve (porta 3001)
npx serve -s dist -l 3001 > ../frontend.log 2>&1 &
@echo off
REM Ativa o ambiente virtual do backend e inicia o backend em um novo terminal
cd jira-dashboard
call venv\Scripts\activate.bat
cd src
start "Backend" cmd /k python main.py
cd ..\..\jira-frontend

REM Faz o build do frontend
call npm run build

REM Instala o 'serve' globalmente se não estiver instalado
where serve >nul 2>nul
if %errorlevel% neq 0 npm install -g serve

REM Inicia o frontend em modo produção (porta 3000 por padrão)
start "Frontend" cmd /k serve -s dist
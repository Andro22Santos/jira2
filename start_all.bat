@echo off
REM Ativa o ambiente virtual do backend e inicia o backend em um novo terminal
cd jira-dashboard
call venv\Scripts\activate.bat
cd src
start "Backend" cmd /k python main.py
cd ..\..\jira-frontend
REM Inicia o frontend (Vite) no terminal atual
npm run dev 
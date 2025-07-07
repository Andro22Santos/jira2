#!/bin/bash

show_help() {
    echo "🎛️  Controle PM2 - Jira Dashboard"
    echo "================================"
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos disponíveis:"
    echo "  start     - Iniciar aplicações"
    echo "  stop      - Parar aplicações"
    echo "  restart   - Reiniciar aplicações"
    echo "  status    - Ver status"
    echo "  logs      - Ver logs em tempo real"
    echo "  deploy    - Deploy completo"
    echo "  help      - Mostrar esta ajuda"
    echo ""
}

case "$1" in
    start)
        echo "🚀 Iniciando aplicações Jira Dashboard..."
        pm2 start ecosystem.config.js
        pm2 status
        ;;
    stop)
        echo "🛑 Parando aplicações Jira Dashboard..."
        pm2 stop jira-dashboard-backend jira-dashboard-frontend
        pm2 status
        ;;
    restart)
        echo "🔄 Reiniciando aplicações Jira Dashboard..."
        pm2 restart jira-dashboard-backend jira-dashboard-frontend
        pm2 status
        ;;
    status)
        pm2 status
        echo ""
        echo "📋 Logs Jira Dashboard disponíveis em ./logs/"
        ;;
    logs)
        echo "📋 Logs Jira Dashboard em tempo real (Ctrl+C para sair):"
        pm2 logs jira-dashboard-backend jira-dashboard-frontend
        ;;
    deploy)
        echo "🚀 Executando deploy completo..."
        ./deploy-pm2.sh
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "❌ Comando inválido: $1"
        echo ""
        show_help
        exit 1
        ;;
esac 
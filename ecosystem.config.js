module.exports = {
  apps: [
    {
      name: 'jira-dashboard-backend',
      script: 'jira-dashboard/src/main.py',
      interpreter: 'python3',
      cwd: './jira-dashboard',
      env: {
        FLASK_ENV: 'production',
        FLASK_HOST: '0.0.0.0',
        FLASK_PORT: '5001',
        LOGIN_USERNAME: 'admin',
        LOGIN_PASSWORD: 'Jira@2025',
        SECRET_KEY: 'asdf#FGSgvasgf$5$WGT'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/jira-backend-error.log',
      out_file: './logs/jira-backend-out.log',
      log_file: './logs/jira-backend-combined.log',
      time: true
    },
    {
      name: 'jira-dashboard-frontend',
      script: 'serve',
      args: '-s dist -l 3001 -H 0.0.0.0',
      cwd: './jira-frontend',
      env: {
        NODE_ENV: 'production'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      error_file: './logs/jira-frontend-error.log',
      out_file: './logs/jira-frontend-out.log',
      log_file: './logs/jira-frontend-combined.log',
      time: true
    }
  ]
} 
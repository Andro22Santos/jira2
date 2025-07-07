module.exports = {
  apps: [
    {
      name: 'jira-backend',
      script: 'jira-dashboard/src/main.py',
      interpreter: 'python3',
      cwd: './jira-dashboard',
      env: {
        FLASK_ENV: 'production',
        LOGIN_USERNAME: 'admin',
        LOGIN_PASSWORD: 'Jira@2025',
        SECRET_KEY: 'asdf#FGSgvasgf$5$WGT'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    },
    {
      name: 'jira-frontend',
      script: 'serve',
      args: '-s dist -l 3001 -H 0.0.0.0',
      cwd: './jira-frontend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true
    }
  ]
} 
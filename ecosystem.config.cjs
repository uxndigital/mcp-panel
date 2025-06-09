module.exports = {
  apps: [
    {
      name: 'mcp-api-server',
      script: 'dist/api-server/src/index.js',
      cwd: './api-server',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 9906
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 9906
      },
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      error_file: './logs/api-server-error.log',
      out_file: './logs/api-server-out.log',
      log_file: './logs/api-server-combined.log',
      time: true
    },
    {
      name: 'mcp-web-app',
      script: 'npx',
      args: 'vite preview --port 9905 --host',
      cwd: './web-app',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      },
      env_development: {
        NODE_ENV: 'development'
      },
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      error_file: './logs/web-app-error.log',
      out_file: './logs/web-app-out.log',
      log_file: './logs/web-app-combined.log',
      time: true
    }
  ]
}; 
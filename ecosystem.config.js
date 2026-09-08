module.exports = {
  apps: [
    {
      name: 'yalfal-webapp',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'yalfal-tg-bot',
      script: 'node_modules/ts-node/dist/bin.js',
      args: '--transpile-only scripts/bot-worker.ts',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};

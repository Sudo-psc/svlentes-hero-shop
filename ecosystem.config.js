module.exports = {
    apps: [
        {
            name: 'svlentes-next',
            script: '.next/standalone/server.js',
            cwd: '/var/www/svlentes-hero-shop/shared/current',
            exec_mode: 'cluster',
            instances: 'max',
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'production',
                PORT: 5000,
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 5000,
            },
            env_staging: {
                NODE_ENV: 'staging',
                PORT: 5000,
            },
            watch: false,
            autorestart: true,
            out_file: '/var/www/svlentes-hero-shop/shared/logs/pm2-out.log',
            error_file: '/var/www/svlentes-hero-shop/shared/logs/pm2-error.log',
            combine_logs: true,
            kill_timeout: 5000,
            listen_timeout: 10000,
            node_args: '--enable-source-maps',
        },
    ],
};

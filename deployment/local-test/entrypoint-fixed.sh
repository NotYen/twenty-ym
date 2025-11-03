#!/bin/sh
set -e

# ==========================================
# 運行時注入前端環境變數（安全版本）
# ==========================================
inject_frontend_env() {
    echo "Injecting runtime environment variables into index.html..."
    
    # 使用 SERVER_URL 或默認值
    FRONTEND_SERVER_URL="${SERVER_URL:-http://localhost:3000}"
    
    # 只替換 window._env_ 的內容，不刪除其他 script
    sed -i 's|"REACT_APP_SERVER_BASE_URL": "[^"]*"|"REACT_APP_SERVER_BASE_URL": "'"${FRONTEND_SERVER_URL}"'"|g' \
        /app/packages/twenty-server/dist/front/index.html
    
    echo "✅ Frontend environment variables injected: ${FRONTEND_SERVER_URL}"
}

setup_and_migrate_db() {
    if [ "${DISABLE_DB_MIGRATIONS}" = "true" ]; then
        echo "Database setup and migrations are disabled, skipping..."
        return
    fi

    echo "Running database setup and migrations..."

    # Run setup and migration scripts
    has_schema=$(psql -tAc "SELECT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'core')" ${PG_DATABASE_URL})
    if [ "$has_schema" = "f" ]; then
        echo "Database appears to be empty, running migrations."
        NODE_OPTIONS="--max-old-space-size=1500" tsx ./scripts/setup-db.ts
        yarn database:migrate:prod
    fi

    yarn command:prod upgrade
    echo "Successfully migrated DB!"
}

register_background_jobs() {
    if [ "${DISABLE_CRON_JOBS_REGISTRATION}" = "true" ]; then
        echo "Cron job registration is disabled, skipping..."
        return
    fi

    echo "Registering background sync jobs..."
    if yarn command:prod cron:register:all; then
        echo "Successfully registered all background sync jobs!"
    else
        echo "Warning: Failed to register background jobs, but continuing startup..."
    fi
}

# 運行時注入前端環境變數
inject_frontend_env

setup_and_migrate_db
register_background_jobs

# Continue with the original Docker command
exec "$@"

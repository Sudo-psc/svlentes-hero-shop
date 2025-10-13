#!/bin/bash

###############################################################################
# Sistema de Restauração de Backup - SV Lentes
#
# Este script restaura backups criados pelo backup-system.sh
#
# Uso:
#   ./scripts/restore-backup.sh <backup_file.tar.gz> [--database-only] [--force]
#
# Exemplo:
#   ./scripts/restore-backup.sh /root/backups/svlentes/daily/20250113_020000.tar.gz
###############################################################################

set -e

# Configurações
PROJECT_ROOT="/root/svlentes-hero-shop"
BACKUP_FILE="$1"
DATABASE_ONLY=false
FORCE=false

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Parse arguments
for arg in "$@"; do
    case $arg in
        --database-only)
            DATABASE_ONLY=true
            ;;
        --force)
            FORCE=true
            ;;
    esac
done

# Funções de log
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validações
if [ -z "$BACKUP_FILE" ]; then
    log_error "Usage: $0 <backup_file.tar.gz> [--database-only] [--force]"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Confirmar restauração
if [ "$FORCE" != true ]; then
    echo ""
    log_warning "⚠️  ATENÇÃO: Esta operação irá sobrescrever dados existentes!"
    log_warning "Backup file: $BACKUP_FILE"
    echo ""
    read -p "Deseja continuar? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
        log_info "Operação cancelada pelo usuário"
        exit 0
    fi
fi

# Extrair backup
TEMP_DIR="/tmp/svlentes_restore_$$"
log_info "Extracting backup to ${TEMP_DIR}..."
mkdir -p "$TEMP_DIR"
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Encontrar diretório do backup
BACKUP_DIR=$(find "$TEMP_DIR" -maxdepth 1 -type d | tail -n 1)

# Restaurar banco de dados
restore_database() {
    log_info "Restoring database..."

    if [ -z "$DATABASE_URL" ]; then
        log_error "DATABASE_URL not set"
        return 1
    fi

    # Encontrar arquivo de dump
    DUMP_FILE=$(find "$BACKUP_DIR/database" -name "*.dump" | head -n 1)

    if [ -z "$DUMP_FILE" ]; then
        log_error "Database dump not found in backup"
        return 1
    fi

    # Extrair credenciais
    DB_USER=$(echo $DATABASE_URL | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
    DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

    # Confirmar drop database
    log_warning "This will DROP and recreate the database: $DB_NAME"
    if [ "$FORCE" != true ]; then
        read -p "Continue? (yes/no): " -r
        if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
            log_info "Database restore skipped"
            return 0
        fi
    fi

    # Drop e recriar database
    PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres <<EOF
DROP DATABASE IF EXISTS ${DB_NAME};
CREATE DATABASE ${DB_NAME};
EOF

    # Restaurar dump
    PGPASSWORD="$DB_PASS" pg_restore \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --no-owner \
        --no-acl \
        "$DUMP_FILE"

    log_success "Database restored successfully"
}

# Restaurar configurações
restore_config() {
    if [ "$DATABASE_ONLY" = true ]; then
        log_info "Skipping config restore (database-only mode)"
        return
    fi

    log_info "Restoring configuration files..."

    # Restaurar package.json (se diferente)
    if [ -f "$BACKUP_DIR/config/package.json" ]; then
        cp "$BACKUP_DIR/config/package.json" "$PROJECT_ROOT/package.json.restored"
        log_success "package.json restored to package.json.restored (review before using)"
    fi

    log_success "Configuration restore completed"
}

# Limpar temporários
cleanup() {
    log_info "Cleaning up temporary files..."
    rm -rf "$TEMP_DIR"
    log_success "Cleanup completed"
}

# Main
main() {
    echo "================================"
    echo "SV Lentes Restore System"
    echo "Backup: ${BACKUP_FILE}"
    echo "================================"
    echo ""

    # Carregar env
    if [ -f "${PROJECT_ROOT}/.env.local" ]; then
        export $(grep -v '^#' "${PROJECT_ROOT}/.env.local" | xargs)
    fi

    # Executar restauração
    restore_database
    restore_config
    cleanup

    echo ""
    log_success "Restore completed successfully!"
    log_info "Next steps:"
    log_info "1. Restart application: systemctl restart svlentes-nextjs"
    log_info "2. Verify data integrity"
    log_info "3. Test application functionality"
}

# Trap para cleanup em caso de erro
trap cleanup EXIT

# Executar
main

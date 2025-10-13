#!/bin/bash
set -e

# Caddy → Nginx Rollback Script
# Purpose: Emergency rollback if Caddy migration fails

echo "========================================="
echo " Caddy → Nginx Rollback Script"
echo "========================================="
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

LOG_FILE="/root/svlentes-hero-shop/migration/rollback-$(date +%Y%m%d_%H%M%S).log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

main() {
    log "Starting rollback to Nginx..."
    
    if [ "$EUID" -ne 0 ]; then 
        error "This script must be run as root"
    fi
    
    read -p "Confirm rollback to Nginx? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        log "Rollback cancelled"
        exit 0
    fi
    
    echo ""
    
    log "Stopping Caddy..."
    systemctl stop caddy || warning "Caddy was not running"
    systemctl disable caddy || warning "Caddy was not enabled"
    success "Caddy stopped and disabled"
    
    log "Starting Nginx..."
    systemctl start nginx
    systemctl enable nginx
    
    sleep 2
    
    if systemctl is-active --quiet nginx; then
        success "Nginx started successfully"
    else
        error "Nginx failed to start. Check: journalctl -u nginx -n 50"
    fi
    
    echo ""
    log "Testing endpoints..."
    
    if curl -s -o /dev/null -w "%{http_code}" https://svlentes.com.br | grep -q "200\|301\|302"; then
        success "✓ svlentes.com.br is responding"
    else
        error "✗ svlentes.com.br is not responding"
    fi
    
    if curl -s -o /dev/null -w "%{http_code}" https://saraivavision-n8n.cloud | grep -q "200\|401"; then
        success "✓ n8n is responding"
    else
        error "✗ n8n is not responding"
    fi
    
    echo ""
    success "========================================="
    success " Rollback Complete - Nginx Restored"
    success "========================================="
    echo ""
    log "Rollback log: $LOG_FILE"
}

main

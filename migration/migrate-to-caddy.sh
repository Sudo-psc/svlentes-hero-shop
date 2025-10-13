#!/bin/bash
set -e

# Nginx to Caddy Migration Script
# Generated: 2025-10-13 13:29:23 UTC
# Purpose: Safe migration with rollback capability

echo "========================================="
echo " Nginx → Caddy Migration Script"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
CADDYFILE="/root/svlentes-hero-shop/migration/Caddyfile"
BACKUP_DIR="/root/svlentes-hero-shop/migration/backups"
LOG_FILE="/root/svlentes-hero-shop/migration/migration-$(date +%Y%m%d_%H%M%S).log"

# Logging function
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

# Pre-flight checks
preflight_checks() {
    log "Running pre-flight checks..."
    
    # Check if running as root
    if [ "$EUID" -ne 0 ]; then 
        error "This script must be run as root"
    fi
    
    # Check if Caddy is installed
    if ! command -v caddy &> /dev/null; then
        error "Caddy is not installed. Run: apt install caddy"
    fi
    
    # Check if Caddyfile exists and is valid
    if [ ! -f "$CADDYFILE" ]; then
        error "Caddyfile not found at $CADDYFILE"
    fi
    
    log "Validating Caddyfile..."
    if ! caddy validate --config "$CADDYFILE" &>> "$LOG_FILE"; then
        error "Caddyfile validation failed. Check syntax."
    fi
    
    # Check if services are running
    if ! systemctl is-active --quiet nginx; then
        warning "Nginx is not running. Migration may fail."
    fi
    
    # Check if Next.js app is running
    if ! systemctl is-active --quiet svlentes-nextjs; then
        warning "svlentes-nextjs service is not running"
    fi
    
    # Check if n8n is running
    if ! docker ps | grep -q n8n; then
        warning "n8n container is not running"
    fi
    
    success "Pre-flight checks passed"
}

# Create log directory
create_log_dir() {
    mkdir -p /var/log/caddy
    chown caddy:caddy /var/log/caddy
    chmod 755 /var/log/caddy
    log "Created Caddy log directory with correct permissions"
}

# Stop nginx
stop_nginx() {
    log "Stopping Nginx..."
    systemctl stop nginx
    success "Nginx stopped"
}

# Copy Caddyfile to /etc/caddy
deploy_caddyfile() {
    log "Deploying Caddyfile..."
    cp "$CADDYFILE" /etc/caddy/Caddyfile
    chown root:root /etc/caddy/Caddyfile
    chmod 644 /etc/caddy/Caddyfile
    success "Caddyfile deployed to /etc/caddy/"
}

# Start Caddy
start_caddy() {
    log "Starting Caddy..."
    systemctl enable caddy
    systemctl start caddy
    sleep 3
    
    if systemctl is-active --quiet caddy; then
        success "Caddy started successfully"
    else
        error "Caddy failed to start. Check: journalctl -u caddy -n 50"
    fi
}

# Validate endpoints
validate_endpoints() {
    log "Validating endpoints..."
    
    local failed=0
    
    # Test svlentes.com.br
    log "Testing https://svlentes.com.br..."
    if curl -s -o /dev/null -w "%{http_code}" https://svlentes.com.br | grep -q "200\|301\|302"; then
        success "✓ svlentes.com.br is responding"
    else
        warning "✗ svlentes.com.br may have issues"
        failed=1
    fi
    
    # Test svlentes.shop (should redirect)
    log "Testing https://svlentes.shop..."
    if curl -s -o /dev/null -w "%{http_code}" https://svlentes.shop | grep -q "301\|302"; then
        success "✓ svlentes.shop redirect working"
    else
        warning "✗ svlentes.shop redirect may have issues"
        failed=1
    fi
    
    # Test n8n
    log "Testing https://saraivavision-n8n.cloud..."
    if curl -s -o /dev/null -w "%{http_code}" https://saraivavision-n8n.cloud | grep -q "200\|401"; then
        success "✓ n8n is responding"
    else
        warning "✗ n8n may have issues"
        failed=1
    fi
    
    if [ $failed -eq 1 ]; then
        warning "Some endpoints failed validation. Check logs."
    else
        success "All endpoints validated successfully"
    fi
}

# Main migration
main() {
    log "Starting Nginx → Caddy migration..."
    echo ""
    
    preflight_checks
    echo ""
    
    read -p "Proceed with migration? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        log "Migration cancelled by user"
        exit 0
    fi
    
    echo ""
    create_log_dir
    stop_nginx
    deploy_caddyfile
    start_caddy
    echo ""
    
    log "Waiting 5 seconds for SSL certificates..."
    sleep 5
    echo ""
    
    validate_endpoints
    echo ""
    
    success "========================================="
    success " Migration Complete!"
    success "========================================="
    echo ""
    log "Next steps:"
    log "1. Check logs: journalctl -u caddy -f"
    log "2. Monitor SSL: ls -l /var/lib/caddy/certificates/"
    log "3. If issues occur, run: ./rollback-to-nginx.sh"
    echo ""
    log "Migration log saved to: $LOG_FILE"
}

main

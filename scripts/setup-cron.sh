#!/bin/bash

###############################################################################
# Setup Automated Backups with Cron - SV Lentes
#
# This script configures cron jobs for automated backups
#
# Usage:
#   sudo ./scripts/setup-cron.sh
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Log functions
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

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    CRON_USER="root"
else
    CRON_USER="$USER"
fi

log_info "Setting up cron jobs for user: $CRON_USER"

# Backup script path
BACKUP_SCRIPT="/root/svlentes-hero-shop/scripts/backup-system.sh"
LOG_FILE="/var/log/svlentes-backup.log"

# Verify backup script exists
if [ ! -f "$BACKUP_SCRIPT" ]; then
    log_error "Backup script not found: $BACKUP_SCRIPT"
    exit 1
fi

# Make sure script is executable
chmod +x "$BACKUP_SCRIPT"
log_success "Backup script is executable"

# Create log file if it doesn't exist
touch "$LOG_FILE"
chmod 644 "$LOG_FILE"
log_success "Log file created: $LOG_FILE"

# Create temporary cron file
TEMP_CRON="/tmp/svlentes_cron_$$"

# Get current crontab (if exists)
crontab -l > "$TEMP_CRON" 2>/dev/null || true

# Remove existing svlentes backup entries
sed -i '/svlentes.*backup-system\.sh/d' "$TEMP_CRON"

# Add new cron jobs
cat >> "$TEMP_CRON" << CRONEOF

# SVLentes Automated Backups
# Daily backup at 2:00 AM
0 2 * * * $BACKUP_SCRIPT daily >> $LOG_FILE 2>&1

# Weekly backup on Sundays at 3:00 AM
0 3 * * 0 $BACKUP_SCRIPT weekly >> $LOG_FILE 2>&1

# Monthly backup on the 1st day of the month at 4:00 AM
0 4 1 * * $BACKUP_SCRIPT monthly >> $LOG_FILE 2>&1

CRONEOF

# Install new crontab
crontab "$TEMP_CRON"
rm "$TEMP_CRON"

log_success "Cron jobs configured successfully!"

echo ""
echo "================================"
echo "Backup Schedule:"
echo "================================"
echo "Daily:   Every day at 2:00 AM"
echo "Weekly:  Every Sunday at 3:00 AM"
echo "Monthly: 1st day of month at 4:00 AM"
echo ""
echo "Log file: $LOG_FILE"
echo ""

log_info "To view configured cron jobs:"
echo "  crontab -l"
echo ""

log_info "To view backup logs:"
echo "  tail -f $LOG_FILE"
echo ""

log_info "To test backup manually:"
echo "  $BACKUP_SCRIPT daily"
echo ""

# Display current crontab
log_info "Current crontab:"
crontab -l | grep -A 10 "SVLentes Automated Backups" || log_warning "No cron jobs found"

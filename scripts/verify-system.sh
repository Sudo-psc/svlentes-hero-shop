#!/bin/bash

###############################################################################
# System Verification Script - SV Lentes
#
# Verifies all system components are properly configured
#
# Usage:
#   ./scripts/verify-system.sh
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

# Functions
print_header() {
    echo ""
    echo "================================"
    echo "$1"
    echo "================================"
    echo ""
}

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((CHECKS_PASSED++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((CHECKS_FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((CHECKS_WARNING++))
}

check_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Start verification
print_header "SV Lentes System Verification"

# 1. Environment Files
print_header "1. Environment Configuration"

if [ -f ".env.local" ]; then
    check_pass ".env.local exists"
    
    # Check required variables
    if grep -q "ASAAS_API_KEY_PROD" .env.local; then
        check_pass "ASAAS_API_KEY_PROD configured"
    else
        check_fail "ASAAS_API_KEY_PROD not found"
    fi
    
    if grep -q "NEXTAUTH_SECRET" .env.local; then
        check_pass "NEXTAUTH_SECRET configured"
    else
        check_fail "NEXTAUTH_SECRET not found"
    fi
    
    if grep -q "DATABASE_URL" .env.local; then
        check_pass "DATABASE_URL configured"
    else
        check_warn "DATABASE_URL not configured"
    fi
else
    check_fail ".env.local not found"
fi

if [ -f ".env.local.example" ]; then
    check_pass ".env.local.example exists"
else
    check_warn ".env.local.example not found"
fi

# 2. Git Security
print_header "2. Git Security"

if git check-ignore .env.local > /dev/null 2>&1; then
    check_pass ".env.local is git-ignored"
else
    check_fail ".env.local is NOT git-ignored (SECURITY RISK!)"
fi

# Check for hardcoded keys
if grep -r "aact_prod" src/ 2>/dev/null | grep -v "example" | grep -v "\.md" > /dev/null; then
    check_fail "Hardcoded production API keys found in src/"
else
    check_pass "No hardcoded production keys in src/"
fi

# 3. Project Structure
print_header "3. Project Structure"

directories=("src" "src/app" "src/lib" "src/components" "scripts" "public")
for dir in "${directories[@]}"; do
    if [ -d "$dir" ]; then
        check_pass "Directory exists: $dir"
    else
        check_fail "Directory missing: $dir"
    fi
done

# 4. Key Files
print_header "4. Key Implementation Files"

key_files=(
    "src/lib/asaas.ts"
    "src/types/asaas.ts"
    "src/lib/logger.ts"
    "src/lib/monitoring.ts"
    "src/app/api/webhooks/asaas/route.ts"
    "package.json"
    "next.config.js"
    "tsconfig.json"
)

for file in "${key_files[@]}"; do
    if [ -f "$file" ]; then
        check_pass "File exists: $file"
    else
        check_fail "File missing: $file"
    fi
done

# 5. Scripts
print_header "5. Operational Scripts"

scripts=(
    "scripts/backup-system.sh"
    "scripts/restore-backup.sh"
    "scripts/test-asaas-connection.js"
    "scripts/setup-cron.sh"
    "scripts/verify-system.sh"
)

for script in "${scripts[@]}"; do
    if [ -f "$script" ]; then
        if [ -x "$script" ]; then
            check_pass "Script executable: $script"
        else
            check_warn "Script not executable: $script"
        fi
    else
        check_fail "Script missing: $script"
    fi
done

# 6. Documentation
print_header "6. Documentation"

docs=(
    "README.md"
    "CLAUDE.md"
    "OPERACOES_SISTEMA.md"
    "CHECKLIST_DEPLOYMENT.md"
    "SISTEMA_COMPLETO.md"
    "MIGRACAO_STRIPE_ASAAS.md"
    "SEGURANCA_API_KEYS.md"
)

for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        check_pass "Documentation exists: $doc"
    else
        check_warn "Documentation missing: $doc"
    fi
done

# 7. Node Modules
print_header "7. Dependencies"

if [ -d "node_modules" ]; then
    check_pass "node_modules installed"
else
    check_warn "node_modules not installed (run: npm install)"
fi

if [ -f "package-lock.json" ]; then
    check_pass "package-lock.json exists"
else
    check_warn "package-lock.json not found"
fi

# Check for Stripe (should be removed)
if grep -q "\"stripe\"" package.json 2>/dev/null; then
    check_fail "Stripe dependency still present (should be removed)"
else
    check_pass "Stripe dependency removed"
fi

# 8. Build
print_header "8. Build Status"

if [ -d ".next" ]; then
    check_pass ".next build directory exists"
    
    if [ -f ".next/BUILD_ID" ]; then
        BUILD_ID=$(cat .next/BUILD_ID)
        check_pass "Build ID: $BUILD_ID"
    fi
else
    check_warn ".next directory not found (run: npm run build)"
fi

# 9. System Services (if running on production server)
print_header "9. System Services"

if command -v systemctl > /dev/null 2>&1; then
    # Check Next.js service
    if systemctl is-active --quiet svlentes-nextjs 2>/dev/null; then
        check_pass "svlentes-nextjs service is running"
    else
        check_warn "svlentes-nextjs service not running"
    fi
    
    # Check Nginx
    if systemctl is-active --quiet nginx 2>/dev/null; then
        check_pass "nginx service is running"
    else
        check_warn "nginx service not running"
    fi
    
    # Check PostgreSQL
    if systemctl is-active --quiet postgresql 2>/dev/null; then
        check_pass "postgresql service is running"
    else
        check_warn "postgresql service not running"
    fi
else
    check_info "systemctl not available (not on production server)"
fi

# 10. Asaas Connection
print_header "10. Asaas API Connection"

if [ -f "scripts/test-asaas-connection.js" ]; then
    if node scripts/test-asaas-connection.js > /dev/null 2>&1; then
        check_pass "Asaas API connection successful"
    else
        check_fail "Asaas API connection failed"
    fi
else
    check_warn "Test script not found"
fi

# 11. Backup System
print_header "11. Backup System"

BACKUP_DIR="/root/backups/svlentes"
if [ -d "$BACKUP_DIR" ]; then
    check_pass "Backup directory exists: $BACKUP_DIR"
    
    # Check subdirectories
    for subdir in daily weekly monthly; do
        if [ -d "$BACKUP_DIR/$subdir" ]; then
            check_pass "Backup subdirectory: $subdir"
        else
            check_warn "Backup subdirectory missing: $subdir"
        fi
    done
else
    check_warn "Backup directory not found (will be created on first backup)"
fi

# Check cron jobs
if crontab -l 2>/dev/null | grep -q "backup-system.sh"; then
    check_pass "Backup cron jobs configured"
else
    check_warn "Backup cron jobs not configured (run: ./scripts/setup-cron.sh)"
fi

# Final Summary
print_header "Verification Summary"

TOTAL_CHECKS=$((CHECKS_PASSED + CHECKS_FAILED + CHECKS_WARNING))
PASS_PERCENTAGE=$((CHECKS_PASSED * 100 / TOTAL_CHECKS))

echo -e "${GREEN}✓ Passed:${NC}  $CHECKS_PASSED"
echo -e "${YELLOW}⚠ Warnings:${NC} $CHECKS_WARNING"
echo -e "${RED}✗ Failed:${NC}  $CHECKS_FAILED"
echo ""
echo -e "Total Checks: $TOTAL_CHECKS"
echo -e "Pass Rate: ${PASS_PERCENTAGE}%"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    if [ $CHECKS_WARNING -eq 0 ]; then
        echo -e "${GREEN}🎉 System verification PASSED! All checks successful.${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠️  System verification PASSED with warnings. Review warnings above.${NC}"
        exit 0
    fi
else
    echo -e "${RED}❌ System verification FAILED! Fix critical issues above.${NC}"
    exit 1
fi

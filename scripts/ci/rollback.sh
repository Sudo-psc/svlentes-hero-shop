#!/bin/bash
# Rollback Script for CI/CD Pipeline
# Reverts application to previous working deployment

set -e

# Configuration
ENVIRONMENT="${1:-production}"
BACKUP_ID="${2:-latest}"

# Environment-specific configuration
if [ "$ENVIRONMENT" = "production" ]; then
    DEPLOY_PATH="/root/svlentes-hero-shop"
    SERVICE_NAME="svlentes-nextjs"
    PORT=5000
elif [ "$ENVIRONMENT" = "staging" ]; then
    DEPLOY_PATH="/root/svlentes-staging"
    SERVICE_NAME="svlentes-staging"
    PORT=3001
else
    echo "❌ Invalid environment: $ENVIRONMENT"
    echo "Usage: $0 [production|staging] [backup_id|latest]"
    exit 1
fi

BACKUP_DIR="$HOME/backups"

echo "🔄 Starting rollback for $ENVIRONMENT environment..."
echo "=================================================="

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to list available backups
list_backups() {
    echo ""
    echo "📦 Available backups:"
    echo "-------------------"
    ls -lht "$BACKUP_DIR" | grep "svlentes-" | head -10
    echo ""
}

# Check if we're in the deployment directory
if [ ! -d "$DEPLOY_PATH" ]; then
    echo -e "${RED}❌ Deployment directory not found: $DEPLOY_PATH${NC}"
    exit 1
fi

cd "$DEPLOY_PATH"

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${RED}❌ Backup directory not found: $BACKUP_DIR${NC}"
    exit 1
fi

# Determine which backup to restore
if [ "$BACKUP_ID" = "latest" ]; then
    BACKUP_PATH=$(ls -td "$BACKUP_DIR"/svlentes-* 2>/dev/null | head -1)
    if [ -z "$BACKUP_PATH" ]; then
        echo -e "${RED}❌ No backups found${NC}"
        list_backups
        exit 1
    fi
else
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_ID"
    if [ ! -d "$BACKUP_PATH" ]; then
        echo -e "${RED}❌ Backup not found: $BACKUP_PATH${NC}"
        list_backups
        exit 1
    fi
fi

echo "📦 Selected backup: $(basename "$BACKUP_PATH")"
echo "📂 Backup path: $BACKUP_PATH"

# Confirmation prompt
echo ""
echo -e "${YELLOW}⚠️  WARNING: This will rollback the $ENVIRONMENT environment${NC}"
echo "   Current deployment will be stopped"
echo "   Application will be restored from backup"
echo ""
read -p "Continue with rollback? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    echo "❌ Rollback cancelled"
    exit 0
fi

echo "🚀 Proceeding with rollback..."
echo ""

# Step 1: Stop current service
echo "1️⃣  Stopping current service..."
if systemctl stop "$SERVICE_NAME"; then
    echo -e "${GREEN}✅ Service stopped${NC}"
else
    echo -e "${YELLOW}⚠️  Service was not running${NC}"
fi

# Step 2: Backup current state (just in case)
echo ""
echo "2️⃣  Creating safety backup of current state..."
SAFETY_BACKUP="$BACKUP_DIR/rollback-safety-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$SAFETY_BACKUP"

if [ -d ".next" ]; then
    cp -r .next "$SAFETY_BACKUP/" 2>/dev/null || true
    echo -e "${GREEN}✅ Current state backed up to: $SAFETY_BACKUP${NC}"
else
    echo -e "${YELLOW}⚠️  No .next directory found${NC}"
fi

# Step 3: Restore from backup
echo ""
echo "3️⃣  Restoring from backup..."

# Restore .next build directory
if [ -d "$BACKUP_PATH/.next" ]; then
    rm -rf .next
    cp -r "$BACKUP_PATH/.next" .
    echo -e "${GREEN}✅ Build files restored${NC}"
else
    echo -e "${RED}❌ Build files not found in backup${NC}"
    echo "   Attempting to rebuild from git commit..."
fi

# Restore environment file if exists
if [ -f "$BACKUP_PATH/.env.local" ]; then
    cp "$BACKUP_PATH/.env.local" .
    echo -e "${GREEN}✅ Environment file restored${NC}"
else
    echo -e "${YELLOW}⚠️  No environment file in backup${NC}"
fi

# Restore package.json if exists
if [ -f "$BACKUP_PATH/package.json" ]; then
    cp "$BACKUP_PATH/package.json" .
    echo -e "${GREEN}✅ Package.json restored${NC}"
fi

# Step 4: Restore git commit if available
if [ -f "$BACKUP_PATH/git-commit.txt" ]; then
    echo ""
    echo "4️⃣  Restoring git commit..."
    BACKUP_COMMIT=$(cat "$BACKUP_PATH/git-commit.txt")
    echo "   Checking out commit: $BACKUP_COMMIT"

    git fetch origin
    git checkout "$BACKUP_COMMIT"

    # Reinstall dependencies
    npm ci --production=false
    echo -e "${GREEN}✅ Git state restored${NC}"
else
    echo ""
    echo "4️⃣  No git commit info in backup - using current checkout"
fi

# Step 5: Restore database if backup exists
if [ -f "$BACKUP_PATH/database.sql" ]; then
    echo ""
    echo "5️⃣  Database backup found..."
    read -p "Restore database? (yes/no): " -r
    echo ""

    if [[ $REPLY =~ ^[Yy]es$ ]]; then
        echo "   Restoring database..."
        docker exec -i postgres psql -U n8nuser svlentes_prod < "$BACKUP_PATH/database.sql"
        echo -e "${GREEN}✅ Database restored${NC}"
    else
        echo "   Skipping database restore"
    fi
fi

# Step 6: Restart service
echo ""
echo "6️⃣  Restarting service..."
if systemctl start "$SERVICE_NAME"; then
    echo -e "${GREEN}✅ Service started${NC}"
else
    echo -e "${RED}❌ Failed to start service${NC}"
    journalctl -u "$SERVICE_NAME" -n 20
    exit 1
fi

# Wait for service to initialize
echo "   Waiting for service to initialize..."
sleep 10

# Step 7: Health check
echo ""
echo "7️⃣  Running health checks..."

MAX_RETRIES=5
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f -s "http://localhost:$PORT/api/health-check" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Health check passed${NC}"
        break
    fi

    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        echo -e "${RED}❌ Health check failed after $MAX_RETRIES attempts${NC}"
        echo ""
        echo "📋 Service logs:"
        journalctl -u "$SERVICE_NAME" -n 30
        exit 1
    fi

    echo "   Attempt $RETRY_COUNT/$MAX_RETRIES failed, retrying..."
    sleep 5
done

# Final summary
echo ""
echo "=================================================="
echo "✅ Rollback completed successfully!"
echo "=================================================="
echo "Environment: $ENVIRONMENT"
echo "Restored from: $(basename "$BACKUP_PATH")"
echo "Service status: RUNNING"
echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo "📦 Safety backup location: $SAFETY_BACKUP"
echo "   (in case you need to undo this rollback)"
echo ""

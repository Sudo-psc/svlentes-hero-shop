#!/bin/bash
# Health Check Script for CI/CD Pipeline
# Verifies application is running correctly after deployment

set -e

# Configuration
ENVIRONMENT="${1:-production}"
MAX_RETRIES="${2:-10}"
RETRY_DELAY="${3:-5}"

# Environment-specific URLs
if [ "$ENVIRONMENT" = "production" ]; then
    BASE_URL="https://svlentes.shop"
    LOCAL_URL="http://localhost:5000"
elif [ "$ENVIRONMENT" = "staging" ]; then
    BASE_URL="https://staging.svlentes.shop"
    LOCAL_URL="http://localhost:3001"
else
    echo "❌ Invalid environment: $ENVIRONMENT"
    echo "Usage: $0 [production|staging] [max_retries] [retry_delay]"
    exit 1
fi

echo "🔍 Starting health checks for $ENVIRONMENT environment..."
echo "=================================================="

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to perform health check
health_check() {
    local url=$1
    local description=$2
    local retry_count=0

    echo ""
    echo "Testing: $description"
    echo "URL: $url"

    while [ $retry_count -lt $MAX_RETRIES ]; do
        # Perform health check with timeout
        if response=$(curl -f -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 "$url" 2>&1); then
            if [ "$response" = "200" ]; then
                echo -e "${GREEN}✅ $description - PASSED${NC} (HTTP $response)"
                return 0
            else
                echo -e "${YELLOW}⚠️  Unexpected status code: $response${NC}"
            fi
        else
            echo -e "${YELLOW}⚠️  Attempt $((retry_count + 1))/$MAX_RETRIES failed${NC}"
        fi

        retry_count=$((retry_count + 1))

        if [ $retry_count -lt $MAX_RETRIES ]; then
            echo "   Retrying in ${RETRY_DELAY}s..."
            sleep $RETRY_DELAY
        fi
    done

    echo -e "${RED}❌ $description - FAILED${NC} (after $MAX_RETRIES attempts)"
    return 1
}

# Function to check response time
check_performance() {
    local url=$1
    local description=$2
    local max_time=3000 # 3 seconds in milliseconds

    echo ""
    echo "Performance test: $description"

    # Measure response time
    response_time=$(curl -o /dev/null -s -w '%{time_total}' "$url" 2>&1)
    response_ms=$(echo "$response_time * 1000" | bc)
    response_ms_int=${response_ms%.*}

    echo "Response time: ${response_ms_int}ms"

    if [ "$response_ms_int" -lt "$max_time" ]; then
        echo -e "${GREEN}✅ Performance check - PASSED${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Slow response time (threshold: ${max_time}ms)${NC}"
        return 1
    fi
}

# Track overall status
ALL_CHECKS_PASSED=true

# 1. Local health check (internal)
echo ""
echo "1️⃣  Internal Health Checks"
echo "----------------------------"
if ! health_check "$LOCAL_URL/api/health-check" "Internal health endpoint"; then
    ALL_CHECKS_PASSED=false
fi

# 2. Public health check
echo ""
echo "2️⃣  Public Health Checks"
echo "----------------------------"
if ! health_check "$BASE_URL/api/health-check" "Public health endpoint"; then
    ALL_CHECKS_PASSED=false
fi

# 3. Critical page checks
echo ""
echo "3️⃣  Critical Page Checks"
echo "----------------------------"
CRITICAL_PAGES=(
    "$BASE_URL/:Homepage"
    "$BASE_URL/calculadora:Calculator page"
    "$BASE_URL/assinar:Subscription page"
    "$BASE_URL/agendar-consulta:Consultation booking"
)

for page in "${CRITICAL_PAGES[@]}"; do
    url="${page%%:*}"
    description="${page##*:}"
    if ! health_check "$url" "$description"; then
        ALL_CHECKS_PASSED=false
    fi
done

# 4. API endpoint checks
echo ""
echo "4️⃣  API Endpoint Checks"
echo "----------------------------"
API_ENDPOINTS=(
    "$BASE_URL/api/monitoring/performance:Performance monitoring"
    "$BASE_URL/api/whatsapp-redirect:WhatsApp redirect"
)

for endpoint in "${API_ENDPOINTS[@]}"; do
    url="${endpoint%%:*}"
    description="${endpoint##*:}"
    if ! health_check "$url" "$description"; then
        ALL_CHECKS_PASSED=false
    fi
done

# 5. Performance checks
echo ""
echo "5️⃣  Performance Checks"
echo "----------------------------"
check_performance "$BASE_URL/api/health-check" "API response time" || true

# 6. Service status check (if on production server)
if [ -f /etc/systemd/system/svlentes-nextjs.service ] && [ "$ENVIRONMENT" = "production" ]; then
    echo ""
    echo "6️⃣  Service Status Check"
    echo "----------------------------"
    if systemctl is-active --quiet svlentes-nextjs; then
        echo -e "${GREEN}✅ Systemd service - RUNNING${NC}"
    else
        echo -e "${RED}❌ Systemd service - NOT RUNNING${NC}"
        ALL_CHECKS_PASSED=false
    fi
fi

# Final summary
echo ""
echo "=================================================="
echo "📊 Health Check Summary"
echo "=================================================="
echo "Environment: $ENVIRONMENT"
echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"

if [ "$ALL_CHECKS_PASSED" = true ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED${NC}"
    echo ""
    echo "🎉 Deployment verified successfully!"
    exit 0
else
    echo -e "${RED}❌ SOME CHECKS FAILED${NC}"
    echo ""
    echo "⚠️  Deployment verification failed - review logs above"
    exit 1
fi

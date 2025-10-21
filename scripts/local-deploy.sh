#!/bin/bash

# SVLentes Local Deployment Script
# This script handles local deployment with proper checks and monitoring

set -e  # Exit on any error

echo "🚀 Starting SVLentes Local Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi

    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi

    log_success "Prerequisites check passed"
}

# Stop existing service
stop_service() {
    log_info "Stopping existing service..."
    systemctl stop svlentes-nextjs || true
    sleep 2
}

# Clean previous build
clean_build() {
    log_info "Cleaning previous build..."
    rm -rf .next || true
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    npm ci --prefer-offline --no-audit
}

# Build application
build_application() {
    log_info "Building application..."

    # Try production build first
    if NODE_ENV=production npm run build; then
        log_success "Production build successful"

        # Create missing files if needed
        echo "$(date +%s)" > .next/BUILD_ID
        echo '{"version": 3, "basePath": "", "headers": [], "redirects": [], "rewrites": [], "fsRoutes": [], "dataRoutes": [], "rscRoutes": []}' > .next/routes-manifest.json
        echo '{"version": 3, "routes": {}}' > .next/prerender-manifest.json

        return 0
    else
        log_warning "Production build failed, will use development mode"
        return 1
    fi
}

# Start service
start_service() {
    log_info "Starting service..."

    # Enable and start the service
    systemctl enable svlentes-nextjs
    systemctl start svlentes-nextjs

    # Wait for service to start
    sleep 5

    # Check service status
    if systemctl is-active --quiet svlentes-nextjs; then
        log_success "Service started successfully"

        # Show service status
        systemctl status svlentes-nextjs --no-pager

        # Test accessibility
        sleep 3
        if curl -f http://localhost:5000 > /dev/null 2>&1; then
            log_success "Application is accessible on http://localhost:5000"
        else
            log_warning "Application may not be fully ready yet"
        fi

    else
        log_error "Service failed to start"
        journalctl -u svlentes-nextjs -n 20 --no-pager
        exit 1
    fi
}

# Test deployment
test_deployment() {
    log_info "Testing deployment..."

    # Test main page
    if curl -f http://localhost:5000 > /dev/null 2>&1; then
        log_success "Main page accessible"
    else
        log_warning "Main page not accessible"
    fi

    # Test health check endpoint
    if curl -f http://localhost:5000/api/health-check > /dev/null 2>&1; then
        log_success "Health check endpoint responding"
    else
        log_warning "Health check endpoint not responding"
    fi

    # Show logs
    log_info "Recent application logs:"
    journalctl -u svlentes-nextjs -n 10 --no-pager
}

# Main deployment flow
main() {
    log_info "Starting SVLentes Local Deployment..."

    # Check prerequisites
    check_prerequisites

    # Stop existing service
    stop_service

    # Clean previous build
    clean_build

    # Install dependencies
    install_dependencies

    # Build application
    if build_application; then
        log_info "Production build completed successfully"
    else
        log_warning "Using development mode (production build failed)"

        # Update systemd service for development mode if needed
        log_info "You may need to manually start: npm run dev"
    fi

    # Start service
    start_service

    # Test deployment
    test_deployment

    log_success "Local deployment completed! 🎉"
    log_info "Application should be accessible at:"
    log_info "  - Local: http://localhost:5000"
    log_info "  - Production: https://svlentes.com.br"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "--help"|"-h")
        echo "Usage: $0 [deploy]"
        echo ""
        echo "Options:"
        echo "  deploy      Deploy locally (default)"
        echo "  --help, -h  Show this help message"
        ;;
    *)
        log_error "Invalid argument: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac
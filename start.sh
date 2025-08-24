#!/bin/bash

# Denom Protocol - Quick Start Script
# This script helps developers quickly set up and run the project
# Compatible with Node.js v22.18.0

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to get Node.js version
get_node_version() {
    if command_exists node; then
        node --version | sed 's/v//'
    else
        echo "0.0.0"
    fi
}

# Function to compare versions
version_ge() {
    printf '%s\n%s\n' "$2" "$1" | sort -V -C
}

print_status "🚀 Starting Denom Protocol Setup..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "frontend" ]; then
    print_error "This doesn't appear to be the Denom project root directory."
    print_error "Please run this script from the project root where package.json or frontend/ exists."
    exit 1
fi

# Check Node.js installation
print_status "Checking Node.js installation..."
if ! command_exists node; then
    print_error "Node.js is not installed!"
    echo ""
    echo "Please install Node.js v18.0.0 or higher from: https://nodejs.org/"
    echo "Recommended version: v22.18.0"
    exit 1
fi

NODE_VERSION=$(get_node_version)
print_success "Node.js version: v$NODE_VERSION"

# Check Node.js version (minimum v18.0.0)
if ! version_ge "$NODE_VERSION" "18.0.0"; then
    print_warning "Node.js version v$NODE_VERSION detected."
    print_warning "Recommended version is v18.0.0 or higher (tested with v22.18.0)"
    echo ""
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Please upgrade Node.js and try again."
        exit 1
    fi
fi

# Check npm installation
print_status "Checking npm installation..."
if ! command_exists npm; then
    print_error "npm is not installed!"
    print_error "npm usually comes with Node.js. Please reinstall Node.js."
    exit 1
fi

NPM_VERSION=$(npm --version)
print_success "npm version: v$NPM_VERSION"

echo ""
print_status "🔧 Setting up the project..."

# Determine if we're in a monorepo structure or standalone frontend
if [ -d "frontend" ]; then
    print_status "Detected monorepo structure. Setting up frontend..."
    cd frontend
    FRONTEND_DIR="frontend"
else
    print_status "Detected standalone frontend structure..."
    FRONTEND_DIR="."
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "package.json not found in $FRONTEND_DIR"
    exit 1
fi

# Install dependencies
print_status "Installing dependencies... (this may take a few minutes)"
echo ""

if npm install; then
    print_success "Dependencies installed successfully!"
else
    print_error "Failed to install dependencies."
    print_error "Please check your internet connection and try again."
    exit 1
fi

echo ""
print_status "🌐 Starting development server..."
echo ""

# Function to open browser (cross-platform)
open_browser() {
    local url="$1"
    if command_exists xdg-open; then
        # Linux
        xdg-open "$url" >/dev/null 2>&1 &
    elif command_exists open; then
        # macOS
        open "$url" >/dev/null 2>&1 &
    elif command_exists start; then
        # Windows (Git Bash/WSL)
        start "$url" >/dev/null 2>&1 &
    else
        print_warning "Could not automatically open browser."
        print_status "Please manually open: $url"
    fi
}

# Start the development server and open browser
print_status "Launching Vite development server..."
print_status "The browser will open automatically in a few seconds..."
echo ""
print_success "🎉 Setup complete! The application is starting..."

# Wait a moment for the server to start, then open browser
(sleep 3 && open_browser "http://localhost:5173") &

# Start the development server
if npm run dev; then
    print_success "Development server started successfully!"
else
    print_error "Failed to start development server."
    print_error "Please check the console output above for errors."
    exit 1
fi

#!/bin/bash

# FusionAI Enterprise Suite Setup Script
# This script sets up the development environment

set -e

echo "🚀 Setting up FusionAI Enterprise Suite..."

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

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    print_success "Docker is installed"
}

# Check if Docker Compose is installed
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    print_success "Docker Compose is installed"
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    print_success "Node.js $(node --version) is installed"
}

# Check if Python is installed
check_python() {
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed. Please install Python 3.11+ first."
        exit 1
    fi
    
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
    if [ "$(echo "$PYTHON_VERSION < 3.11" | bc -l)" -eq 1 ]; then
        print_error "Python 3.11+ is required. Current version: $(python3 --version)"
        exit 1
    fi
    print_success "Python $(python3 --version) is installed"
}

# Create environment file
create_env_file() {
    print_status "Creating environment file..."
    
    if [ ! -f .env ]; then
        cp config/env.example .env
        print_success "Created .env file from template"
        print_warning "Please update .env file with your actual configuration"
    else
        print_warning ".env file already exists, skipping creation"
    fi
}

# Setup backend
setup_backend() {
    print_status "Setting up backend..."
    
    cd backend
    
    # Create virtual environment
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        print_success "Created Python virtual environment"
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install dependencies
    pip install --upgrade pip
    pip install -r requirements.txt
    print_success "Installed Python dependencies"
    
    cd ..
}

# Setup frontend
setup_frontend() {
    print_status "Setting up frontend..."
    
    cd frontend
    
    # Install dependencies
    npm install
    print_success "Installed Node.js dependencies"
    
    cd ..
}

# Setup database
setup_database() {
    print_status "Setting up database with Docker Compose..."
    
    # Start database services
    docker-compose up -d postgres redis qdrant
    
    # Wait for services to be ready
    print_status "Waiting for database services to be ready..."
    sleep 10
    
    print_success "Database services started"
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    cd backend
    source venv/bin/activate
    
    # TODO: Add actual migration commands
    # alembic upgrade head
    
    print_success "Database migrations completed"
    cd ..
}

# Build Docker images
build_images() {
    print_status "Building Docker images..."
    
    docker-compose build
    print_success "Docker images built"
}

# Main setup function
main() {
    echo "🎯 FusionAI Enterprise Suite Setup"
    echo "=================================="
    
    # Check prerequisites
    print_status "Checking prerequisites..."
    check_docker
    check_docker_compose
    check_node
    check_python
    
    # Create environment file
    create_env_file
    
    # Setup backend
    setup_backend
    
    # Setup frontend
    setup_frontend
    
    # Setup database
    setup_database
    
    # Run migrations
    run_migrations
    
    # Build images
    build_images
    
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Update .env file with your configuration"
    echo "2. Start the application: docker-compose up"
    echo "3. Access the frontend at: http://localhost:3000"
    echo "4. Access the backend API at: http://localhost:8000"
    echo "5. View API documentation at: http://localhost:8000/docs"
    echo ""
    echo "For development:"
    echo "- Backend: cd backend && source venv/bin/activate && uvicorn src.main:app --reload"
    echo "- Frontend: cd frontend && npm run dev"
}

# Run main function
main "$@"





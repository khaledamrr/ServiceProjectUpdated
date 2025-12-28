#!/bin/bash

# View Logs for All Services
# This script allows you to view logs for individual services or all services

echo "📋 Service Log Viewer"
echo ""
echo "Available services:"
echo "  1) Auth Service (port 3001)"
echo "  2) User Service (port 3002)"
echo "  3) Product Service (port 3003)"
echo "  4) Order Service (port 3004)"
echo "  5) Payment Service (port 3005)"
echo "  6) API Gateway (port 3000)"
echo "  7) Frontend (port 4000)"
echo "  8) All Services (combined)"
echo ""

# Function to view logs for a specific service
view_service_logs() {
    local service_name=$1
    local service_path=$2
    
    echo "📖 Viewing logs for $service_name..."
    echo "Press Ctrl+C to stop"
    echo ""
    
    cd "$service_path"
    npm run start:dev
}

# Function to view all logs using tmux
view_all_logs() {
    echo "Opening all service logs in separate terminal windows..."
    echo ""
    
    # Check if tmux is installed
    if ! command -v tmux &> /dev/null; then
        echo "⚠️  tmux is not installed. Installing via Homebrew..."
        brew install tmux
    fi
    
    # Create a new tmux session with multiple panes
    tmux new-session -d -s microservices-logs
    
    # Split into 6 panes for each service
    tmux split-window -h
    tmux split-window -v
    tmux select-pane -t 0
    tmux split-window -v
    tmux select-pane -t 2
    tmux split-window -v
    tmux select-pane -t 4
    tmux split-window -v
    
    # Run each service in its pane
    tmux select-pane -t 0
    tmux send-keys "cd backend/auth-service && npm run start:dev" C-m
    
    tmux select-pane -t 1
    tmux send-keys "cd backend/user-service && npm run start:dev" C-m
    
    tmux select-pane -t 2
    tmux send-keys "cd backend/product-service && npm run start:dev" C-m
    
    tmux select-pane -t 3
    tmux send-keys "cd backend/order-service && npm run start:dev" C-m
    
    tmux select-pane -t 4
    tmux send-keys "cd backend/payment-service && npm run start:dev" C-m
    
    tmux select-pane -t 5
    tmux send-keys "cd backend/api-gateway && npm run start:dev" C-m
    
    # Attach to the session
    tmux attach-session -t microservices-logs
}

# Read user choice
read -p "Enter your choice (1-8): " choice

case $choice in
    1)
        view_service_logs "Auth Service" "backend/auth-service"
        ;;
    2)
        view_service_logs "User Service" "backend/user-service"
        ;;
    3)
        view_service_logs "Product Service" "backend/product-service"
        ;;
    4)
        view_service_logs "Order Service" "backend/order-service"
        ;;
    5)
        view_service_logs "Payment Service" "backend/payment-service"
        ;;
    6)
        view_service_logs "API Gateway" "backend/api-gateway"
        ;;
    7)
        view_service_logs "Frontend" "frontend/web-app"
        ;;
    8)
        view_all_logs
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

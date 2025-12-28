#!/bin/bash

# Start All Microservices with Logging
# This script starts all backend services and the frontend with log files

echo "🚀 Starting NestJS Microservices E-commerce Platform with Logging..."
echo ""

# Create logs directory if it doesn't exist
mkdir -p logs

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null
then
    echo "⚠️  Warning: MongoDB doesn't appear to be running."
    echo "Please start MongoDB before running this script."
    echo ""
fi

# Function to kill process on a port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        echo "🔄 Killing process on port $port (PID: $pid)"
        kill -9 $pid 2>/dev/null
        sleep 1
    fi
}

# Ensure all ports are available
echo "🔍 Checking and freeing up ports..."
kill_port 3000  # API Gateway
kill_port 3001  # Auth Service
kill_port 3002  # User Service
kill_port 3003  # Product Service
kill_port 3004  # Order Service
kill_port 3005  # Payment Service
kill_port 3006  # Category Service
kill_port 3007  # Management Service
kill_port 4000  # Frontend
echo "✅ All ports are now available"
echo ""

# Function to start a service with logging
start_service() {
    local service_name=$1
    local service_path=$2
    local port=$3
    local log_file="logs/${service_name// /-}.log"
    
    echo "Starting $service_name on port $port..."
    cd "$service_path"
    npm run start:dev > "../../$log_file" 2>&1 &
    echo "✅ $service_name started (PID: $!, Log: $log_file)"
    cd - > /dev/null
}

# Start all backend services
echo "📦 Starting Backend Services..."
echo ""

start_service "auth-service" "backend/auth-service" "3001"
sleep 2

start_service "user-service" "backend/user-service" "3002"
sleep 2

start_service "product-service" "backend/product-service" "3003"
sleep 2

start_service "order-service" "backend/order-service" "3004"
sleep 2

# Start payment-service
echo "Starting payment-service on port 3005..."
cd backend/payment-service
npm run start:dev > ../../logs/payment-service.log 2>&1 &
PAYMENT_PID=$!
echo "✅ payment-service started (PID: $PAYMENT_PID, Log: logs/payment-service.log)"
cd ../..
sleep 2

# Start category-service
echo "Starting category-service on port 3006..."
cd backend/category-service
npm run start:dev > ../../logs/category-service.log 2>&1 &
CATEGORY_PID=$!
echo "✅ category-service started (PID: $CATEGORY_PID, Log: logs/category-service.log)"
cd ../..
sleep 2

# Start management-service
echo "Starting management-service on port 3007..."
cd backend/management-service
npm run start:dev > ../../logs/management-service.log 2>&1 &
MANAGEMENT_PID=$!
echo "✅ management-service started (PID: $MANAGEMENT_PID, Log: logs/management-service.log)"
cd ../..
sleep 3

# Start api-gateway
echo "Starting api-gateway on port 3000..."
cd backend/api-gateway
npm run start:dev > ../../logs/api-gateway.log 2>&1 &
GATEWAY_PID=$!
echo "✅ api-gateway started (PID: $GATEWAY_PID, Log: logs/api-gateway.log)"
cd ../..

echo ""
echo "🌐 Starting Frontend..."
echo ""

# Start frontend
cd frontend/web-app
npm run dev > ../../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID, Log: logs/frontend.log)"
cd ../..

echo ""
echo "✨ All services started successfully with logging!"
echo ""
echo "📍 Access Points:"
echo "   - Frontend: http://localhost:4000"
echo "   - API Gateway: http://localhost:3000"
echo ""
echo "📋 Log Files:"
echo "   - Auth Service: logs/auth-service.log"
echo "   - User Service: logs/user-service.log"
echo "   - Product Service: logs/product-service.log"
echo "   - Order Service: logs/order-service.log"
echo "   - Payment Service: logs/payment-service.log"
echo "   - Category Service: logs/category-service.log"
echo "   - Management Service: logs/management-service.log"
echo "   - API Gateway: logs/api-gateway.log"
echo "   - Frontend: logs/frontend.log"
echo ""
echo "To view logs: tail -f logs/<service-name>.log"
echo "To view all logs: tail -f logs/*.log"
echo "To stop all services, run: ./stop-all.sh"
echo ""

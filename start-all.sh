#!/bin/bash

# Start All Microservices Script
# This script starts all backend services and the frontend

echo "🚀 Starting NestJS Microservices E-commerce Platform..."
echo ""

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null
then
    echo "⚠️  Warning: MongoDB doesn't appear to be running."
    echo "Please start MongoDB before running this script."
    echo ""
fi

# Function to start a service
start_service() {
    local service_name=$1
    local service_path=$2
    local port=$3
    
    echo "Starting $service_name on port $port..."
    cd "$service_path"
    npm run start:dev > /dev/null 2>&1 &
    echo "✅ $service_name started (PID: $!)"
    cd - > /dev/null
}

# Start all backend services
echo "📦 Starting Backend Services..."
echo ""

start_service "Auth Service" "backend/auth-service" "3001"
sleep 2

start_service "User Service" "backend/user-service" "3002"
sleep 2

start_service "Product Service" "backend/product-service" "3003"
sleep 2

start_service "Order Service" "backend/order-service" "3004"
sleep 2

start_service "Payment Service" "backend/payment-service" "3005"
sleep 2

start_service "API Gateway" "backend/api-gateway" "3000"
sleep 3

echo ""
echo "🌐 Starting Frontend..."
echo ""

cd frontend/web-app
npm run dev > /dev/null 2>&1 &
echo "✅ Frontend started (PID: $!)"
cd - > /dev/null

echo ""
echo "✨ All services started successfully!"
echo ""
echo "📍 Access Points:"
echo "   - Frontend: http://localhost:4000"
echo "   - API Gateway: http://localhost:3000"
echo ""
echo "To stop all services, run: ./stop-all.sh"
echo ""


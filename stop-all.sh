#!/bin/bash

# Stop All Microservices Script

echo "🛑 Stopping all services..."
echo ""

# Kill all node processes (be careful with this in production!)
# This will kill all Node.js processes running on your system
pkill -f "nest start"
pkill -f "next dev"

echo "✅ All services stopped!"
echo ""


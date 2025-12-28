@echo off
echo Starting NestJS Microservices E-commerce Platform...
echo.

echo Starting Backend Services...
echo.

echo Starting Auth Service...
start "Auth Service" cmd /k "cd backend\auth-service && npm run start:dev"
timeout /t 3 /nobreak > nul

echo Starting User Service...
start "User Service" cmd /k "cd backend\user-service && npm run start:dev"
timeout /t 3 /nobreak > nul

echo Starting Category Service...
start "Category Service" cmd /k "cd backend\category-service && npm run start:dev"
timeout /t 3 /nobreak > nul

echo Starting Management Service...
start "Management Service" cmd /k "cd backend\management-service && npm run start:dev"
timeout /t 3 /nobreak > nul

echo Starting Product Service...
start "Product Service" cmd /k "cd backend\product-service && npm run start:dev"
timeout /t 3 /nobreak > nul

echo Starting Order Service...
start "Order Service" cmd /k "cd backend\order-service && npm run start:dev"
timeout /t 3 /nobreak > nul

echo Starting Payment Service...
start "Payment Service" cmd /k "cd backend\payment-service && npm run start:dev"
timeout /t 3 /nobreak > nul

echo Starting API Gateway...
start "API Gateway" cmd /k "cd backend\api-gateway && npm run start:dev"
timeout /t 5 /nobreak > nul

echo.
echo Starting Frontend...
start "Frontend" cmd /k "cd frontend\web-app && npm run dev"

echo.
echo All services are starting...
echo.
echo Access Points:
echo    - Frontend: http://localhost:4000
echo    - API Gateway: http://localhost:3000
echo.
echo Close the terminal windows to stop the services.
echo.
pause
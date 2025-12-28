# 🛒 NestJS Microservices E-commerce Platform

A full-stack e-commerce platform built with **NestJS microservices architecture** on the backend and **Next.js** on the frontend, featuring separate databases per service and modern cloud infrastructure.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Database Structure](#database-structure)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Microservices](#microservices)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

This is a production-ready e-commerce platform implementing microservices architecture with:

- **8 independent microservices** each with isolated databases
- **API Gateway** for unified client access
- **JWT-based authentication** with role-based access control
- **Real-time communication** between services using TCP
- **File upload** support for product images
- **CMS capabilities** for homepage management
- **Responsive frontend** built with Next.js and TypeScript

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                    Next.js (Port 4000)                       │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP REST API
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway (Port 3000)                  │
│              HTTP → TCP Microservices Bridge                 │
└──┬───────┬───────┬───────┬───────┬───────┬──────┬──────────┘
   │       │       │       │       │       │      │
   ↓       ↓       ↓       ↓       ↓       ↓      ↓
┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐
│Auth│ │User│ │Cat │ │Prod│ │Ordr│ │Pay │ │Mgmt│ │More│
│3001│ │3002│ │3006│ │3003│ │3004│ │3005│ │3007│ │... │
└─┬──┘ └─┬──┘ └─┬──┘ └─┬──┘ └─┬──┘ └─┬──┘ └─┬──┘ └────┘
  │      │      │      │      │      │      │
  ↓      ↓      ↓      ↓      ↓      ↓      ↓
┌─────────────────────────────────────────────────┐
│         MongoDB Atlas - Cluster0                │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐  │
│  │Auth_db │ │User_db │ │Cat_db  │ │Prod_db │  │
│  └────────┘ └────────┘ └────────┘ └────────┘  │
│  ┌────────┐ ┌────────┐ ┌────────┐             │
│  │Order   │ │Payment │ │Mgmt_db │             │
│  └────────┘ └────────┘ └────────┘             │
└─────────────────────────────────────────────────┘
```

### **Communication Pattern:**
- **Client ↔ API Gateway:** HTTP/REST
- **API Gateway ↔ Microservices:** TCP (Request-Response)
- **Auth Service ↔ User Service:** HTTP (for sync)
- **Database per Service:** Isolated MongoDB databases

---

## 🛠️ Tech Stack

### **Backend:**
- **Framework:** NestJS v10
- **Language:** TypeScript
- **Transport:** TCP Microservices
- **Database:** MongoDB (Mongoose ODM)
- **Authentication:** JWT (jsonwebtoken)
- **File Upload:** Multer
- **Validation:** class-validator
- **Password Hashing:** bcrypt

### **Frontend:**
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **UI Library:** React 18
- **Styling:** Tailwind CSS (assumed)
- **HTTP Client:** Fetch API
- **State Management:** React Context/Hooks

### **Infrastructure:**
- **Database:** MongoDB Atlas (Cloud)
- **File Storage:** Local filesystem (uploads/)
- **Process Management:** npm scripts / PM2
- **Version Control:** Git

---

## ✨ Features

### **User Features:**
- ✅ User registration and authentication
- ✅ JWT-based secure sessions
- ✅ Profile management
- ✅ Browse products with filters (category, price, search)
- ✅ View product details
- ✅ Shopping cart functionality
- ✅ Order placement and tracking
- ✅ Payment processing
- ✅ Order history

### **Admin Features:**
- ✅ Product management (CRUD)
- ✅ Category management (CRUD)
- ✅ Order management and status updates
- ✅ User management
- ✅ CMS - Homepage slider management
- ✅ CMS - Section management (featured products, grids)
- ✅ Image upload for products
- ✅ Payment and refund management

### **Technical Features:**
- ✅ Microservices architecture
- ✅ Database per service (isolated data)
- ✅ Role-based access control (user/admin)
- ✅ Data denormalization for performance
- ✅ Automatic user sync between services
- ✅ File upload with validation
- ✅ Query filters and search
- ✅ Error handling and validation

---

## 📦 Prerequisites

Before you begin, ensure you have:

- **Node.js** v18 or higher
- **npm** v9 or higher
- **MongoDB Atlas** account (or local MongoDB)
- **Git**
- **Postman** (optional, for API testing)

---

## 🚀 Installation

### **1. Clone the Repository**

```bash
git clone https://github.com/yourusername/ecommerce-microservices.git
cd ecommerce-microservices
```

### **2. Install All Dependencies**

```bash
# Install backend and frontend dependencies
npm run install:all
```

Or install separately:

```bash
# Backend only
npm run install:backend

# Frontend only
npm run install:frontend
```

### **3. Configure Environment Variables**

Create `.env` files for each service:

```bash
# Auth Service
backend/auth-service/.env

# User Service
backend/user-service/.env

# Category Service
backend/category-service/.env

# Product Service
backend/product-service/.env

# Order Service
backend/order-service/.env

# Payment Service
backend/payment-service/.env

# Management Service
backend/management-service/.env

# API Gateway
backend/api-gateway/.env
```

**See [Environment Variables](#environment-variables) section for required variables.**

### **4. Seed Admin User**

```bash
cd backend/auth-service
npm run seed:admin
```

**Default credentials:**
- Email: `admin@example.com`
- Password: `admin123`

---

## 🏃 Running the Application

### **Option 1: Start All Services (Recommended)**

```bash
# From project root
./start-all.bat   # Windows
./start-all.sh    # Linux/Mac
```

This will start all 8 microservices + frontend in separate terminal windows.

### **Option 2: Start Services Individually**

**Backend Services:**

```bash
# Auth Service (Port 3001)
cd backend/auth-service
npm run start:dev

# User Service (Port 3002, HTTP: 3012)
cd backend/user-service
npm run start:dev

# Category Service (Port 3006)
cd backend/category-service
npm run start:dev

# Product Service (Port 3003)
cd backend/product-service
npm run start:dev

# Order Service (Port 3004)
cd backend/order-service
npm run start:dev

# Payment Service (Port 3005)
cd backend/payment-service
npm run start:dev

# Management Service (Port 3007)
cd backend/management-service
npm run start:dev

# API Gateway (Port 3000)
cd backend/api-gateway
npm run start:dev
```

**Frontend:**

```bash
cd frontend/web-app
npm run dev
```

### **Access Points:**

- **Frontend:** http://localhost:4000
- **API Gateway:** http://localhost:3000
- **API Documentation:** See `Postman_Collection.json`

---

## 📚 API Documentation

### **Import Postman Collection**

1. Open Postman
2. Click **Import**
3. Select `Postman_Collection.json` from project root
4. Collection includes:
   - All endpoints with examples
   - Auto-saved auth tokens
   - Environment variables
   - Pre-request scripts

### **Authentication Flow**

```bash
# 1. Login to get token
POST /auth/login
{
  "email": "admin@example.com",
  "password": "admin123"
}

# 2. Use token in Authorization header
Authorization: Bearer <token>

# 3. Token auto-saved in Postman collection variable
```

### **Quick API Reference**

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/auth/register` | POST | No | Register new user |
| `/auth/login` | POST | No | User login |
| `/products` | GET | No | List products |
| `/products` | POST | Admin | Create product |
| `/categories` | GET | No | List categories |
| `/orders` | POST | User | Create order |
| `/payments/process` | POST | User | Process payment |

**Full documentation:** See `Postman_Collection.json`

---

## 💾 Database Structure

### **MongoDB Atlas - Cluster0**

Each service has its own database:

```
Cluster0/
├── Auth_db/
│   └── users (authentication data)
│
├── User_db/
│   └── users (profile data, synced from Auth_db)
│
├── Category_db/
│   └── categories
│
├── Product_db/
│   └── products (with denormalized category fields)
│
├── Order/
│   └── orders (with snapshot of product data)
│
├── Payment/
│   └── payments (transaction records)
│
└── Management/
    ├── sliders (homepage banners)
    └── sections (homepage content sections)
```

### **Key Design Decisions:**

1. **Database per Service:** Each microservice has isolated data
2. **Denormalization:** Products store `categoryName` and `categorySlug`
3. **Event-Driven Sync:** Auth Service syncs users to User Service via HTTP
4. **Snapshots:** Orders store product details at time of purchase

---

## 📁 Project Structure

```
project_service/
├── backend/
│   ├── api-gateway/          # HTTP → TCP gateway (Port 3000)
│   ├── auth-service/          # Authentication (Port 3001)
│   ├── user-service/          # User profiles (Port 3002)
│   ├── category-service/      # Categories (Port 3006)
│   ├── product-service/       # Products (Port 3003)
│   ├── order-service/         # Orders (Port 3004)
│   ├── payment-service/       # Payments (Port 3005)
│   └── management-service/    # CMS (Port 3007)
│
├── frontend/
│   └── web-app/               # Next.js app (Port 4000)
│       ├── app/               # App router pages
│       ├── components/        # Reusable components
│       ├── hooks/             # Custom hooks
│       └── lib/               # Utilities
│
├── Postman_Collection.json    # API testing collection
├── start-all.bat              # Windows startup script
├── start-all.sh               # Linux/Mac startup script
├── package.json               # Root package.json
└── README.md                  # This file
```

---

## 🔐 Environment Variables

### **Common Variables (All Services)**

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/DATABASE_NAME?appName=Cluster0

# Service Configuration
PORT=3001
HOST=localhost

# JWT Secret (Auth Service & API Gateway)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### **Service-Specific Database Names**

| Service | Database Name | Port |
|---------|---------------|------|
| Auth Service | `Auth_db` | 3001 |
| User Service | `User_db` | 3002 |
| Category Service | `Category_db` | 3006 |
| Product Service | `Product_db` | 3003 |
| Order Service | `Order` | 3004 |
| Payment Service | `Payment` | 3005 |
| Management Service | `Management` | 3007 |

### **User Service Additional Variables**

```env
HTTP_PORT=3012
USER_SERVICE_HTTP_URL=http://localhost:3012
```

### **Example .env Files**

**Auth Service:**
```env
MONGODB_URI=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/Auth_db?appName=Cluster0
PORT=3001
JWT_SECRET=your-secret-key
USER_SERVICE_HTTP_URL=http://localhost:3012
```

**Product Service:**
```env
MONGODB_URI=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/Product_db?appName=Cluster0
PORT=3003
API_GATEWAY_URL=http://localhost:3000
```

---

## 🔬 Microservices

### **1. API Gateway (Port 3000)**

**Responsibility:** HTTP entry point, routes requests to microservices

**Technologies:** NestJS, HTTP, TCP Client

**Endpoints:** All public-facing REST APIs

### **2. Auth Service (Port 3001)**

**Responsibility:** User authentication and JWT generation

**Database:** `Auth_db` (users with passwords)

**Key Features:**
- User registration
- Login with JWT
- Token validation
- Auto-sync to User Service

### **3. User Service (Port 3002)**

**Responsibility:** User profile management

**Database:** `User_db` (user profiles without passwords)

**Key Features:**
- Profile CRUD
- Address management
- Hybrid mode (TCP + HTTP)
- Sync endpoint for Auth Service

### **4. Category Service (Port 3006)**

**Responsibility:** Product category management

**Database:** `Category_db`

**Key Features:**
- Category CRUD
- Slug-based lookup
- Active/inactive status

### **5. Product Service (Port 3003)**

**Responsibility:** Product catalog management

**Database:** `Product_db` (with denormalized category data)

**Key Features:**
- Product CRUD
- Search and filtering
- Category denormalization
- Image URL transformation

### **6. Order Service (Port 3004)**

**Responsibility:** Order processing and management

**Database:** `Order` (with product snapshots)

**Key Features:**
- Order creation
- Status management
- User order history
- Admin order overview

### **7. Payment Service (Port 3005)**

**Responsibility:** Payment processing

**Database:** `Payment`

**Key Features:**
- Payment processing
- Transaction tracking
- Refund management
- Payment status lookup

### **8. Management Service (Port 3007)**

**Responsibility:** CMS content management

**Database:** `Management` (sliders, sections)

**Key Features:**
- Homepage slider management
- Content section management
- Display order control
- Active/inactive status

---

## 🧪 Testing

### **Unit Tests**

```bash
# Run tests for a specific service
cd backend/auth-service
npm test

# Run tests with coverage
npm run test:cov
```

### **Integration Tests**

```bash
# Test API endpoints
npm run test:e2e
```

### **Manual Testing with Postman**

1. Import `Postman_Collection.json`
2. Login to get auth token
3. Test endpoints in order:
   - Auth → Categories → Products → Orders → Payments

### **Test Admin Access**

```bash
# Login as admin
POST http://localhost:3000/auth/login
{
  "email": "admin@example.com",
  "password": "admin123"
}

# Create category (admin only)
POST http://localhost:3000/categories
Authorization: Bearer <token>
{
  "name": "Electronics",
  "slug": "electronics"
}
```

---

## 🚢 Deployment

### **Production Checklist**

- [ ] Change default admin password
- [ ] Set strong JWT_SECRET
- [ ] Configure MongoDB IP whitelist
- [ ] Set up environment variables in hosting
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up monitoring (PM2, New Relic)
- [ ] Configure load balancer
- [ ] Set up backup strategy
- [ ] Enable logging (Winston, ELK)
- [ ] Set up CI/CD pipeline

### **Deployment Options**

#### **Option 1: Docker & Kubernetes**

```bash
# Build Docker images
docker-compose build

# Deploy to Kubernetes
kubectl apply -f k8s/
```

#### **Option 2: Cloud Platforms**

- **Backend:** AWS ECS, Google Cloud Run, Azure Container Apps
- **Frontend:** Vercel, Netlify, AWS Amplify
- **Database:** MongoDB Atlas (already cloud)

#### **Option 3: VPS with PM2**

```bash
# Install PM2
npm install -g pm2

# Start services
pm2 start ecosystem.config.js

# Monitor
pm2 monit
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### **Coding Standards**

- Follow NestJS best practices
- Use TypeScript strict mode
- Write meaningful commit messages
- Add tests for new features
- Update documentation

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **Your Name** - *Initial work* - [GitHub](https://github.com/yourusername)

---

## 🙏 Acknowledgments

- NestJS community
- MongoDB documentation
- Next.js team
- Open source contributors

---

## 📞 Support

- **Documentation:** See `/docs` folder
- **Issues:** GitHub Issues
- **Email:** support@example.com
- **Discord:** [Join our server](https://discord.gg/example)

---

## 📈 Roadmap

### **Phase 1 (Current)**
- ✅ Microservices architecture
- ✅ Database separation
- ✅ Basic e-commerce features
- ✅ Admin panel

### **Phase 2 (Next)**
- [ ] Event-driven architecture (RabbitMQ/Kafka)
- [ ] Real-time notifications (WebSockets)
- [ ] Advanced search (Elasticsearch)
- [ ] Caching layer (Redis)

### **Phase 3 (Future)**
- [ ] Multi-vendor support
- [ ] Recommendation engine
- [ ] Analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Internationalization (i18n)

---

## 🔗 Related Documentation

- [Postman Collection](./Postman_Collection.json) - API endpoints
- [Database Changes](./docs/DATABASE_SEPARATION_CHANGES.md) - Architecture details
- [Admin Guide](./docs/ADMIN_CREDENTIALS.md) - Admin user management
- [Deployment Guide](./docs/DEPLOYMENT_CHECKLIST.md) - Production deployment

---

**Built with ❤️ using NestJS and Next.js**

**⭐ If you found this helpful, please star the repo!**


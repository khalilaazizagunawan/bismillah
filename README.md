# Toko Kue - Cake Store Management System

A full-stack cake store management system with microservices backend and React frontend.

## Features

### Customer Features
- Browse cake catalog
- Add cakes to cart
- Place orders
- View order history

### Admin Features
- Admin authentication
- Manage cakes (CRUD operations)
- View and manage orders
- Update order status
- Inventory management
- Payment management
- Procurement management

## Architecture

### Backend (Microservices)
- **Gateway**: GraphQL API gateway that combines all services
- **Product Service**: Manages cake/products data
- **Order Service**: Handles customer orders
- **Inventory Service**: Manages stock levels
- **Payment Service**: Handles supplier payments
- **Procurement Service**: Manages purchase orders
- **Integration Service**: External supplier integration

### Frontend
- React with Vite
- Apollo Client for GraphQL
- Tailwind CSS for styling
- React Router for navigation

## Tech Stack

- **Backend**: Node.js, Express, PostgreSQL, GraphQL
- **Frontend**: React, Apollo Client, Tailwind CSS
- **Database**: PostgreSQL
- **Containerization**: Docker & Docker Compose

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js (for local development)

### Quick Start with Docker

1. Clone the repository
2. Navigate to the project directory
3. Run the application:

```bash
docker-compose up --build
```

4. Access the application:
   - **Frontend (Customer/Admin)**: http://localhost:5173
   - **GraphQL API**: http://localhost:4000/graphql

### Admin Login
- Email: admin@toko-kue.com
- Password: admin123

### Services URLs (for development)
- Gateway: http://localhost:4000
- Product Service: http://localhost:4001
- Inventory Service: http://localhost:4002
- Procurement Service: http://localhost:4003
- Payment Service: http://localhost:4004
- Order Service: http://localhost:4005
- Integration Service: http://localhost:4006

## Development

### Running Services Individually

1. Start PostgreSQL:
```bash
docker-compose up postgres
```

2. Start individual services:
```bash
# In separate terminals
cd backend/gateway && npm install && npm start
cd backend/product-service && npm install && npm start
# ... etc for other services
```

3. Start frontend:
```bash
cd frontend && npm install && npm run dev
```

## Database Schema

The system uses multiple PostgreSQL databases:
- `product_db`: Cakes/products data
- `inventory_db`: Stock management
- `order_db`: Customer orders
- `payment_db`: Supplier payments
- `procurement_db`: Purchase orders
- `integration_db`: External integrations

## API Documentation

GraphQL API documentation available at: http://localhost:4000/graphql

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database
POSTGRES_USER=toko_user
POSTGRES_PASSWORD=secret123
POSTGRES_DB=toko_kue_db

# Supplier Integration
SUPPLIER_API_URL=http://localhost:5000
STORE_NAME=Toko Kue Anda

# Frontend
VITE_API_URL=http://localhost:4000/graphql
```

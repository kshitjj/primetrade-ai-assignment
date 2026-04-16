# PrimeTrade AI — Backend Intern Assignment

A full-stack e-commerce REST API with JWT authentication, role-based access control, and a React frontend. Built with Node.js, Express, PostgreSQL, Redis, and Docker.

---

## Tech Stack

**Backend** — Node.js, Express, TypeScript, PostgreSQL (node-postgres), Redis, BullMQ, MinIO (S3-compatible), Razorpay

**Frontend** — React, TypeScript, Vite, Tailwind CSS, Axios

**Infrastructure** — Docker, Kubernetes (k8s/)

---

## Project Structure

```
.
├── backend/         # Express API
├── frontend/        # React app
├── k8s/             # Kubernetes manifests
├── init.sql         # Database schema
└── makefile         # Root-level shortcuts
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis
- Docker (optional)

### 1. Clone the repository

```bash
git clone https://github.com/kshitijrajgude/primetrade-ai-assignment
cd primetrade-ai-assignment
```

### 2. Set up the database

```bash
psql -U postgres -c "CREATE DATABASE primetrade;"
psql -U postgres -d primetrade -f init.sql
```

### 3. Configure environment variables

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
API_PORT=3000
JWT_SECRET=your_jwt_secret

DB_HOST=localhost
DB_PORT=5432
DB_USER=primetrade
DB_PASSWORD=primetrade
DB_NAME=primetrade

AWS_ENDPOINT=http://localhost:9000
AWS_ACCESS_KEY=minioadmin
AWS_SECRET_KEY=minioadmin
AWS_BUCKET=products
AWS_REGION=us-east-1

RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=xxxx
```

### 4. Run the backend

```bash
cd backend
npm install
npm run dev
```

API runs at `http://localhost:3000`
Swagger docs at `http://localhost:3000/api-docs`

### 5. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## Running with Docker

```bash
cd backend
make build-image
make run-docker
```

---

## API Overview

All routes are versioned under `/api/v1`.

| Method | Route | Auth | Role |
|--------|-------|------|------|
| POST | `/api/v1/auth/register` | No | — |
| POST | `/api/v1/auth/login` | No | — |
| GET | `/api/v1/products` | No | — |
| POST | `/api/v1/products` | Yes | Admin |
| PUT | `/api/v1/products/:id` | Yes | Admin |
| DELETE | `/api/v1/products/:id` | Yes | Admin |
| GET | `/api/v1/cart` | Yes | User |
| POST | `/api/v1/cart` | Yes | User |
| DELETE | `/api/v1/cart/:id` | Yes | User |
| POST | `/api/v1/orders` | Yes | User |
| GET | `/api/v1/orders` | Yes | User |
| PUT | `/api/v1/orders/:id/status` | Yes | Admin |
| POST | `/api/v1/payments/create/:id` | Yes | User |
| POST | `/api/v1/payments/verify` | Yes | User |

Full interactive documentation available at `/api-docs` (Swagger UI).

---

## Database Schema

```sql
users        — id, email, password (bcrypt), role, created_at
products     — id, name, description, price, stock, image_url, created_at
orders       — id, user_id, status, total, created_at
order_items  — id, order_id, product_id, quantity, price
cart_items   — id, user_id, product_id, quantity
```

---

## Authentication

JWT tokens are issued on login and must be passed as a Bearer token in the `Authorization` header:

```
Authorization: Bearer <token>
```

Tokens carry `id`, `email`, and `role` claims. Role-based middleware blocks non-admin users from write operations on products and order status updates.

---

## Scalability Notes

**API versioning** — Routes are namespaced under `/api/v1/`. A v2 would be introduced as a parallel router without modifying existing endpoints, ensuring zero breaking changes for existing clients.

**Caching** — Redis is integrated for session-aware caching. High-read endpoints like product listings are candidates for cache-aside pattern as traffic scales.

**Async processing** — Order creation uses BullMQ queues with a dedicated worker (`orderWorker.ts`), decoupling order processing from the request lifecycle. This allows horizontal scaling of workers independently from the API.

**Horizontal scaling** — The stateless API design means multiple instances can run behind a load balancer. The included Kubernetes manifests (`k8s/`) define deployments and services for all components (API, frontend, PostgreSQL, Redis, MinIO).

**Future scope** — Product filtering, search, and pagination are intentionally left as future scope to keep the initial API surface minimal and testable. The modular route structure (`routes/v1/`) makes adding new versioned modules straightforward.

---

## Frontend

The React frontend connects to the backend API and supports:

- User registration and login
- JWT-protected dashboard
- Product listing (all users)
- Product create, edit, delete (admin only)
- Cart management

Admin controls are conditionally rendered based on the `role` claim decoded from the JWT.

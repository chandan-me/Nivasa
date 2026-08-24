# 🏢 ApartmentHub

### **Smart Living. Connected Community.**

**ApartmentHub** is a modern residential community management platform designed to bring **residents, management teams, services, communication, and community operations** together in one connected digital ecosystem.

From managing resident information and maintenance requests to handling announcements and community activities, ApartmentHub simplifies everyday apartment management through a clean, scalable, and responsive platform.

---

## ✨ What is ApartmentHub?

ApartmentHub transforms traditional apartment administration into a centralized digital experience.

### 🏠 For Residents

* Manage personal and household information
* Submit and track maintenance requests
* View community announcements
* Access important apartment-related information
* Stay connected with community activities

### 🛡️ For Management

* Manage residents and apartment units
* Track service and maintenance requests
* Publish announcements and updates
* Monitor community operations
* Maintain structured and secure records

---

## 🚀 Technology Stack

### Frontend

* **React** — Component-based UI
* **Vite** — Fast development and build tooling
* **Tailwind CSS** — Responsive utility-first styling
* **Lucide Icons** — Modern icon system
* **Axios** — API communication
* **React Router** — Client-side navigation

### Backend

* **Python** — Core backend language
* **FastAPI** — High-performance REST API framework
* **SQLAlchemy 2.x** — Database ORM
* **Pydantic** — Data validation and serialization
* **Alembic** — Database migration management

### Database

* **PostgreSQL** — Relational data storage

---

## 📁 Project Architecture

```text
ApartmentHub/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── seed/
│   │   └── main.py
│   │
│   ├── alembic/
│   ├── requirements.txt
│   ├── .env.example
│   └── ...
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── routes/
│   │   └── App.jsx
│   │
│   ├── package.json
│   └── ...
│
└── README.md
```

---

# ⚙️ Local Development

## 1. Clone the Project

```bash
git clone <your-repository-url>
cd ApartmentHub
```

---

# 🔧 Backend Configuration

### Navigate to the backend

```bash
cd backend
```

### Create a virtual environment

**Windows**

```bash
python -m venv venv
venv\Scripts\activate
```

**macOS / Linux**

```bash
python3 -m venv venv
source venv/bin/activate
```

### Install dependencies

```bash
pip install -r requirements.txt
```

### Configure environment variables

Create a `.env` file based on `.env.example`:

```env
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/apartmenthub_db
JWT_SECRET_KEY=your-secret-key
FRONTEND_URL=http://localhost:5173
```

Update the values according to your local PostgreSQL configuration.

---

# 🗄️ Database Setup

Make sure PostgreSQL is running and the `apartmenthub_db` database exists.

Run the migrations:

```bash
alembic upgrade head
```

Populate the development database with initial data:

```bash
python -m app.seed.seed_database
```

---

# ▶️ Start the Backend

```bash
uvicorn app.main:app --reload
```

The API will be available at:

```text
http://localhost:8000
```

FastAPI's interactive documentation:

```text
http://localhost:8000/docs
```

Alternative API documentation:

```text
http://localhost:8000/redoc
```

---

# 🎨 Frontend Setup

Open a new terminal and navigate to the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

---

# 🔄 Development Flow

```text
React + Vite
     │
     │ Axios / REST API
     ▼
FastAPI Backend
     │
     │ SQLAlchemy 2.x
     ▼
PostgreSQL
```

Database changes are managed through:

```text
SQLAlchemy Models
        ↓
Alembic Migration
        ↓
PostgreSQL
```

---

# 🧪 Recommended Development Workflow

When making database-related changes:

```bash
# 1. Modify your SQLAlchemy models

# 2. Generate migration
alembic revision --autogenerate -m "describe your change"

# 3. Review the generated migration

# 4. Apply it
alembic upgrade head
```

For application changes:

```bash
# Backend
uvicorn app.main:app --reload

# Frontend
npm run dev
```

---

# 🔐 Environment & Security

Never commit your real `.env` file or production credentials.

Add the following to `.gitignore`:

```gitignore
.env
.env.*
!.env.example
venv/
__pycache__/
node_modules/
dist/
*.pyc
```

Use strong, randomly generated secrets for production deployments.

---

# 🌱 Project Vision

ApartmentHub aims to create a **single digital home for modern residential communities** — reducing administrative overhead while giving residents a faster, clearer, and more connected way to interact with their community.

> **One community. One platform. Smarter living.**

---

## 📌 Project Status

**Environment:** Local Development
**Backend:** FastAPI
**Frontend:** React + Vite
**Database:** PostgreSQL
**Migration System:** Alembic

---

## 👨‍💻 Development

ApartmentHub is structured as a modular full-stack application so that individual features can evolve independently while maintaining a consistent API, database, and user experience.

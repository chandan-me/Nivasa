# ApartmentHub

> Smart Living. Connected Community.

ApartmentHub is a comprehensive residential community management platform.

## Technology Stack
- **Frontend**: React + Vite (Tailwind CSS, Lucide Icons, Axios, React Router)
- **Backend**: Python + FastAPI (SQLAlchemy 2.x, Pydantic, Alembic)
- **Database**: PostgreSQL

## Local Setup

### Backend Setup
1. Navigate to `/backend`
2. Create virtual environment: `python -m venv venv`
3. Activate virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Create `.env` file from `.env.example`
6. Run database migrations: `alembic upgrade head`
7. Run seed script: `python -m app.seed.seed_database`
8. Start backend server: `uvicorn app.main:app --reload`

### Frontend Setup
1. Navigate to `/frontend`
2. Install dependencies: `npm install`
3. Run Vite dev server: `npm run dev`

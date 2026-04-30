# Wall-awe

Welcome to the **Wallawe** repository! This is a waste management platform consisting of a Next.js frontend and a FastAPI backend.

## Project Structure
- `/frontend` - Contains the Next.js frontend application. (Soon)
- `/backend` - Contains the FastAPI backend logic, database models, and migration scripts.

---

## Setup & Installation

Before running the backend services, you need to install all the required Python dependencies. Make sure you are in the root directory of this repository and run the following command:

```bash
pip install -r requirements.txt
```
_Note: It is recommended to run this inside a virtual environment._

## Database & User Management

Please ensure you are running these commands from the root directory of this repository.

1. Update Database
If you want to update your database to the latest version, run:
```bash
alembic upgrade head
```
2.  Add a New User
To create a new regular user in the system, run:
```bash
python3 -m backend.create_user.py
```
3.  Add a New Admin
To create a new admin, run:
```bash
python3 -m backend.create_admin.py
```

## Environment Variables

To make this repository work properly, you would need these variables:
1. DATABASE_URL
2. SECRET_KEY
3. ALGORITHM
4. ACCESS_TOKEN_EXPIRE_HOURS
5. AI_MODEL_URL

# Internship & Placement Management System

Starter full-stack college project:
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MySQL

## Requirements
Install Node.js and MySQL Server. Use MySQL Workbench to run `database/schema.sql`.

## 1. Create the database
Open MySQL Workbench, open `database/schema.sql`, and execute it.

## 2. Configure backend
Open a terminal:
```bash
cd backend
npm install
```
Edit `.env` and set your local MySQL username/password. The default configuration assumes MySQL is on localhost:3306 and the database user is `root`.

Start backend:
```bash
npm run dev
```
The API runs at http://localhost:5000. Test http://localhost:5000/api/health.

## 3. Start frontend
Open another terminal:
```bash
cd frontend
npm install
npm run dev
```
Open the URL printed by Vite (normally http://localhost:5173).

## Included features
- Browse internships from MySQL
- Add internships through the demo form
- Submit a student application
- View applications
- Basic dashboard counts

## Notes
This is a college-project starter, not a production-ready deployment. It does not include secure user login/role permissions yet. Add authentication before using it with real student data.

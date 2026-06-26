# DEVELOPER HANDBOOK - SAMS ATLAS PLATFORM

## 1. Introduction
Welcome to the SAMS ATLAS Platform. This document is designed for new developers taking over the project to ensure safe maintenance and continuity.

## 2. Local Setup & Deployment
### Prerequisites
- Node.js (v18+)
- MySQL (via XAMPP, Laragon, or standalone)
- Git

### Installation
1. **Clone & Install Dependencies**
   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   ```
2. **Environment Variables**
   - In `/backend`, copy `.env.example` to `.env`. Ensure `DATABASE_URL` points to your MySQL instance.
   - In `/frontend`, copy `.env.example` to `.env`. Ensure `VITE_API_URL` points to the backend (usually `http://localhost:5000/api`).
3. **Database Setup**
   - Ensure MySQL is running.
   - Run Prisma push to sync schema:
     ```bash
     cd backend && npx prisma db push
     ```
4. **Start Servers**
   - Run `npm run dev` in both `frontend` and `backend` folders.

## 3. Critical Dependencies to Watch
*Modifying one of these tables or modules will break the system if not handled carefully.*

- **`classes` / `academic_classes` Table**: The entire system revolves around the class structure. Deleting a class will cascade and delete all enrolled students, assigned teachers, syllabus topics, and homework. **Do not modify the cascade rules lightly.**
- **`teachers` Profile vs `users` Account**: Every teacher has a `users` record (for auth) and a `teachers` record (for profile/metadata). Never create one without the other. This is handled transactionally in `teachersController.js`.
- **Teacher Performance Calculation**: The formula resides in `backend/src/controllers/performanceController.js` inside the `getAutoScores()` and `getAllPerformance()` functions. If the client requests weightage changes (e.g., from 15% Syllabus to 20%), you MUST update the formula string here.

## 4. Troubleshooting Guide

### Issue: "Network Error" or API calls failing in browser.
**Cause**: The backend is not running, or CORS is blocking the request.
**Fix**: 
1. Check terminal for backend server status.
2. Check `ALLOWED_ORIGINS` in `backend/.env`. The frontend URL (e.g., `http://localhost:5173`) must be perfectly matched.

### Issue: Teacher logs in but sees "Access Denied" or empty data.
**Cause**: JWT role mismatch, or the Teacher profile is marked `is_deleted = 1` or `status = inactive`.
**Fix**: Check the `users` table for `role = 'teacher'` and the corresponding `teachers` table for `status`.

### Issue: Performance Dashboard shows 0% for everything.
**Cause**: The teacher has no `teacher_subjects` assigned, no `syllabus` tasks mapped, and no `class_observations`. Performance is dynamic.
**Fix**: Admin must assign subjects, ensure micro-schedule is populated, and conduct an observation.

### Issue: Prisma / MySQL Connection Failed.
**Cause**: XAMPP MySQL service is off, or the `DATABASE_URL` is pointing to the wrong port.
**Fix**: Open XAMPP Control Panel, ensure MySQL is green. Check `DATABASE_URL="mysql://root:@127.0.0.1:3306/atlas_sams_db"`.

## 5. Adding a New Feature (Best Practices)
1. **Database First**: If the feature requires storage, add the model to `backend/prisma/schema.prisma`. Run `npx prisma db push`.
2. **Backend API**: Create a new route in `backend/src/routes/` and a controller in `backend/src/controllers/`.
3. **Security**: Add `authenticate` middleware. If admin-only, add `roleCheck(['admin'])`.
4. **Frontend API Map**: Add the Axios wrapper function to `frontend/src/api/index.js` or `frontend/src/services/schoolApi.js`.
5. **Frontend UI**: Create the React page and import your API wrapper.

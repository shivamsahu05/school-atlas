# SYSTEM ARCHITECTURE - SAMS ATLAS PLATFORM

## 1. Project Overview & Tech Stack
The SAMS ATLAS Platform is a comprehensive School Academic Management System designed to handle administrative operations, teacher workflows, syllabus tracking, LMS analytics, and student management.

**Core Technologies:**
- **Frontend**: React (Vite), Tailwind CSS, Lucide React (Icons), Axios, Recharts (for Analytics)
- **Backend**: Node.js, Express.js
- **Database**: MySQL, managed via Prisma ORM (`schema.prisma`)
- **Authentication**: JWT (JSON Web Tokens), Role-Based Access Control (RBAC)
- **Password Hashing**: bcrypt

## 2. System Deployment Architecture
The system follows a typical Client-Server architecture:
1. **Client (Browser)**: Serves the compiled Vite React Single Page Application (SPA).
2. **API Server (Express/Node)**: A RESTful layer exposing JSON endpoints. Uses CORS to strictly allow requests from the designated frontend origins.
3. **Database (MySQL)**: Holds persistent data. The API server talks to the DB synchronously via Prisma ORM queries.

## 3. Frontend Architecture
**Directory: `frontend/`**

### Structure:
* `src/api/index.js` - Centralized API wrapper. Exposes isolated service objects (e.g., `teachersApi`, `dashboardApi`) managing Axios configs, request/response interceptors, and exponential retry logic for failed requests.
* `src/components/` - Reusable UI components (buttons, modals, headers).
* `src/context/` - Global state providers (e.g., `AuthContext.jsx` for managing the JWT session and user roles).
* `src/pages/`
  * `principal/` - Contains all Admin Portal modules (AdminDashboard, AdminTeachers, AdminAcademics, etc.).
  * `teacher/` - Contains all Teacher Portal modules (TeacherDashboard, TeacherSyllabus, etc.).
  * `public/` - Public facing pages like Login.

### Routing Mechanism
React Router DOM is used. Routes are split between:
- Public Routes (`/login`)
- Protected Teacher Routes (`/teacher/*`)
- Protected Admin Routes (`/admin/*`)
Auth guards wrap the protected routes.

## 4. Backend Architecture
**Directory: `backend/`**

### Structure:
* `src/app.js` - Application entry point. Wires up Express, CORS, Helmet, and maps all routers to `/api/*`.
* `src/routes/` - Maps HTTP Methods/URLs to controller actions. Applies `authenticate` and `roleCheck` middlewares.
* `src/controllers/` - Contains the core business logic (e.g., `teachersController.js`, `performanceController.js`). All database queries using Prisma are executed here.
* `src/middleware/`
  * `auth.js` - Validates JWTs and verifies User roles.
  * `errorHandler.js` - Global try-catch handlers to prevent server crashes.
* `prisma/schema.prisma` - The exact blueprint of the MySQL database.

## 5. Security & Authorization Flow
1. **Login**: User submits credentials to `/api/auth/login`. Server compares password hash via `bcrypt` and issues a JWT containing `id` and `role`.
2. **Storage**: Frontend stores the JWT in `localStorage` under `sams_session`.
3. **Transport**: `api.interceptors.request` automatically attaches `Authorization: Bearer <token>` to every outbound request.
4. **Validation**: Backend `authenticate` middleware intercepts requests, verifies the JWT signature, and attaches `req.user`.
5. **Role Check**: Endpoints restricted to admins utilize `roleCheck(['admin'])`. If a Teacher attempts access, a 403 Forbidden is returned.

## 6. End-to-End Data Flow Example (Teacher Performance)
1. **Trigger**: Admin requests the performance dashboard.
2. **Frontend**: Calls `performanceApi.getAll()`.
3. **Network**: Request sent to `GET /api/performance/all`.
4. **Backend Route**: `performance.js` catches the request, passes to `auth` middleware.
5. **Controller**: `performanceController.js` accesses `prisma.performance_scores`. If recalculation is required, it pulls data from `syllabus`, `class_observations`, and `learning_outcomes`.
6. **Response**: JSON array of scores returned to Frontend.
7. **UI**: React states update, Recharts renders graphs based on the data.

# SAMS - ATLAS PLATFORM

## 1. Project Overview
**Project Name**: SAMS - ATLAS Platform
**Project Type**: School Academic Management System

The SAMS ATLAS Platform is a comprehensive, production-ready full-stack application designed to manage the academic lifecycle of a school. It provides dedicated portals for the **Principal (Admin)** and **Teachers**, unifying Syllabus Tracking, Classroom Observations, Homework Management, Timetable Scheduling, and AI-driven LMS Analytics into a single dashboard.

## 2. Documentation Directory
A complete suite of technical documentation has been generated for this project to ensure zero knowledge loss and seamless onboarding for future developers. Please refer to the `docs/` folder for exhaustive details:

* [System Architecture](./docs/SYSTEM_ARCHITECTURE.md) - High-level tech stack, auth flows, and structure.
* [Database Documentation](./docs/DATABASE_DOCUMENTATION.md) - ER definitions, Table structures, and Cascades.
* [API Documentation](./docs/API_DOCUMENTATION.md) - Exhaustive REST endpoint mapping, payloads, and roles.
* [Module Documentation](./docs/MODULE_DOCUMENTATION.md) - Deep dive into Admin & Teacher module workflows.
* [Testing Guide](./docs/TESTING_GUIDE.md) - Integration testing flows and QA edge cases.
* [Developer Handbook](./docs/DEVELOPER_HANDBOOK.md) - Onboarding, troubleshooting, and critical dependency warnings.

## 3. High-Level Folder Structure
```
school-atlas/
├── backend/                  # Node.js + Express.js API Server
│   ├── prisma/               # Database ORM Schema (schema.prisma)
│   ├── src/
│   │   ├── controllers/      # Core business logic & DB Queries
│   │   ├── middleware/       # JWT Auth and Error Handling
│   │   ├── routes/           # Express endpoint mappings
│   │   └── app.js            # Server entry point
│   ├── package.json          # Backend Dependencies
│   └── .env                  # DB Connection String (Local/Prod)
│
├── frontend/                 # React SPA (Vite + TailwindCSS)
│   ├── src/
│   │   ├── api/              # Axios wrappers (index.js) mapping to backend endpoints
│   │   ├── components/       # Reusable UI elements (Headers, Modals, Forms)
│   │   ├── context/          # React Context (AuthContext for JWT state)
│   │   ├── pages/            
│   │   │   ├── principal/    # Admin Portal Views
│   │   │   ├── teacher/      # Teacher Portal Views
│   │   │   └── public/       # Login Views
│   │   ├── App.jsx           # React Router DOM definitions
│   │   └── main.jsx          # React Root
│   └── package.json          # Frontend Dependencies
│
├── docs/                     # Generated System Documentation
└── README.md                 # This file
```

## 4. Quickstart Guide
To run the SAMS ATLAS Platform locally:

1. **Start MySQL Database**: Open XAMPP/Laragon and ensure the MySQL service is running on Port `3306`.
2. **Backend**:
   ```bash
   cd backend
   npm install
   npx prisma db push
   npm run dev
   ```
3. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
4. **Access**: 
   - Open browser to `http://localhost:5173` (or `3000` depending on Vite port).
   - Use your Teacher or Admin credentials to log in.

## 5. Critical Note to Future Developers
**DO NOT MODIFY** the database schema (`schema.prisma`) without fully understanding the cascading foreign keys mapping `classes`, `teachers`, and `students`. This system relies on a highly normalized relational model. Removing a foundational record (like a class) will permanently delete all associated syllabus data, homework, and performance metrics. 

*Please review the [Developer Handbook](./docs/DEVELOPER_HANDBOOK.md) before making structural code changes.*

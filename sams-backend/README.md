# SAMS Backend API
### Node.js + Express + Prisma + MySQL · Production-Ready

---

## 🚀 Quick Setup (5 steps)

### Step 1 — Install dependencies
```bash
cd sams-backend
npm install
```

### Step 2 — Configure environment
```bash
cp .env.example .env
# Edit .env and set your MySQL credentials:
# DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/atlas_sams_db"
```

### Step 3 — Create the database
```bash
# Import the provided SQL schema:
mysql -u root -p < atlas_sams_db.sql

# OR run Prisma push (if schema already exists):
npx prisma db push
```

### Step 4 — Seed demo data
```bash
npm run db:seed
```
This creates:
- Admin:   `admin@sams.com` / `Admin@123`
- Teacher: `teacher@sams.com` / `Teacher@123`
- 12 students, 10 syllabus topics, homework, LO records, observations, leaves

### Step 5 — Start the server
```bash
npm run dev          # Development (nodemon)
npm start            # Production
```

Server runs at: **http://localhost:5000**
Health check: **GET http://localhost:5000/health**

---

## 📁 Project Structure

```
sams-backend/
├── prisma/
│   └── schema.prisma              # ORM schema (mirrors atlas_sams_db exactly)
├── src/
│   ├── app.js                     # Express entry point, all middleware + routes
│   ├── config/
│   │   └── db.js                  # Prisma client singleton
│   ├── controllers/
│   │   ├── authController.js      # login, getMe
│   │   ├── usersController.js     # CRUD users (admin)
│   │   ├── studentsController.js  # CRUD students
│   │   ├── classesController.js   # list classes + subjects
│   │   ├── syllabusController.js  # syllabus + auto-completion stats
│   │   ├── homeworkController.js  # homework + submissions + late detection
│   │   ├── loController.js        # learning outcomes + auto-status
│   │   ├── observationsController.js # observations + recalcPerformance()
│   │   ├── performanceController.js  # weighted teacher scoring
│   │   ├── leaveController.js     # leave apply/approve/reject
│   │   └── dashboardController.js # rich teacher + admin dashboards
│   ├── routes/
│   │   ├── auth.js · users.js · students.js · classes.js
│   │   ├── syllabus.js · homework.js · lo.js
│   │   ├── observations.js · performance.js · leave.js · dashboard.js
│   ├── middleware/
│   │   ├── auth.js                # authenticate (JWT), roleCheck
│   │   └── errorHandler.js        # global error + 404 handlers
│   ├── validators/
│   │   └── index.js               # Joi schemas for all endpoints
│   └── utils/
│       ├── response.js            # sendSuccess, sendError, paginated
│       ├── jwt.js                 # signToken, verifyToken
│       ├── pagination.js          # parsePagination helper
│       └── seed.js                # Database seeder
├── FRONTEND_API_SERVICE.js        # Drop into sams-web/src/api/index.js
├── FRONTEND_AuthContext.jsx       # Drop into sams-web/src/context/AuthContext.jsx
├── SAMS_API.postman_collection.json
├── .env.example
└── package.json
```

---

## 🔑 API Reference

### Authentication
| Method | Endpoint           | Auth | Body / Params                           |
|--------|--------------------|------|----------------------------------------|
| POST   | /api/auth/login    | ✗    | `{ email, password }`                  |
| GET    | /api/auth/me       | ✓    | —                                       |

### Users (Admin only)
| Method | Endpoint           | Body / Params                                       |
|--------|--------------------|-----------------------------------------------------|
| GET    | /api/users         | `?role=&status=&search=&page=&limit=`              |
| GET    | /api/users/:id     | —                                                   |
| POST   | /api/users         | `{ name, email, password, role, phone? }`          |
| PUT    | /api/users/:id     | any subset of above                                 |
| DELETE | /api/users/:id     | —                                                   |

### Students
| Method | Endpoint              | Body / Params                                    |
|--------|-----------------------|--------------------------------------------------|
| GET    | /api/students         | `?class_id=&search=&page=&limit=`               |
| GET    | /api/students/:id     | —                                                |
| POST   | /api/students         | `{ name, roll_no, class_id, email?, gender? }`  |
| PUT    | /api/students/:id     | any subset of above                              |
| DELETE | /api/students/:id     | — (admin only)                                   |

### Syllabus
| Method | Endpoint              | Body / Params                                                  |
|--------|-----------------------|----------------------------------------------------------------|
| GET    | /api/syllabus         | `?class_id=&subject_id=&is_completed=true/false`              |
| GET    | /api/syllabus/:id     | —                                                              |
| POST   | /api/syllabus         | `{ class_id, subject_id, topic, chapter?, planned_date? }`    |
| PUT    | /api/syllabus/:id     | `{ is_completed?, topic?, planned_date? }`                     |

### Homework
| Method | Endpoint                        | Body / Params                                       |
|--------|---------------------------------|-----------------------------------------------------|
| GET    | /api/homework                   | `?class_id=&subject_id=&teacher_id=`               |
| GET    | /api/homework/:id               | —                                                   |
| GET    | /api/homework/:id/submissions   | — (returns defaulters + submission %)               |
| POST   | /api/homework                   | `{ class_id, subject_id, description, due_date? }` |
| POST   | /api/homework/:id/submit        | `{ student_id, score? }` — auto-detects late       |
| PUT    | /api/homework/submission/:id    | `{ status?, score? }`                               |

### Learning Outcomes
| Method | Endpoint    | Body / Params                                                        |
|--------|-------------|----------------------------------------------------------------------|
| GET    | /api/lo     | `?student_id=&subject_id=&class_id=&status=`                        |
| POST   | /api/lo     | `{ student_id, subject_id, topic?, teacher_score?, principal_score? }` |
| PUT    | /api/lo/:id | any subset of above — status auto-computed from score if omitted     |

### Observations
| Method | Endpoint           | Body / Params                                         |
|--------|--------------------|-------------------------------------------------------|
| GET    | /api/observations  | `?teacher_id=` — returns avg/min/max stats           |
| POST   | /api/observations  | `{ teacher_id, total_score, observation_date? }` (admin) |

### Performance
| Method | Endpoint                      | Notes                                    |
|--------|-------------------------------|------------------------------------------|
| GET    | /api/performance/all          | Admin only. Recalcs all before returning |
| GET    | /api/performance/teacher/:id  | Recalcs on-demand                        |

**Weighted formula:**
```
overall = (syllabus_pct × 0.15) + (lo_pct × 0.20) + (obs_pct × 0.30) + (other × 0.35)
```

### Leave
| Method | Endpoint        | Body / Params                              |
|--------|-----------------|---------------------------------------------|
| GET    | /api/leave      | `?status=Pending/Approved/Rejected&user_id=`|
| GET    | /api/leave/:id  | —                                           |
| POST   | /api/leave      | `{ type, from_date, to_date, reason? }`     |
| PUT    | /api/leave/:id  | `{ status: "Approved" | "Rejected" }` (admin) |

### Dashboards
| Method | Endpoint                    | Role    |
|--------|-----------------------------|---------|
| GET    | /api/dashboard/teacher      | teacher |
| GET    | /api/dashboard/admin        | admin   |

---

## 🔌 Frontend Integration (3 steps)

### Step 1 — Add Axios to the React project
```bash
cd sams-web
npm install axios
```

### Step 2 — Add environment variable
Create `sams-web/.env`:
```
VITE_API_URL=http://localhost:5000/api
```

### Step 3 — Drop in the integration files
```bash
# From the backend folder:
cp FRONTEND_API_SERVICE.js  ../sams-web/src/api/index.js
cp FRONTEND_AuthContext.jsx ../sams-web/src/context/AuthContext.jsx
```

### Step 4 — Update each page to call the API

**Example — TeacherDashboard.jsx**
```jsx
// Before (dummy data):
import { SYLLABUS_STATS, LO_SUMMARY } from '../../data/dummyData'

// After (real API):
import { useEffect, useState } from 'react'
import { dashboardApi } from '../../api'

export default function TeacherDashboard() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi.teacher()
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-slate-400">Loading…</div>
  if (!data)   return null

  // Replace SYLLABUS_STATS with data.syllabus
  // Replace LO_SUMMARY with data.learningOutcomes.distribution
}
```

**Example — TeacherSyllabus.jsx**
```jsx
import { syllabusApi } from '../../api'

// On mount:
const { items, stats } = await syllabusApi.getAll({ class_id: 5, subject_id: 1 })

// Mark complete:
await syllabusApi.complete(itemId)
```

**Example — Login.jsx**
```jsx
// The updated AuthContext.login() now calls the real API:
const result = await login(form.email, form.password)
// result.ok === true  → navigate to dashboard
// result.error       → show error message
```

---

## 🔒 Standard Response Format

All endpoints return:
```json
{
  "success": true,
  "message": "optional human-readable message",
  "data": { ... }
}
```

Paginated responses include:
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "total": 42,
      "page": 1,
      "limit": 20,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

Error responses:
```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": ["email is required", "password must be at least 6 characters"]
}
```

---

## 🧪 Postman Testing

1. Import `SAMS_API.postman_collection.json` into Postman
2. Run "Login – Admin" first → token auto-saved to collection variable
3. Run "Login – Teacher" → teacher token auto-saved
4. All other requests automatically use the correct token

---

## ⚙️ Environment Variables

| Variable          | Default                  | Description                         |
|-------------------|--------------------------|-------------------------------------|
| `DATABASE_URL`    | —                        | Prisma MySQL connection string      |
| `JWT_SECRET`      | —                        | Min 32 chars, keep secret           |
| `JWT_EXPIRES_IN`  | `7d`                     | Token lifetime                      |
| `PORT`            | `5000`                   | API server port                     |
| `NODE_ENV`        | `development`            | Affects logging                     |
| `ALLOWED_ORIGINS` | `http://localhost:5173`  | CORS allowed origins (comma-sep)    |
| `BCRYPT_ROUNDS`   | `12`                     | Bcrypt cost factor                  |

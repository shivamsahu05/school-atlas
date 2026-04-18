# SAMS – School Academic Management System (Web)
<<<<<<< HEAD
### React + Vite + Tailwind CSS + Node/PHP Backend Ready

---

## 🚀 Quick Start & Backend Setup

SAMS features a dynamic system built for real database integration, eliminating strictly dummy data across modules. Follow these steps to initialize the environment:

```bash
# 1. Install frontend dependencies
npm install

# 2. Run the development server
npm run dev
# → http://localhost:5173
```

### 🗄️ Database Setup
Create a MySQL database (e.g., `sams_db`) and initialize the foundational tables required for operation.
Ensure the following core tables are established:

**1. `users` Table** (Core Authentication)
- `id` (Primary Key, Auto-increment)
- `role` (ENUM: 'admin', 'teacher')
- `identifier` (Username for Admin, Phone Number for Teachers)
- `password_hash` (Bcrypt secured password)
- `name` (Full name)
- `status` (Active, Blocked)

**2. `contact_messages` Table** (Support & Inquiries)
- `id` (Primary Key, Auto-increment)
- `full_name` (String)
- `email` (String)
- `subject` (String)
- `message` (Text)
- `status` (ENUM: 'new', 'read', 'replied' - Default: 'new')
- `created_at` (Timestamp)

### 🔌 API Configuration
Adjust your API endpoints by modifying the frontend connection variables (typically inside `src/api/config.js` or `.env`):
```env
VITE_API_BASE_URL=http://localhost/sams_api/public/api
```

---

## 🔐 Authentication & Security

SAMS employs robust, DB-based authentication strictly segregating portal features by role:

| Role       | Login Method          | Access Level |
|------------|-----------------------|--------------|
| **Admin**  | Username & Password   | Full Administrative Control |
| **Teacher**| Phone & Password      | Restricted Class/Syllabus Access |

**Security Architecture:**
- **Bcrypt Hashing**: All passwords must be hashed using bcrypt on the server before storage. Wait, no plaintext passwords.
- **Role-Based Access Control (RBAC)**: Front-end `RoleRoute` directly filters routing preventing unauthorized module loading. Back-end APIs must verify JWT tokens to prevent bypassing.

---

## ✨ Core Features

1. **Intelligent Student Management**
   - Full lifecycle management (Promote, Fail, Graduate).
   - Dynamic class history and academic progress tracking.
   - Distinct Views: See "In Progress" for current classes alongside historical "Previous Term" data visually cleanly.
   
2. **Teacher Performance Tracking**
   - Advanced Evaluation Matrix: `(Class Pass % * 0.5) + (Attendance * 0.2) + (Admin Manual Override * 0.3)`.
   - Admin Manual entry support directly appended to automated scores.
   
3. **Contact System & Inquiries**
   - Public Landing page form mapped dynamically to the database.
   - Comprehensive Admin Inbox (`AdminContact.jsx`) supporting read-receipts and reply protocols.
   
4. **Live Notifications**
   - Actionable Navbar notification systems tracking alerts like leaves, events, and new messages.
=======
### React + Vite + Tailwind CSS + Recharts

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Open in browser
# → http://localhost:5173
```

---

## 🔐 Demo Credentials

| Role       | Username  | Password      |
|------------|-----------|---------------|
| **Admin**  | `admin`   | `Admin@123`   |
| **Teacher**| `teacher` | `Teacher@123` |
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d

---

## 🗂 Project Structure

```
src/
<<<<<<< HEAD
├── App.jsx                         # Main Routing Hub
├── context/
│   └── AuthContext.jsx             # Active session handling
├── layouts/
│   └── DashboardLayout.jsx         # Global shell (Sidebar, Notifications)
├── components/
│   └── ui/                         # Global Reusable Components (Modal, DataTable, clsx-fixed)
└── pages/
    ├── Landing.jsx                 # Public portal generating 'contact_messages'
    ├── Login.jsx                   # Role-based DB Authentication gate
    │
    ├── teacher/                    # Teacher-scoped modules (Syllabus, Homework, Analytics)
    │
    └── principal/                  # Admin-scoped comprehensive modules
        ├── AdminDashboard.jsx      
        ├── AdminStudents.jsx       # Advanced Student CRUD & Record views
        ├── AdminTeachers.jsx       # Teacher Directory & Performance Scoring
        ├── AdminContact.jsx        # Internal Inbox mapping to `contact_messages`
        └── AdminScreens.jsx        # Generalized panels (Timetable, Leave, etc.)
=======
├── App.jsx                         # Root – all routes
├── main.jsx                        # Entry point
├── index.css                       # Tailwind + custom utilities
│
├── context/
│   └── AuthContext.jsx             # Auth state + localStorage session
│
├── data/
│   └── dummyData.js                # All placeholder data (swap for API)
│
├── routes/
│   └── ProtectedRoute.jsx          # Auth guard + role guard
│
├── layouts/
│   ├── DashboardLayout.jsx         # Sidebar + top navbar shell
│   └── Sidebar.jsx                 # Nav links per role (teacher/admin)
│
├── components/
│   ├── ui/
│   │   ├── index.jsx               # StatCard, Modal, Tabs, Badge, ProgressBar…
│   │   └── DataTable.jsx           # Sortable reusable table
│   └── charts/
│       └── index.jsx               # BarChart, DonutChart, LineChart wrappers
│
└── pages/
    ├── Landing.jsx                 # Public school website (7 sections)
    ├── Login.jsx                   # Login with quick-fill demo buttons
    │
    ├── teacher/
    │   ├── TeacherDashboard.jsx    # Greeting banner, KPIs, module grid
    │   ├── TeacherSyllabus.jsx     # Completion table + bar chart
    │   ├── TeacherHomework.jsx     # Cards with defaulters + add modal
    │   ├── TeacherLO.jsx           # Table + donut + multi-bar chart
    │   ├── TeacherAnalytics.jsx    # Tabbed charts + observation history
    │   ├── TeacherSchedule.jsx     # Day-picker timetable
    │   └── TeacherLeave.jsx        # Apply form + history tabs
    │
    └── principal/
        ├── AdminDashboard.jsx      # School stats, top performers, module grid
        ├── AdminSyllabus.jsx       # Filterable table + bar chart
        ├── AdminAwardLO.jsx        # 5-step LO workflow + success chart
        └── AdminScreens.jsx        # Follow-ups, Observation, Performance,
                                    # User Mgmt, Timetable, Leave Approval
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
```

---

## 📦 Dependencies

| Package          | Purpose                          |
|------------------|----------------------------------|
<<<<<<< HEAD
| `react-router`   | Private and Public GUI navigation|
| `recharts`       | High-fidelity SVG statistical charts|
| `lucide-react`   | Professional unified iconography |
| `clsx`           | Verified uniform conditional CSS |
| `tailwindcss`    | Utility class structural styling |
=======
| `react-router-dom` | Client-side routing             |
| `recharts`         | All charts (Bar, Donut, Line)   |
| `lucide-react`     | Icons                           |
| `zustand`          | (included, ready for state)     |
| `clsx`             | Conditional classnames          |
| `tailwindcss`      | Utility CSS                     |

---

## 🔌 Backend Integration

All data is served from `src/data/dummyData.js`.  
To connect to a Laravel API:

1. Create `src/api/` with Axios service files
2. Replace imports from `dummyData` with API hooks
3. Wrap screens with `useQuery` / `useSWR` or Zustand stores
4. Add JWT token to `AuthContext` on login success

---

## 🎨 Design Tokens (Tailwind)

| Token         | Usage                     |
|---------------|---------------------------|
| `brand-600`   | Primary blue `#1a56db`    |
| `emerald-500` | Success / approved        |
| `amber-500`   | Warning / pending         |
| `rose-500`    | Error / rejected          |
| `slate-50`    | Page background           |
| `card`        | White card with shadow    |
| `btn-primary` | Blue filled button        |
| `input`       | Styled form input         |
| `badge-green` | Green status badge        |
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d

---

## 📄 License
<<<<<<< HEAD
Internal use – School Academic Management System (SAMS) v1.0
=======
Internal use – School Academic Management System v1.0
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d

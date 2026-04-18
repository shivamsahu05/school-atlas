# SAMS – School Academic Management System (Web)
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

---

## 🗂 Project Structure

```
src/
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
```

---

## 📦 Dependencies

| Package          | Purpose                          |
|------------------|----------------------------------|
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

---

## 📄 License
Internal use – School Academic Management System v1.0

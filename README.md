# SCHOLARIS — School Attendance & Academic Management System

![Scholaris Banner](https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=1200&auto=format&fit=crop&q=80)

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React_19-20232A?style=flat&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Django](https://img.shields.io/badge/Django_6.0-092E20?style=flat&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![DRF](https://img.shields.io/badge/Django_REST_Framework-red?style=flat&logo=django&logoColor=white)](https://www.django-rest-framework.org/)

---

## 1. Executive Summary

**Scholaris** is a centralized, production-grade School Attendance and Student Academic Management SaaS platform designed with the visual elegance and interaction standards of modern enterprise software (Linear, Stripe Dashboard, Notion, Vercel).

It combines:
- **Comprehensive Digital Student Profiles**: Demographics, emergency contacts, medical disclosures, multi-year enrollments, and linked guardian details.
- **Attendance Operating System**: Daily classroom marking sheets, individual/bulk status toggling, duplicate record prevention, attendance threshold alerts (<75%), and immutable change audit logging.
- **Academic Examination & Grading Engine**: Configurable grade scales (A+ through F with GPA points), term examination management, batch mark entry with bounds validation, and instant result publication.
- **Official Reporting Engine**: Server-side vector PDF report card generation via ReportLab, and openpyxl-powered Excel data export.
- **Role-Based Access Control**: Strict access boundaries separating Super Administrators, School Principals, Instructors/Faculty, and Guardians.

---

## 2. Design System & Aesthetic Architecture

Adheres to a restrained, sophisticated enterprise color system:
- **Primary Deep Navy**: `#17243A`
- **Slate Text & Muted Elements**: `#64748B`
- **Canvas / Background**: `#F7F8FA`
- **Surface / Cards**: `#FFFFFF`
- **Subtle Borders**: `#E8EBF0`
- **Accent Tokens**:
  - Soft Green: `#DFF3E7` (Text: `#166534`) — Present, Academic Honors
  - Soft Amber: `#FFF0D6` (Text: `#9A3412`) — Late, Warnings, Needs Attention
  - Soft Red: `#FCE5E5` (Text: `#991B1B`) — Absent, Critical Truancy Alerts
  - Muted Blue: `#5276A7` / `#EBF2FA` (Text: `#22487A`) — Information & Badges
- **Typography**: Inter / Geist modular hierarchy.
- **Icons**: Lucide Icons.

---

## 3. Technology Stack

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS + PostCSS + Autoprefixer
- **Icons**: Lucide React
- **Data Layer & Caching**: TanStack Query (React Query)
- **Routing**: React Router v7
- **Data Visualizations**: Recharts (Area, Bar, Donut charts)
- **HTTP Client**: Axios with JWT Bearer interceptor & auto-redirect

### Backend
- **Framework**: Django 6.0 + Django REST Framework (DRF)
- **Authentication**: JWT (JSON Web Tokens via `djangorestframework-simplejwt`)
- **PDF Generation**: ReportLab (vector document generation with tables, headers, and signatures)
- **Spreadsheet Generation**: openpyxl (styled multi-column Excel workbooks)
- **Database**: Normalized relational database (SQLite default for zero-config development; PostgreSQL production ready)
- **CORS Handling**: `django-cors-headers`

---

## 4. Quickstart Guide

### Prerequisites
- Python 3.11+ (Python 3.13 tested)
- Node.js 18+ (Node v26 tested) & npm

### Backend Setup

```bash
# 1. Navigate to backend directory
cd backend

# 2. Install Python dependencies
pip install django djangorestframework django-cors-headers djangorestframework-simplejwt reportlab openpyxl pillow

# 3. Apply database migrations
python manage.py migrate

### Database Initialization & Mock Data Management

To start with a **completely clean, production-ready database** (0 mock students, 0 mock attendance, 0 mock exams):
```bash
cd backend
python manage.py clear_mock_data
```
This resets the database to a clean slate, preserving only the default administrator account (`admin` / `admin123`) and default grading policies.

To re-populate synthetic demo records for evaluation at any time:
```bash
python manage.py seed_demo_data
```

# 5. Launch the backend API server
python manage.py runserver 127.0.0.1:8000
```

### Frontend Setup

```bash
# 1. In a separate terminal, navigate to frontend directory
cd frontend

# 2. Install npm dependencies
npm install

# 3. Start the Vite development server
npm run dev -- --host 127.0.0.1 --port 5173
```

Visit the application at: **`http://127.0.0.1:5173`**

---

## 5. Demonstration Accounts

The database seed command provides pre-configured role-based test accounts:

| Role | Username | Password | Full Name & Designation |
|---|---|---|---|
| **Super Administrator** | `admin` | `admin123` | Eleanor Sterling (System Director) |
| **School Administrator** | `principal` | `admin123` | Dr. Arthur Vance (School Principal) |
| **Teacher (Math)** | `teacher.smith` | `teacher123` | Sarah Smith (Head of Mathematics) |
| **Teacher (Science)** | `teacher.jones` | `teacher123` | David Jones (Senior Physics Faculty) |

*(Quick-login buttons are also provided directly on the Login screen for 1-click access)*

---

## 6. System Architecture & Modules

```
scholaris/
├── backend/
│   ├── config/              # Django settings, WSGI/ASGI, URLs
│   ├── core/                # School multi-tenancy, User model, RBAC, AuditLog, Notifications
│   ├── academic/            # AcademicYears, ClassGroups, Sections, Subjects, Teachers
│   ├── students/            # Students, Guardians, Enrollments, Remarks, Achievements
│   ├── attendance/          # AttendanceSessions, AttendanceRecords, AuditLogs, Calculations
│   ├── grades/              # GradingScales, Examinations, ExamSubjects, MarksEntry
│   └── reports/             # ReportLab PDF Generator, openpyxl Excel exporter, Analytics
└── frontend/
    └── src/
        ├── api/             # Axios API client & endpoints
        ├── components/      # Badges, Modals, Cards, Layout, Header, Sidebar
        ├── context/         # AuthContext (JWT session management)
        ├── pages/           # Dashboard, Students, StudentProfile, Attendance, Academics, Classes, Teachers, Reports, Notifications, Settings
        └── types/           # TypeScript interfaces & domain models
```

---

## 7. Key Features & Business Logic

### Attendance Business Rules
- **Formula**: $\text{Attendance Percentage} = \frac{\text{Present Sessions} + (\text{Late Sessions} \times \text{Weight})}{\text{Total Eligible Instructional Sessions}} \times 100$
- **Duplicate Prevention**: Database unique constraints enforce strictly one session per `(section, academic_year, date, session_type)` and one record per `(session, student)`.
- **Audit Trails**: Modifying any previously submitted record automatically creates an `AttendanceAuditLog` detailing the previous status, new status, operator, and timestamped rationale.
- **Configurable Thresholds**: Configurable school-wide minimum attendance threshold (default 75%) and warning threshold (default 85%).

### Student Digital Profiles (5 Interactive Tabs)
1. **Overview**: Demographics, active enrollment, primary guardians, emergency contacts, and medical warnings.
2. **Attendance**: Monthly trend charts, status breakdown, and complete chronological session history.
3. **Academics**: Examination records with max/pass marks, percentage, letter grades, and feedback.
4. **Performance**: Subject proficiency bars, identified academic strengths, and focus areas.
5. **Activity & Records**: Official student awards/achievements and faculty disciplinary/academic remarks.

### Examination & Grading
- Configurable letter grade scale with customizable GPA weights.
- Bulk marks entry with real-time pass/fail validation.
- One-click examination results publication with system notifications.

### Reports & Document Generation
- **ReportLab PDF**: Generates crisp, official student academic report cards complete with institutional crest, tables, evaluation breakdown, and signature lines.
- **OpenPyXL Excel**: Generates styled spreadsheets for term attendance and academic marks.

---

## 8. Automated Backend Tests

Run the complete test suite:

```bash
cd backend
python manage.py test
```

**Test Coverage**:
- Authentication & JWT token verification (`test_01`)
- Student directory search & filtering (`test_02`)
- Attendance marking, duplicate session prevention & audit logging (`test_03`)
- Examination marks entry, calculation & grade boundaries (`test_04`)
- Executive dashboard statistics aggregation (`test_05`)
- Server-side PDF report card rendering (`test_06`)
- Excel export workbook compilation (`test_07`)

---

## 9. Production Deployment

### Backend (e.g. Render / Railway / AWS ECS)
1. Set environment variables from `.env.example`:
   - `DJANGO_SECRET_KEY`: High-entropy random secret
   - `DJANGO_DEBUG`: `False`
   - `DATABASE_URL`: PostgreSQL connection string (`postgres://...`)
   - `CORS_ALLOWED_ORIGINS`: Production frontend domain
2. Collect static files:
   ```bash
   python manage.py collectstatic --noinput
   ```
3. Run with Gunicorn or Uvicorn:
   ```bash
   gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
   ```

### Frontend (e.g. Vercel / Netlify / Cloudflare Pages)
1. Set build environment variable:
   - `VITE_API_URL`: Production backend URL (e.g. `https://api.scholaris.edu`)
2. Build command: `npm run build`
3. Output directory: `dist`

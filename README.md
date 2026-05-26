# Aptigs Frontend

Admin dashboard for the Aptigs e-learning platform. Built with React 19, Vite, Redux Toolkit, and Tailwind CSS.

## Tech Stack

| Layer | Library |
|---|---|
| UI framework | React 19 |
| Build tool | Vite 8 |
| State management | Redux Toolkit + React Redux |
| Routing | React Router DOM v7 |
| HTTP client | Axios (with JWT refresh interceptor) |
| Styling | Tailwind CSS v3 |
| Tables | TanStack Table v8 |
| Rich text | Tiptap v3 |
| Calendar | FullCalendar v6 |
| Forms | React Hook Form |
| Icons | Lucide React |
| Notifications | React Hot Toast |

## Project Structure

```
src/
├── components/
│   ├── common/       # Reusable UI: Button, Input, Modal, Table, DataTable,
│   │                 #   Badge, Pagination, SearchInput, RichTextEditor, Skeletons
│   └── layout/       # Header, Sidebar, PageWrapper
├── hooks/            # useApiQuery, Redux typed hooks
├── mock/             # Static mock data (courses, students, schedule, etc.)
├── pages/
│   ├── Courses/      # CourseList, CourseDetail, Categories, Semesters,
│   │                 #   Subjects, Chapters (nested content tree)
│   ├── Dashboard/
│   ├── Enrollments/
│   ├── Login/
│   ├── Notifications/
│   ├── Payments/
│   ├── Questions/
│   ├── Quizzes/
│   ├── Schedule/     # Study Schedule templates + Events (FullCalendar)
│   ├── Students/
│   └── Teachers/
├── routes/           # AppRouter, ProtectedRoute (supports adminOnly flag)
├── services/         # One service file per domain (auth, course, student, etc.)
├── store/
│   ├── index.js      # Redux store
│   └── slices/       # authSlice, courseSlice, studentSlice, …
└── utils/
    └── formatters.js
```

## Getting Started

```bash
npm install
npm run dev        # dev server at http://localhost:5173
npm run build      # production build → dist/
npm run preview    # preview production build
npm run lint       # ESLint
```


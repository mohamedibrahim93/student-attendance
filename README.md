# AttendEase - Student Attendance MVP

A modern, QR-code based student attendance tracking system built with Next.js 14, Supabase, and Tailwind CSS.

![AttendEase](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=flat-square&logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)

## Features

### 👨‍🏫 Teacher Portal
- **QR Code Generation**: Generate time-limited QR codes for each class session
- **Manual Attendance**: Mark attendance manually with one-tap interface
- **Class Management**: Create and manage classes
- **Student Roster**: Add, edit, and remove students
- **Real-time Dashboard**: View attendance statistics at a glance

### 👨‍🎓 Student Portal
- **QR Code Scanning**: Scan QR codes to check in instantly
- **Manual Code Entry**: Enter session codes manually
- **Attendance History**: View personal attendance records
- **Statistics**: Track attendance rate over time

### 👨‍👩‍👧 Parent Portal
- **Multi-child Support**: Monitor multiple children's attendance
- **Real-time Alerts**: Get notified of absences
- **Detailed Reports**: Monthly attendance breakdowns
- **Statistics Dashboard**: Overall attendance metrics

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database & Auth**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **UI Components**: Custom shadcn/ui-inspired components
- **QR Code**: qrcode library
- **State Management**: React hooks + Zustand
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### 1. Clone and Install

```bash
cd student-attendance
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `supabase/schema.sql`
3. Copy your project URL and anon key from Settings > API

### 3. Configure Environment

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
student-attendance/
├── app/
│   ├── (auth)/
│   │   ├── login/          # Login page
│   │   └── register/       # Registration page
│   ├── teacher/
│   │   ├── page.tsx        # Teacher dashboard
│   │   ├── attendance/     # QR code & manual attendance
│   │   └── students/       # Student management
│   ├── student/
│   │   └── page.tsx        # Student check-in portal
│   ├── parent/
│   │   ├── page.tsx        # Parent dashboard
│   │   └── reports/        # Detailed reports
│   └── api/                # API routes
├── components/
│   ├── ui/                 # Reusable UI components
│   ├── qr-generator.tsx    # QR code generation
│   ├── qr-scanner.tsx      # QR code scanning
│   ├── attendance-table.tsx
│   └── nav-bar.tsx
├── lib/
│   ├── supabase/           # Supabase client config
│   ├── utils.ts            # Utility functions
│   └── types.ts            # TypeScript types
└── supabase/
    └── schema.sql          # Database schema
```

## Database Schema

### Tables

- **profiles**: User profiles linked to Supabase Auth
- **classes**: Class/course information
- **students**: Student records
- **attendance_sessions**: QR code session tracking
- **attendance**: Individual attendance records

### Row Level Security

The database uses RLS policies to ensure:
- Teachers can only access their own classes and students
- Students can only view and mark their own attendance
- Parents can only view their linked children's data

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

## Anti-Cheating Measures

- **Time-limited QR codes**: Codes expire after 5 minutes
- **One-time use**: Each code can only be used once per student
- **Session tracking**: All check-ins are logged with timestamps
- **Optional location verification**: Can be extended with GPS checks

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this for your school or organization.

---

Built with ❤️ for modern classrooms


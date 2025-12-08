import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AttendEase - Smart Student Attendance',
  description: 'Modern student attendance tracking system with QR code check-in',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 dark:from-gray-950 dark:via-gray-900 dark:to-violet-950">
        <div className="pattern-dots fixed inset-0 pointer-events-none opacity-50" />
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}


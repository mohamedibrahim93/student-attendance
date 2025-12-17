import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import './globals.css';

export const metadata: Metadata = {
  title: 'EduTech - نظام إدارة الحضور الذكي',
  description: 'نظام حديث لتتبع حضور الطلاب باستخدام رموز QR',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 dark:from-gray-950 dark:via-gray-900 dark:to-violet-950">
        <NextIntlClientProvider messages={messages}>
          <div className="pattern-dots fixed inset-0 pointer-events-none opacity-50" />
          <div className="relative z-10">
            {children}
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { GraduationCap, Home } from 'lucide-react';

export default async function NotFound() {
  const t = await getTranslations();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="text-center max-w-md">
        <div className="mx-auto p-4 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 w-fit mb-6">
          <GraduationCap className="h-12 w-12 text-white" />
        </div>
        <h1 className="text-6xl font-bold gradient-text mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-2">{t('notFound.title')}</h2>
        <p className="text-muted-foreground mb-8">
          {t('notFound.description')}
        </p>
        <Link href="/">
          <Button size="lg" className="gap-2">
            <Home className="h-4 w-4" />
            {t('notFound.goHome')}
          </Button>
        </Link>
      </div>
    </div>
  );
}

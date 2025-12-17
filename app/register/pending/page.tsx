import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Clock, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';

export default async function PendingApprovalPage() {
  const t = await getTranslations();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Card className="max-w-md w-full border-gray-200/50 dark:border-gray-800/50 shadow-xl animate-scale-in">
        <CardHeader className="text-center">
          <div className="mx-auto p-4 rounded-full bg-amber-100 dark:bg-amber-900/30 w-fit mb-4">
            <Clock className="h-12 w-12 text-amber-600" />
          </div>
          <CardTitle className="text-2xl">{t('pending.title')}</CardTitle>
          <CardDescription className="text-base mt-2">
            {t('pending.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-medium">{t('pending.whatNext')}</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                <span className="text-sm text-muted-foreground">
                  {t('pending.step1')}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                <span className="text-sm text-muted-foreground">
                  {t('pending.step2')}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                <span className="text-sm text-muted-foreground">
                  {t('pending.step3')}
                </span>
              </li>
            </ul>
          </div>

          <Link href="/login" className="block">
            <Button variant="outline" className="w-full gap-2">
              {t('pending.backToLogin')}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

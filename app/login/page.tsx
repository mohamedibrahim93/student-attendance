'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Mail, Lock, ArrowLeft, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  // Get direction from document
  const isRTL = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
  const ArrowBack = isRTL ? ArrowRight : ArrowLeft;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (data.user) {
        // Get user profile to determine redirect
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, is_approved')
          .eq('id', data.user.id)
          .single();

        // Redirect based on role
        switch (profile?.role) {
          case 'moe_admin':
            router.push('/moe');
            break;
          case 'school_admin':
          case 'supervisor':
            router.push('/school');
            break;
          case 'teacher':
            router.push('/teacher');
            break;
          case 'parent':
            router.push('/parent');
            break;
          case 'student':
            router.push('/student');
            break;
          default:
            router.push('/');
        }
      }
    } catch {
      setError(t('common.unexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="w-full max-w-md">
        {/* Back to Home */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowBack className="h-4 w-4" />
          {t('common.backToHome')}
        </Link>

        <Card className="border-gray-200/50 dark:border-gray-800/50 shadow-xl animate-scale-in">
          <CardHeader className="text-center">
            <div className="mx-auto p-3 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 w-fit mb-4">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">{t('auth.welcomeBack')}</CardTitle>
            <CardDescription>{t('auth.signInToApp')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm animate-fade-in">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('common.email')}</label>
                <Input
                  type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail className="h-4 w-4" />}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('common.password')}</label>
                <Input
                  type="password"
                  placeholder={t('auth.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock className="h-4 w-4" />}
                  required
                />
              </div>

              <Button type="submit" className="w-full" loading={loading}>
                {t('auth.signIn')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {t('auth.dontHaveAccount')}{' '}
                <Link href="/register" className="text-primary hover:underline font-medium">
                  {t('auth.signUp')}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Demo Accounts */}
        <div className="mt-6 p-4 rounded-xl bg-muted/50 animate-fade-in animate-stagger-1">
          <p className="text-sm font-medium text-center mb-3">{t('auth.demoAccounts')}</p>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>{t('auth.schoolAdmin')}:</span>
              <span className="font-mono">admin@demo.com / ASDasd@123</span>
            </div>
            <div className="flex justify-between">
              <span>{t('auth.teacher')}:</span>
              <span className="font-mono">teacher@demo.com / ASDasd@123</span>
            </div>
            <div className="flex justify-between">
              <span>{t('auth.parent')}:</span>
              <span className="font-mono">parent@demo.com / ASDasd@123</span>
            </div>
            <div className="flex justify-between">
              <span>{t('auth.student')}:</span>
              <span className="font-mono">student@demo.com / ASDasd@123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

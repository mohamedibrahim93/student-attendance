'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Mail, Lock, User, ArrowLeft, ArrowRight, Building2, Phone, Info } from 'lucide-react';
import type { School } from '@/lib/types';

export default function RegisterPage() {
  const router = useRouter();
  const t = useTranslations();
  const [schools, setSchools] = React.useState<School[]>([]);
  const [formData, setFormData] = React.useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'parent', // Default to parent for public registration
    schoolId: '',
  });
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [loadingSchools, setLoadingSchools] = React.useState(true);

  // Get direction from document
  const isRTL = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
  const ArrowBack = isRTL ? ArrowRight : ArrowLeft;

  // Fetch available schools
  React.useEffect(() => {
    const fetchSchools = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('schools')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      setSchools(data || []);
      if (data && data.length > 0) {
        setFormData(prev => ({ ...prev, schoolId: data[0].id }));
      }
      setLoadingSchools(false);
    };

    fetchSchools();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }

    if (formData.password.length < 6) {
      setError(t('auth.passwordMinLength'));
      return;
    }

    if (!formData.schoolId) {
      setError(t('register.pleaseSelectSchool'));
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: formData.role,
            school_id: formData.schoolId,
            phone: formData.phone,
          },
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (data.user) {
        // For parents, they need approval so show message
        if (formData.role === 'parent') {
          router.push('/register/pending');
        } else {
          // Redirect based on role
          switch (formData.role) {
            case 'teacher':
              router.push('/teacher');
              break;
            case 'student':
              router.push('/student');
              break;
            default:
              router.push('/');
          }
        }
      }
    } catch {
      setError(t('common.unexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
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
            <CardTitle className="text-2xl">{t('auth.createAccount')}</CardTitle>
            <CardDescription>{t('auth.getStartedWith')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm animate-fade-in">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('common.fullName')}</label>
                <Input
                  type="text"
                  name="fullName"
                  placeholder={t('auth.namePlaceholder')}
                  value={formData.fullName}
                  onChange={handleChange}
                  icon={<User className="h-4 w-4" />}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('common.email')}</label>
                <Input
                  type="email"
                  name="email"
                  placeholder={t('auth.emailPlaceholder')}
                  value={formData.email}
                  onChange={handleChange}
                  icon={<Mail className="h-4 w-4" />}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('common.phone')}</label>
                <Input
                  type="tel"
                  name="phone"
                  placeholder={t('auth.phonePlaceholder')}
                  value={formData.phone}
                  onChange={handleChange}
                  icon={<Phone className="h-4 w-4" />}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('register.iAmA')}</label>
                <Select name="role" value={formData.role} onChange={handleChange}>
                  <option value="parent">{t('roles.parent')}</option>
                  <option value="student">{t('roles.student')}</option>
                </Select>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  {t('register.adminNote')}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('register.selectSchool')}</label>
                {loadingSchools ? (
                  <div className="h-10 bg-muted animate-pulse rounded-lg" />
                ) : schools.length > 0 ? (
                  <Select name="schoolId" value={formData.schoolId} onChange={handleChange}>
                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.name}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <div className="p-3 rounded-lg bg-muted text-sm text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {t('register.noSchoolsAvailable')}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('common.password')}</label>
                <Input
                  type="password"
                  name="password"
                  placeholder={t('auth.passwordPlaceholder')}
                  value={formData.password}
                  onChange={handleChange}
                  icon={<Lock className="h-4 w-4" />}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('common.confirmPassword')}</label>
                <Input
                  type="password"
                  name="confirmPassword"
                  placeholder={t('auth.passwordPlaceholder')}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  icon={<Lock className="h-4 w-4" />}
                  required
                />
              </div>

              {formData.role === 'parent' && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-sm">
                  <p className="text-amber-800 dark:text-amber-200">
                    <strong>{t('common.note')}:</strong> {t('register.parentApprovalNote')}
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full" loading={loading} disabled={schools.length === 0}>
                {t('auth.createAccount')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {t('auth.alreadyHaveAccount')}{' '}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  {t('auth.signIn')}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

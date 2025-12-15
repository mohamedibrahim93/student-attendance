'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Mail, Lock, User, ArrowLeft, Building2, Phone, Info } from 'lucide-react';
import type { School } from '@/lib/types';

export default function RegisterPage() {
  const router = useRouter();
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
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!formData.schoolId) {
      setError('Please select a school');
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
      setError('An unexpected error occurred');
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
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <Card className="border-gray-200/50 dark:border-gray-800/50 shadow-xl animate-scale-in">
          <CardHeader className="text-center">
            <div className="mx-auto p-3 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 w-fit mb-4">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Create an account</CardTitle>
            <CardDescription>Get started with EduTech</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm animate-fade-in">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input
                  type="text"
                  name="fullName"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  icon={<User className="h-4 w-4" />}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  name="email"
                  placeholder="you@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  icon={<Mail className="h-4 w-4" />}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <Input
                  type="tel"
                  name="phone"
                  placeholder="+1 234 567 8900"
                  value={formData.phone}
                  onChange={handleChange}
                  icon={<Phone className="h-4 w-4" />}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">I am a...</label>
                <Select name="role" value={formData.role} onChange={handleChange}>
                  <option value="parent">Parent</option>
                  <option value="student">Student</option>
                </Select>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Teachers and admins are created by school administrators
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Select School</label>
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
                    No schools available yet
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  icon={<Lock className="h-4 w-4" />}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm Password</label>
                <Input
                  type="password"
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  icon={<Lock className="h-4 w-4" />}
                  required
                />
              </div>

              {formData.role === 'parent' && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-sm">
                  <p className="text-amber-800 dark:text-amber-200">
                    <strong>Note:</strong> Parent accounts require approval from the school before you can access the system.
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full" loading={loading} disabled={schools.length === 0}>
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

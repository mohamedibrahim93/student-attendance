'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import {
  Building2,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Mail,
  Phone,
  MapPin,
  User,
  Hash,
} from 'lucide-react';

export default function NewSchoolPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState('');
  
  const [formData, setFormData] = React.useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    principal_name: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.name || !formData.code) {
      setError('School name and code are required');
      setLoading(false);
      return;
    }

    const supabase = createClient();

    // Check if code is unique
    const { data: existing } = await supabase
      .from('schools')
      .select('id')
      .eq('code', formData.code)
      .single();

    if (existing) {
      setError('A school with this code already exists');
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from('schools').insert({
      name: formData.name,
      code: formData.code.toUpperCase(),
      address: formData.address || null,
      phone: formData.phone || null,
      email: formData.email || null,
      principal_name: formData.principal_name || null,
      is_active: true,
    });

    if (insertError) {
      setError('Failed to create school. Please try again.');
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push('/moe/schools');
    }, 2000);
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30 w-fit mx-auto mb-6 animate-scale-in">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">School Created!</h1>
        <p className="text-muted-foreground mb-6">
          The school has been successfully registered in the system.
        </p>
        <p className="text-sm text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/moe/schools">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Add New School
          </h1>
          <p className="text-muted-foreground">
            Register a new school in the system
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>School Information</CardTitle>
          <CardDescription>
            Enter the details for the new school
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  School Name *
                </label>
                <Input
                  id="name"
                  placeholder="e.g., Central High School"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="code" className="text-sm font-medium flex items-center gap-1">
                  <Hash className="h-4 w-4" />
                  School Code *
                </label>
                <Input
                  id="code"
                  placeholder="e.g., CHS001"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  maxLength={10}
                  required
                />
              </div>
            </div>

            {/* Principal */}
            <div className="space-y-2">
              <label htmlFor="principal" className="text-sm font-medium flex items-center gap-1">
                <User className="h-4 w-4" />
                Principal Name
              </label>
              <Input
                id="principal"
                placeholder="e.g., Dr. John Smith"
                value={formData.principal_name}
                onChange={(e) => setFormData({ ...formData, principal_name: e.target.value })}
              />
            </div>

            {/* Contact Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="school@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  Phone
                </label>
                <Input
                  id="phone"
                  placeholder="+1 234 567 8900"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <label htmlFor="address" className="text-sm font-medium flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Address
              </label>
              <Input
                id="address"
                placeholder="123 Education Street, City, Country"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Link href="/moe/schools" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" className="flex-1 gap-2" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Building2 className="h-4 w-4" />
                    Create School
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  currentLocale: string;
  className?: string;
}

export function LanguageSwitcher({ currentLocale, className }: LanguageSwitcherProps) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);

  const toggleLocale = async () => {
    setIsPending(true);
    const newLocale = currentLocale === 'ar' ? 'en' : 'ar';
    
    // Set cookie
    document.cookie = `locale=${newLocale};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
    
    // Refresh the page to apply new locale
    router.refresh();
    
    // Small delay before enabling button again
    setTimeout(() => setIsPending(false), 500);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLocale}
      disabled={isPending}
      className={cn('gap-2', className)}
      title={currentLocale === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
    >
      <Languages className="h-4 w-4" />
      <span className="hidden sm:inline">
        {currentLocale === 'ar' ? 'English' : 'العربية'}
      </span>
    </Button>
  );
}

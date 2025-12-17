'use server';

import { cookies } from 'next/headers';
import { Locale, defaultLocale, locales } from '@/i18n';

export async function getLocale(): Promise<Locale> {
  const cookieStore = cookies();
  const locale = cookieStore.get('locale')?.value as Locale;
  return locales.includes(locale) ? locale : defaultLocale;
}

export async function setLocale(locale: Locale) {
  const cookieStore = cookies();
  cookieStore.set('locale', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
  });
}

export function getDirection(locale: Locale): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

export function isRTL(locale: Locale): boolean {
  return locale === 'ar';
}

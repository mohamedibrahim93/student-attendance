'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Calendar,
  BookOpen,
  QrCode,
  BarChart3,
  GraduationCap,
  Building2,
} from 'lucide-react';

// Map of icon names to components
const iconMap = {
  users: Users,
  'user-check': UserCheck,
  'user-x': UserX,
  clock: Clock,
  'trending-up': TrendingUp,
  'check-circle': CheckCircle2,
  'x-circle': XCircle,
  calendar: Calendar,
  'book-open': BookOpen,
  'qr-code': QrCode,
  'bar-chart': BarChart3,
  'graduation-cap': GraduationCap,
  'building-2': Building2,
} as const;

type IconName = keyof typeof iconMap;

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: IconName;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  iconColor?: string;
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  className,
  iconColor = 'text-primary',
}: StatsCardProps) {
  const Icon = iconMap[icon];

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/50 dark:border-gray-800/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300',
        className
      )}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
      
      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className={cn('p-2 rounded-xl bg-primary/10')}>
            <Icon className={cn('h-5 w-5', iconColor)} />
          </div>
        </div>
        
        <div className="mt-3">
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          
          {(description || trend) && (
            <div className="mt-1 flex items-center gap-2">
              {trend && (
                <span
                  className={cn(
                    'text-xs font-medium',
                    trend.isPositive ? 'text-emerald-600' : 'text-red-600'
                  )}
                >
                  {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                </span>
              )}
              {description && (
                <span className="text-xs text-muted-foreground">{description}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

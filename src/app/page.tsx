'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getTodayDateString } from '@/lib/utils/date-utils';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const today = getTodayDateString();
    router.replace(`/day/${today}`);
  }, [router]);

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center">
      <div className="text-center space-y-4 animate-fade-in-up">
        <div className="relative">
          <div className="w-16 h-16 mx-auto rounded-2xl gradient-primary flex items-center justify-center shadow-glow animate-glow-pulse">
            <span className="text-2xl">📅</span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-lg font-medium gradient-text">Weekly Planner</p>
          <p className="text-sm text-muted-foreground">Redirecting to today...</p>
        </div>
        <div className="flex justify-center gap-1">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary/50 animate-pulse"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

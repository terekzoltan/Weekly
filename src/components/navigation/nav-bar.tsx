'use client';

import { useRouter } from 'next/navigation';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Search, Sparkles, BarChart3, Settings, Sun, Moon } from 'lucide-react';
import { addDays, subDays, format } from 'date-fns';
import { getWeekId } from '@/lib/utils/date-utils';
import { AiStatusIndicator } from '@/components/layout/ai-status-indicator';
import { useEffect, useState, useRef } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface NavBarProps {
    currentDate?: string;
    currentWeekId?: string;
    currentYear?: string;
}

function ThemeToggle() {
    const [isDark, setIsDark] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem('weekly_theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const dark = saved ? saved === 'dark' : prefersDark;
        setIsDark(dark);
        document.documentElement.classList.toggle('dark', dark);
    }, []);

    const toggle = () => {
        const newDark = !isDark;
        setIsDark(newDark);
        document.documentElement.classList.toggle('dark', newDark);
        localStorage.setItem('weekly_theme', newDark ? 'dark' : 'light');
    };

    if (!mounted) return null;

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="hover:bg-primary/10 hover:text-primary transition-all duration-200 hover:scale-110"
            title={isDark ? 'Light mode' : 'Dark mode'}
        >
            {isDark ? (
                <Sun className="h-4 w-4 transition-transform duration-300" />
            ) : (
                <Moon className="h-4 w-4 transition-transform duration-300" />
            )}
        </Button>
    );
}

function NavIconButton({ href, title, children }: { href: string; title: string; children: React.ReactNode }) {
    return (
        <Link href={href}>
            <Button
                variant="ghost"
                size="icon"
                title={title}
                className="hover:bg-primary/10 hover:text-primary transition-all duration-200 hover:scale-110 active:scale-95"
            >
                {children}
            </Button>
        </Link>
    );
}


function CalendarPicker() {
    const router = useRouter();
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    title="Jump to Day"
                    className="hover:bg-primary/10 hover:text-primary transition-all duration-200 hover:scale-110 active:scale-95"
                >
                    <CalendarIcon className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d: Date | undefined) => {
                        if (d) {
                            setDate(d);
                            setOpen(false);
                            router.push(`/day/${format(d, 'yyyy-MM-dd')}`);
                        }
                    }}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    );
}

export function NavBar({ currentDate, currentWeekId, currentYear }: NavBarProps) {
    if (currentDate) {
        const date = new Date(currentDate);
        const prevDate = format(subDays(date, 1), 'yyyy-MM-dd');
        const nextDate = format(addDays(date, 1), 'yyyy-MM-dd');
        const weekId = getWeekId(date);
        const year = format(date, 'yyyy');

        return (
            <nav className="flex items-center justify-between mb-6 -mx-2 px-2 py-2 sticky top-0 z-50 glass-strong rounded-xl animate-slide-down">
                {/* Left: Navigation arrows */}
                <div className="flex items-center gap-1">
                    <Link href={`/day/${prevDate}`}>
                        <Button
                            variant="outline"
                            size="icon"
                            className="hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Link href={`/day/${nextDate}`}>
                        <Button
                            variant="outline"
                            size="icon"
                            className="hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1">
                    <CalendarPicker />

                    <Link href={`/week/${weekId}`}>
                        <Button
                            variant="secondary"
                            className="gap-2 hover:shadow-soft transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                            <CalendarIcon className="h-4 w-4" />
                            <span className="hidden sm:inline">Week</span>
                        </Button>
                    </Link>

                    <NavIconButton href={`/year/${year}`} title="Year View">
                        <span className="font-bold text-xs">{year}</span>
                    </NavIconButton>

                    <NavIconButton href="/search" title="Search">
                        <Search className="h-4 w-4" />
                    </NavIconButton>

                    <NavIconButton href="/ask" title="Ask AI">
                        <Sparkles className="h-4 w-4" />
                    </NavIconButton>

                    <NavIconButton href="/stats" title="Statistics">
                        <BarChart3 className="h-4 w-4" />
                    </NavIconButton>

                    <NavIconButton href="/settings" title="Settings">
                        <Settings className="h-4 w-4" />
                    </NavIconButton>

                    <div className="flex items-center ml-1 pl-1 border-l border-border/50">
                        <ThemeToggle />
                        <AiStatusIndicator />
                    </div>
                </div>
            </nav>
        );
    }

    if (currentWeekId) {
        const year = currentWeekId.split('-')[0];
        return (
            <nav className="flex items-center justify-between mb-6 -mx-2 px-2 py-2 sticky top-0 z-50 glass-strong rounded-xl animate-slide-down">
                <div className="flex gap-2">
                    <Link href="/">
                        <Button
                            variant="outline"
                            className="hover:bg-primary/10 hover:border-primary/30 transition-all duration-200"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Today
                        </Button>
                    </Link>
                </div>
                <div className="flex items-center gap-1">
                    <CalendarPicker />
                    <NavIconButton href={`/year/${year}`} title={`Year ${year}`}>
                        <span className="font-bold text-xs">{year}</span>
                    </NavIconButton>

                    <NavIconButton href="/settings" title="Settings">
                        <Settings className="h-4 w-4" />
                    </NavIconButton>

                    <div className="flex items-center ml-1 pl-1 border-l border-border/50">
                        <ThemeToggle />
                        <AiStatusIndicator />
                    </div>
                </div>
            </nav>
        );
    }

    if (currentYear) {
        return (
            <nav className="flex items-center justify-between mb-6 -mx-2 px-2 py-2 sticky top-0 z-50 glass-strong rounded-xl animate-slide-down">
                <Link href="/">
                    <Button
                        variant="outline"
                        className="hover:bg-primary/10 hover:border-primary/30 transition-all duration-200"
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Today
                    </Button>
                </Link>
                <span className="font-semibold text-lg gradient-text">
                    {currentYear}
                </span>
                <div className="flex items-center">
                    <CalendarPicker />
                    <ThemeToggle />
                </div>
            </nav>
        );
    }

    return null;
}

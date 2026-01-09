import { format, parseISO, isValid } from 'date-fns';

export function getTodayDateString(): string {
    return format(new Date(), 'yyyy-MM-dd');
}

export function isValidDateString(dateStr: string): boolean {
    const date = parseISO(dateStr);
    return isValid(date);
}

export function formatReadableDate(dateStr: string): string {
    if (!isValidDateString(dateStr)) return dateStr;
    return format(parseISO(dateStr), 'EEEE, MMMM do, yyyy');
}

import { setISOWeek, setISOWeekYear, startOfISOWeek, endOfISOWeek } from 'date-fns';

export function getWeekId(date: Date | string): string {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, "yyyy-'W'II"); // ISO week format: 2025-W48
}

export function getDateFromWeekId(weekId: string): Date {
    const [year, week] = weekId.split('-W').map(Number);
    const d = new Date(year, 0, 4);
    const d2 = setISOWeekYear(d, year);
    const d3 = setISOWeek(d2, week);
    return startOfISOWeek(d3);
}

export function formatReadableWeek(weekId: string): string {
    try {
        const start = getDateFromWeekId(weekId);
        const end = endOfISOWeek(start);
        return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    } catch {
        return weekId;
    }
}

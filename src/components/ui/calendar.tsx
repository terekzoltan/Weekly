"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface CalendarProps {
    selected?: Date
    onSelect?: (date: Date | undefined) => void
    className?: string
    initialFocus?: boolean
    fromYear?: number
    toYear?: number
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]

function Calendar({
    selected,
    onSelect,
    className,
    fromYear = 2020,
    toYear = 2030,
}: CalendarProps) {
    const [currentMonth, setCurrentMonth] = React.useState<Date>(selected || new Date())

    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: (number | null)[] = []
    for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i)
    }

    const isToday = (day: number) => {
        const today = new Date()
        return (
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()
        )
    }

    const isSelected = (day: number) => {
        if (!selected) return false
        return (
            day === selected.getDate() &&
            month === selected.getMonth() &&
            year === selected.getFullYear()
        )
    }

    const handleDayClick = (day: number) => {
        const newDate = new Date(year, month, day)
        onSelect?.(newDate)
    }

    const goToPreviousMonth = () => {
        setCurrentMonth(new Date(year, month - 1, 1))
    }

    const goToNextMonth = () => {
        setCurrentMonth(new Date(year, month + 1, 1))
    }

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCurrentMonth(new Date(year, parseInt(e.target.value), 1))
    }

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCurrentMonth(new Date(parseInt(e.target.value), month, 1))
    }

    const years = Array.from({ length: toYear - fromYear + 1 }, (_, i) => fromYear + i)

    return (
        <div className={cn("p-3", className)}>
            {/* Header with Month/Year Dropdowns */}
            <div className="flex items-center justify-between mb-4">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={goToPreviousMonth}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex gap-2">
                    <select
                        value={month}
                        onChange={handleMonthChange}
                        className="text-sm font-medium bg-background border rounded px-2 py-1 cursor-pointer hover:bg-accent"
                    >
                        {MONTHS.map((m, i) => (
                            <option key={m} value={i}>
                                {m}
                            </option>
                        ))}
                    </select>

                    <select
                        value={year}
                        onChange={handleYearChange}
                        className="text-sm font-medium bg-background border rounded px-2 py-1 cursor-pointer hover:bg-accent"
                    >
                        {years.map((y) => (
                            <option key={y} value={y}>
                                {y}
                            </option>
                        ))}
                    </select>
                </div>

                <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={goToNextMonth}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {WEEKDAYS.map((day) => (
                    <div
                        key={day}
                        className="text-center text-sm font-medium text-muted-foreground h-9 flex items-center justify-center"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => (
                    <div key={index} className="h-9 w-9 p-0">
                        {day ? (
                            <button
                                onClick={() => handleDayClick(day)}
                                className={cn(
                                    "h-9 w-9 rounded-md text-sm font-normal transition-colors",
                                    "hover:bg-accent hover:text-accent-foreground",
                                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                                    isToday(day) && "bg-accent font-semibold",
                                    isSelected(day) &&
                                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                                )}
                            >
                                {day}
                            </button>
                        ) : (
                            <div className="h-9 w-9" />
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

Calendar.displayName = "Calendar"

export { Calendar }
export type { CalendarProps }

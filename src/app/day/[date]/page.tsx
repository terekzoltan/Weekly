'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { dayService } from '@/lib/db/day-service';
import { formatReadableDate, isValidDateString } from '@/lib/utils/date-utils';
import { NavBar } from '@/components/navigation/nav-bar';
import { A4Container } from '@/components/layout/a4-container';
import { AiSummaryControl } from '@/components/blocks/ai/ai-summary-control';
import { BlockRenderer } from '@/components/blocks/block-renderer';

export default function DayPage() {
    const params = useParams();
    const date = params.date as string;

    const blocks = useLiveQuery(
        () => db.blocks.where('[scope.type+scope.id]').equals(['day', date]).toArray(),
        [date]
    );

    useEffect(() => {
        if (date && isValidDateString(date)) {
            dayService.getDayBlocks(date).catch(console.error);
        }
    }, [date]);

    if (!isValidDateString(date)) {
        return (
            <A4Container>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center space-y-2">
                        <div className="text-6xl">📅</div>
                        <p className="text-destructive font-medium">Invalid date parameter</p>
                        <p className="text-sm text-muted-foreground">{date}</p>
                    </div>
                </div>
            </A4Container>
        );
    }

    if (!blocks) {
        return (
            <A4Container>
                <NavBar currentDate={date} />
                <div className="space-y-6 animate-pulse">
                    {/* Skeleton header */}
                    <div className="space-y-2">
                        <div className="h-8 w-64 bg-muted/50 rounded-lg"></div>
                        <div className="h-4 w-32 bg-muted/30 rounded"></div>
                    </div>
                    {/* Skeleton blocks */}
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-muted/30 rounded-2xl"></div>
                    ))}
                </div>
            </A4Container>
        );
    }

    return (
        <A4Container>
            <NavBar currentDate={date} />

            {/* Header with gradient text */}
            <header className="mb-8 animate-fade-in-up">
                <h1 className="text-3xl md:text-4xl font-bold gradient-text">
                    {formatReadableDate(date)}
                </h1>
                <p className="text-muted-foreground mt-1 font-mono text-sm">{date}</p>
            </header>

            {/* Blocks with stagger animation */}
            <div className="space-y-6 stagger-children">
                <AiSummaryControl date={date} blocks={blocks} />

                {blocks.map((block) => {
                    let placeholder = "Write here...";
                    if (block.kind === 'daily-journal') placeholder = "Write your daily thoughts...";
                    if (block.kind === 'daily-checklist') placeholder = "Add routine item...";
                    if (block.kind === 'daily-todo') placeholder = "Add task...";

                    return <BlockRenderer key={block.id} block={block} allBlocks={blocks} placeholder={placeholder} />;
                })}
            </div>
        </A4Container>
    );
}

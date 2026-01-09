'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { weekService } from '@/lib/db/week-service';
import { formatReadableWeek } from '@/lib/utils/date-utils';
import { NavBar } from '@/components/navigation/nav-bar';
import { AiSummaryControl } from '@/components/blocks/ai/ai-summary-control';
import { A4Container } from '@/components/layout/a4-container';
import { BlockRenderer } from '@/components/blocks/block-renderer';

export default function WeekPage() {
    const params = useParams();
    const weekId = params.weekId as string;

    const blocks = useLiveQuery(
        () => db.blocks.where('[scope.type+scope.id]').equals(['week', weekId]).toArray(),
        [weekId]
    );

    useEffect(() => {
        if (weekId) {
            weekService.getWeekBlocks(weekId).catch(console.error);
        }
    }, [weekId]);

    if (!blocks) {
        return (
            <A4Container>
                <NavBar currentWeekId={weekId} />
                <div className="space-y-6 animate-pulse">
                    <div className="text-center space-y-2">
                        <div className="h-10 w-48 bg-muted/50 rounded-lg mx-auto"></div>
                        <div className="h-4 w-64 bg-muted/30 rounded mx-auto"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-64 bg-muted/30 rounded-2xl"></div>
                        ))}
                    </div>
                </div>
            </A4Container>
        );
    }

    const weekNumber = weekId.split('-W')[1];

    return (
        <A4Container>
            <NavBar currentWeekId={weekId} />

            {/* Header */}
            <header className="mb-8 text-center animate-fade-in-up">
                <div className="inline-flex items-center gap-3 mb-2">
                    <span className="text-5xl md:text-6xl font-bold gradient-text">
                        W{weekNumber}
                    </span>
                </div>
                <p className="text-muted-foreground font-medium">
                    {formatReadableWeek(weekId)}
                </p>
            </header>

            {/* AI Control */}
            <div className="mb-8 animate-fade-in-up delay-100">
                <AiSummaryControl date={weekId} blocks={blocks} scope="week" />
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-children">
                {/* Left Column */}
                <div className="space-y-6">
                    {blocks.filter(b => b.kind === 'weekly-summary').map(block => (
                        <BlockRenderer key={block.id} block={block} allBlocks={blocks} />
                    ))}
                    {blocks.filter(b => b.kind === 'weekly-journal').map(block => (
                        <BlockRenderer key={block.id} block={block} placeholder="Weekly reflections..." />
                    ))}
                    {blocks.filter(b => b.kind === 'important-concepts').map(block => (
                        <BlockRenderer key={block.id} block={block} placeholder="Add concept..." />
                    ))}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {blocks.filter(b => b.kind === 'weekly-todo').map(block => (
                        <BlockRenderer key={block.id} block={block} placeholder="Add task..." />
                    ))}
                    {blocks.filter(b => b.kind === 'meta-update').map(block => (
                        <BlockRenderer key={block.id} block={block} placeholder="How to improve the system?" />
                    ))}
                    {blocks.filter(b => b.kind === 'games').map(block => (
                        <BlockRenderer key={block.id} block={block} placeholder="Game: Time" />
                    ))}
                </div>
            </div>
        </A4Container>
    );
}

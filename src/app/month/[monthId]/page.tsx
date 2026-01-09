'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { Block } from '@/lib/models/types';
import { A4Container } from '@/components/layout/a4-container';
import { NavBar } from '@/components/navigation/nav-bar'; // Will need update to handle month
import { AiSummaryControl } from '@/components/blocks/ai/ai-summary-control';
import { BlockRenderer } from '@/components/blocks/block-renderer';

export default function MonthPage() {
    const params = useParams();
    const monthId = params.monthId as string; // yyyy-MM

    // We need to fetch 'monthly-summary' blocks for this month
    const blocks = useLiveQuery(
        () => db.blocks.where('[scope.type+scope.id]').equals(['month', monthId]).toArray(),
        [monthId]
    );

    // We also need to fetch Weekly Summaries for the AI context.
    const weeklySummaries = useLiveQuery(async () => {
        if (!monthId) return [];
        const year = monthId.split('-')[0];
        // Ideally we filter by actual date range, but string matching yyyy-Wxx is hard against yyyy-MM.
        // Let's just fetch all weekly summaries for the year.
        const allWeeks = await db.blocks.where('kind').equals('weekly-summary').toArray();
        return allWeeks.filter(b => b.scope.id.startsWith(year));
    }, [monthId]);

    const combinedBlocks = [...(blocks || []), ...(weeklySummaries || [])];

    return (
        <A4Container>
            <header className="mb-8 text-center">
                <h1 className="text-3xl font-bold">Month {monthId}</h1>
            </header>

            <div className="mb-6">
                <AiSummaryControl date={monthId} blocks={combinedBlocks} scope="month" />
            </div>

            <div className="mt-8 space-y-6">
                {blocks?.filter(b => b.kind === 'monthly-summary').map(block => (
                    <BlockRenderer key={block.id} block={block} allBlocks={combinedBlocks} />
                ))}

                {(!blocks || blocks.filter(b => b.kind === 'monthly-summary').length === 0) && (
                    <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
                        <p className="text-gray-400 italic">No monthly summary yet.</p>
                    </div>
                )}
            </div>
        </A4Container>
    );
}

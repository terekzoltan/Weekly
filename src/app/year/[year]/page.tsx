'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { yearService } from '@/lib/db/year-service';
import { NavBar } from '@/components/navigation/nav-bar';
import { BlockRenderer } from '@/components/blocks/block-renderer';
import { A4Container } from '@/components/layout/a4-container';

export default function YearPage() {
    const params = useParams();
    const year = params.year as string;

    const blocks = useLiveQuery(
        () => db.blocks.where('[scope.type+scope.id]').equals(['year', year]).toArray(),
        [year]
    );

    useEffect(() => {
        if (year) {
            yearService.getYearBlocks(year).catch(console.error);
        }
    }, [year]);

    if (!blocks) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <A4Container>
            <NavBar currentYear={year} />

            <header className="mb-12 text-center">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                    {year}
                </h1>
                <p className="text-gray-500 mt-2">Annual Overview</p>
            </header>

            {/* Months Grid */}
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mb-12">
                {Array.from({ length: 12 }, (_, i) => {
                    const monthNum = (i + 1).toString().padStart(2, '0');
                    const monthId = `${year}-${monthNum}`;
                    const monthName = new Date(Number(year), i).toLocaleString('default', { month: 'long' });
                    return (
                        <a
                            key={monthId}
                            href={`/month/${monthId}`}
                            className="p-4 border rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-center"
                        >
                            <div className="font-semibold text-gray-700 dark:text-gray-300">{monthName}</div>
                        </a>
                    );
                })}
            </div>

            <div className="space-y-12">
                <section>
                    {blocks.filter(b => b.kind === 'yearly-goals').map(block => (
                        <BlockRenderer key={block.id} block={block} placeholder="Add a big goal for this year..." />
                    ))}
                </section>

                <section>
                    {blocks.filter(b => b.kind === 'yearly-summary').map(block => (
                        <BlockRenderer key={block.id} block={block} placeholder="Reflect on your year..." />
                    ))}
                </section>
            </div>
        </A4Container>
    );
}

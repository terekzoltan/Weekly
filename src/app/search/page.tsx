'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/db/db';
import { Block } from '@/lib/models/types';
import { A4Container } from '@/components/layout/a4-container';
import { NavBar } from '@/components/navigation/nav-bar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search as SearchIcon, ArrowRight } from 'lucide-react';
import { TextBlock } from '@/components/blocks/text-block';
import { ListBlock } from '@/components/blocks/list-block';
import Link from 'next/link';

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Block[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const performSearch = async (q: string) => {
        if (!q.trim()) {
            setResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const lowerQ = q.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        // Optimized search using searchText index (if mapped) or property
        // For full text substring search we still need to filter, but it's much faster on a single string
        const validResults = await db.blocks.filter(b => {
            // Use searchText if available (it should be for all blocks after migration)
            // Fallback to naive check if for some reason it's missing (e.g. creating hook race condition?)
            if (b.searchText) {
                return b.searchText.includes(lowerQ);
            }
            // Fallback
            return false;
        }).toArray();

        // Sort by date descending (approximate by ID or created/updated?)
        // Actually scoping date is better.
        // Let's sort by scope ID descending if possible (dates usually string sort well)
        validResults.sort((a, b) => (b.scope.id > a.scope.id ? 1 : -1));

        setResults(validResults);
        setIsSearching(false);
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            performSearch(query);
        }, 500);
        return () => clearTimeout(timer);
    }, [query]);

    const getLink = (block: Block) => {
        if (block.scope.type === 'day') return `/day/${block.scope.id}`;
        if (block.scope.type === 'week') return `/week/${block.scope.id}`;
        if (block.scope.type === 'year') return `/year/${block.scope.id}`;
        return '/';
    };

    return (
        <A4Container>
            <div className="mb-8">
                <NavBar />
            </div>

            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <SearchIcon className="h-8 w-8" /> Search
                </h1>
                <p className="text-gray-500">Find memories, tasks, and notes.</p>
            </header>

            <div className="mb-8">
                <Input
                    placeholder="Type to search..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="text-lg py-6"
                />
            </div>

            <div className="space-y-8">
                {isSearching && <p className="text-muted-foreground">Searching...</p>}

                {!isSearching && results.length === 0 && query && (
                    <p className="text-muted-foreground text-center py-8">No results found.</p>
                )}

                {results.map(block => (
                    <div key={block.id} className="relative group">
                        <div className="absolute -left-12 top-2 hidden group-hover:block">
                            <Link href={getLink(block)}>
                                <Button variant="ghost" size="icon" title="Go to entry">
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>

                        {/* Render block partially or fully */}
                        <div className="opacity-90 hover:opacity-100 transition-opacity">
                            <p className="text-xs text-muted-foreground mb-1 font-mono uppercase tracking-widest">
                                {block.scope.type} • {block.scope.id}
                            </p>
                            {block.kind.includes('habits') ? (
                                <div className="p-4 border rounded bg-gray-50 text-sm">
                                    Habit Data match (See detail view)
                                </div>
                            ) : block.kind.endsWith('checklist') || block.kind.endsWith('todo') || block.kind === 'important-concepts' || block.kind === 'games' || block.kind === 'yearly-goals' ? (
                                <ListBlock block={block} />
                            ) : (
                                <TextBlock block={block} />
                            )}
                        </div>
                        <hr className="mt-8 border-gray-100" />
                    </div>
                ))}
            </div>
        </A4Container>
    );
}

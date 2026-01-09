import { Block } from '@/lib/models/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { hu } from 'date-fns/locale';
import { Bot, AlertTriangle, Sparkles } from 'lucide-react';

interface SummaryBlockProps {
    block: Block;
    allBlocks: Block[];
}

export function SummaryBlock({ block, allBlocks }: SummaryBlockProps) {
    const isPrivate = block.kind.includes('private');

    // Stale check logic
    let isStale = false;
    let generatedAt = block.data?.generatedAt ? new Date(block.data.generatedAt as string | number) : null;

    if (generatedAt) {
        const lastUpdate = allBlocks
            .filter(b => b.id !== block.id && !b.kind.includes('summary'))
            .reduce((max, b) => {
                const date = new Date(b.updatedAt);
                return date > max ? date : max;
            }, new Date(0));

        if (lastUpdate > generatedAt) {
            isStale = true;
        }
    }

    return (
        <Card className={cn(
            "w-full overflow-hidden",
            isPrivate
                ? "border-amber-300/30 bg-gradient-to-br from-amber-50/80 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20 dark:border-amber-800/30"
                : "border-primary/20 bg-gradient-to-br from-indigo-50/80 to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/20 dark:border-primary/20"
        )}>
            {/* Decorative gradient border top */}
            <div className={cn(
                "h-1 w-full",
                isPrivate ? "bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" : "gradient-primary"
            )} />

            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <div className={cn(
                            "p-1.5 rounded-lg",
                            isPrivate ? "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400" : "bg-primary/10 text-primary"
                        )}>
                            <Bot className="w-4 h-4" />
                        </div>
                        <span>{block.title}</span>
                        <Sparkles className="w-3 h-3 text-muted-foreground/40 animate-sparkle" />
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        {isStale && (
                            <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5 bg-amber-100/80 dark:bg-amber-900/30 px-2 py-1 rounded-full font-medium">
                                <AlertTriangle className="w-3 h-3" />
                                Frissítés szükséges
                            </span>
                        )}
                        <span className="text-[10px] text-muted-foreground/60 font-mono">
                            {generatedAt ? formatDistanceToNow(generatedAt, { addSuffix: true, locale: hu }) : ''}
                        </span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                    {block.content}
                </div>
                {block.data?.model && (
                    <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border/20">
                        <span className="text-[10px] text-muted-foreground/50 font-mono bg-muted/30 px-2 py-0.5 rounded">
                            {block.data.provider} / {block.data.model}
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

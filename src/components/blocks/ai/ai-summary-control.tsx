import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dayService } from '@/lib/db/day-service';
import { flattenDailyData } from '@/lib/ai/data-preparation';
import { ollamaService } from '@/lib/ai/ollama-service';
import { SYSTEM_PROMPTS } from '@/lib/ai/prompts';
import { Block, BlockKind } from '@/lib/models/types';
import { db } from '@/lib/db/db';
import { Loader2, Sparkles, Lock, Globe } from 'lucide-react';

interface AiSummaryControlProps {
    date: string;
    blocks?: Block[];
    scope?: 'day' | 'week' | 'month';
}

export function AiSummaryControl({ date, blocks, scope = 'day' }: AiSummaryControlProps) {
    const [isGenerating, setIsGenerating] = useState<null | 'public' | 'private'>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async (type: 'public' | 'private') => {
        setIsGenerating(type);
        setError(null);
        try {
            let context = '';
            if (scope === 'week') {
                const { flattenWeeklyData } = await import('@/lib/ai/data-preparation');
                context = flattenWeeklyData(blocks || [], type);
            } else if (scope === 'month') {
                const { flattenMonthlyData } = await import('@/lib/ai/data-preparation');
                context = flattenMonthlyData(blocks || [], type);
            } else {
                const { flattenDailyData } = await import('@/lib/ai/data-preparation');
                context = flattenDailyData(blocks || [], type);
            }
            if (!context.trim()) {
                throw new Error("Nincs elég adat a generáláshoz (üres napló/szokások).");
            }

            const systemPrompt = type === 'public'
                ? (scope === 'week' ? SYSTEM_PROMPTS.WEEKLY_SUMMARY : (scope === 'month' ? SYSTEM_PROMPTS.MONTHLY_SUMMARY : SYSTEM_PROMPTS.DAILY_SUMMARY_PUBLIC))
                : (scope === 'week' ? SYSTEM_PROMPTS.WEEKLY_SUMMARY : (scope === 'month' ? SYSTEM_PROMPTS.MONTHLY_SUMMARY : SYSTEM_PROMPTS.DAILY_SUMMARY_PRIVATE));

            let responseContent = '';
            let responseModel = '';
            let responseProvider = 'local-ollama';

            const useCloud = localStorage.getItem('weekly_use_cloud_for_summaries') === 'true';

            if (useCloud) {
                const cloudModel = localStorage.getItem('weekly_openrouter_model') || 'google/gemini-2.0-flash-001';
                const { openRouterService } = await import('@/lib/ai/openrouter-service');

                responseContent = await openRouterService.generateCompletion({
                    model: cloudModel,
                    prompt: `ADATOK:\n${context}\n\nKÉRÉS: Készítsd el az összefoglalót a fenti adatok alapján.`,
                    system: systemPrompt,
                    temperature: 0.7
                });
                responseModel = cloudModel;
                responseProvider = 'cloud-openrouter';
            } else {
                const model = "llama3.2";
                const response = await ollamaService.generateCompletion({
                    model,
                    prompt: `ADATOK:\n${context}\n\nKÉRÉS: Készítsd el az összefoglalót a fenti adatok alapján.`,
                    system: systemPrompt,
                    options: { temperature: 0.7 }
                });
                responseContent = response.response;
                responseModel = response.model;
                responseProvider = 'local-ollama';
            }

            let kind: BlockKind = 'daily-summary-public';
            if (scope === 'week') kind = 'weekly-summary';
            else if (scope === 'month') kind = 'monthly-summary';
            else kind = type === 'public' ? 'daily-summary-public' : 'daily-summary-private';

            let title = '';
            if (scope === 'week') title = 'Heti Összefoglaló';
            else if (scope === 'month') title = 'Havi Összefoglaló';
            else title = type === 'public' ? 'Napi Publikus Összefoglaló' : 'Privát Napló Kivonat';

            const existingBlock = (blocks || []).find(b => b.kind === kind);

            const now = new Date().toISOString();
            const sourceBlockIds = (blocks || []).map(b => b.id);

            const newBlock: Block = {
                id: existingBlock ? existingBlock.id : crypto.randomUUID(),
                scope: { type: scope, id: date },
                kind: kind,
                title: title,
                content: responseContent,
                items: [],
                data: {
                    sourceBlockIds,
                    generatedAt: now,
                    model: responseModel,
                    provider: responseProvider
                },
                createdAt: existingBlock ? existingBlock.createdAt : now,
                updatedAt: now,
            } as Block;

            await db.blocks.put(newBlock);

        } catch (err: any) {
            console.error("Generálás hiba:", err);
            setError(err.message || "Ismeretlen hiba történt.");
        } finally {
            setIsGenerating(null);
        }
    };

    return (
        <Card className="w-full border-dashed border-primary/30 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-950/10 overflow-hidden">
            {/* Decorative gradient line */}
            <div className="h-0.5 w-full gradient-primary opacity-50" />

            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                        <Sparkles className="w-4 h-4 animate-sparkle" />
                    </div>
                    AI Asszisztens
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-background/80 backdrop-blur-sm hover:bg-primary/5 hover:border-primary/40 hover:text-primary transition-all duration-200 group"
                        onClick={() => handleGenerate('public')}
                        disabled={!!isGenerating}
                    >
                        {isGenerating === 'public' ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Globe className="w-4 h-4 mr-2 text-primary group-hover:scale-110 transition-transform" />
                        )}
                        Publikus Összefoglaló
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-background/80 backdrop-blur-sm hover:bg-amber-500/5 hover:border-amber-500/40 hover:text-amber-600 transition-all duration-200 group"
                        onClick={() => handleGenerate('private')}
                        disabled={!!isGenerating}
                    >
                        {isGenerating === 'private' ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Lock className="w-4 h-4 mr-2 text-amber-500 group-hover:scale-110 transition-transform" />
                        )}
                        Privát Kivonat
                    </Button>
                </div>

                {error && (
                    <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <p className="text-xs text-destructive font-medium">{error}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { Block } from '@/lib/models/types';
import { DailyHabitsSchema } from '@/lib/models/schema';
import { BlockWrapper } from './block-wrapper';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { dayService } from '@/lib/db/day-service';
import { z } from 'zod';

interface DailyHabitsProps {
    block: Block;
}

type DailyHabitsData = z.infer<typeof DailyHabitsSchema>;

export function DailyHabits({ block }: DailyHabitsProps) {
    const [data, setData] = useState<DailyHabitsData>((block.data as DailyHabitsData) || {});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (JSON.stringify(data) !== JSON.stringify(block.data)) {
                const result = DailyHabitsSchema.safeParse(data);
                if (result.success) {
                    setIsSaving(true);
                    await dayService.updateBlock(block.id, { data: result.data });
                    setIsSaving(false);
                } else {
                    console.error("Validation failed for daily habits:", result.error);
                }
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [data, block.id, block.data]);

    const updateField = (key: string, value: string | number | boolean) => {
        setData(prev => ({ ...prev, [key]: value }));
    };

    return (
        <BlockWrapper title="Daily Habits" kind={block.kind}>
            <div className="space-y-6">
                {/* Section: Sleep */}
                <div className="space-y-3">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <span className="w-6 h-px bg-gradient-to-r from-primary/50 to-transparent"></span>
                        Alvás
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="bedtime" className="text-xs text-muted-foreground">Fekvés</Label>
                            <Input
                                id="bedtime"
                                type="time"
                                value={data.bedtime || ''}
                                onChange={e => updateField('bedtime', e.target.value)}
                                className="h-9"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="wakeup" className="text-xs text-muted-foreground">Kelés</Label>
                            <Input
                                id="wakeup"
                                type="time"
                                value={data.wakeup || ''}
                                onChange={e => updateField('wakeup', e.target.value)}
                                className="h-9"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="sleepLength" className="text-xs text-muted-foreground">Hossz (h)</Label>
                            <Input
                                id="sleepLength"
                                type="number"
                                step="0.5"
                                value={data.sleepLength || ''}
                                onChange={e => updateField('sleepLength', e.target.value)}
                                className="h-9"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="slk" className="text-xs text-muted-foreground">SLK</Label>
                            <Input
                                id="slk"
                                type="number"
                                value={data.slk || ''}
                                onChange={e => updateField('slk', e.target.value)}
                                className="h-9"
                            />
                        </div>
                    </div>
                </div>

                {/* Section: Health */}
                <div className="space-y-3">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <span className="w-6 h-px bg-gradient-to-r from-accent/50 to-transparent"></span>
                        Egészség
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="sport" className="text-xs text-muted-foreground">Sport</Label>
                            <Input
                                id="sport"
                                type="text"
                                value={data.sport || ''}
                                onChange={e => updateField('sport', e.target.value)}
                                className="h-9"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="med" className="text-xs text-muted-foreground">Med (min)</Label>
                            <Input
                                id="med"
                                type="number"
                                value={data.med || ''}
                                onChange={e => updateField('med', e.target.value)}
                                className="h-9"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="caps" className="text-xs text-muted-foreground">Caps</Label>
                            <Input
                                id="caps"
                                type="text"
                                value={data.caps || ''}
                                onChange={e => updateField('caps', e.target.value)}
                                className="h-9"
                            />
                        </div>
                    </div>
                </div>

                {/* Section: Ratings */}
                <div className="space-y-3">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <span className="w-6 h-px bg-gradient-to-r from-primary/50 to-transparent"></span>
                        Értékelés
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="prog" className="text-xs text-muted-foreground">Prog (0-10)</Label>
                            <Input
                                id="prog"
                                type="number"
                                min="0" max="10"
                                value={data.prog || ''}
                                onChange={e => updateField('prog', e.target.value)}
                                className="h-9"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="nap" className="text-xs text-muted-foreground">Nap (0-10)</Label>
                            <Input
                                id="nap"
                                type="number"
                                min="0" max="10"
                                value={data.nap || ''}
                                onChange={e => updateField('nap', e.target.value)}
                                className="h-9"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="kaj" className="text-xs text-muted-foreground">Kaj (0-10)</Label>
                            <Input
                                id="kaj"
                                type="number"
                                min="0" max="10"
                                value={data.kaj || ''}
                                onChange={e => updateField('kaj', e.target.value)}
                                className="h-9"
                            />
                        </div>
                    </div>
                </div>

                {/* Section: Checkboxes */}
                <div className="flex flex-wrap gap-x-8 gap-y-3 pt-2 border-t border-border/30">
                    <div className="flex items-center gap-2.5">
                        <Checkbox id="fa" checked={data.fa || false} onCheckedChange={c => updateField('fa', c)} />
                        <Label htmlFor="fa" className="text-sm font-medium cursor-pointer">FA</Label>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <Checkbox id="watch" checked={data.watch || false} onCheckedChange={c => updateField('watch', c)} />
                        <Label htmlFor="watch" className="text-sm font-medium cursor-pointer">Watch</Label>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <Checkbox id="min" checked={data.min || false} onCheckedChange={c => updateField('min', c)} />
                        <Label htmlFor="min" className="text-sm font-medium cursor-pointer">Min</Label>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <Checkbox id="hr" checked={data.hr || false} onCheckedChange={c => updateField('hr', c)} />
                        <Label htmlFor="hr" className="text-sm font-medium cursor-pointer">HR</Label>
                    </div>
                </div>

                {/* Saving indicator */}
                {isSaving && (
                    <div className="flex justify-end">
                        <span className="text-xs text-primary animate-pulse flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-glow-pulse"></span>
                            Saving...
                        </span>
                    </div>
                )}
            </div>
        </BlockWrapper>
    );
}

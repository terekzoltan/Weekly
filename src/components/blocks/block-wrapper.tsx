import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface BlockWrapperProps {
    title: string;
    kind: string;
    children: ReactNode;
    className?: string;
}

export function BlockWrapper({ title, kind, children, className }: BlockWrapperProps) {
    return (
        <Card className={cn("w-full hover-lift", className)}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold tracking-tight">
                        {title}
                    </CardTitle>
                    <span className="text-[10px] text-muted-foreground/60 font-mono bg-muted/50 px-2 py-0.5 rounded-md">
                        {kind}
                    </span>
                </div>
            </CardHeader>
            <CardContent>
                {children}
            </CardContent>
        </Card>
    );
}

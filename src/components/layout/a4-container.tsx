'use client';

import { ReactNode, useEffect, useState } from 'react';

interface A4ContainerProps {
    children: ReactNode;
}

export function A4Container({ children }: A4ContainerProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="min-h-screen gradient-bg py-8 px-4 flex justify-center relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Gradient orbs */}
                <div
                    className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-30 blur-3xl animate-float"
                    style={{ background: 'var(--gradient-primary)' }}
                />
                <div
                    className="absolute top-1/2 -left-32 w-80 h-80 rounded-full opacity-20 blur-3xl animate-float delay-500"
                    style={{ background: 'var(--gradient-secondary)' }}
                />
                <div
                    className="absolute -bottom-24 right-1/4 w-72 h-72 rounded-full opacity-25 blur-3xl animate-float delay-300"
                    style={{ background: 'var(--gradient-primary)' }}
                />
            </div>

            {/* Main content container */}
            <div
                className={`
                    w-full max-w-4xl 
                    glass shadow-card 
                    min-h-[1414px] 
                    p-8 md:p-12 
                    rounded-2xl md:rounded-3xl
                    relative z-10
                    ${mounted ? 'animate-fade-in-up' : 'opacity-0'}
                `}
            >
                {children}
            </div>
        </div>
    );
}

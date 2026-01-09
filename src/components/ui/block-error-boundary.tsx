'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
    children: ReactNode;
    blockId?: string;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class BlockErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error in Block:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="p-4 border border-red-200 bg-red-50 dark:bg-red-900/10 rounded-lg text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    <div>
                        <span className="font-semibold">Block Error</span>
                        {this.props.blockId && <span className="text-xs ml-1 opacity-70">({this.props.blockId})</span>}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

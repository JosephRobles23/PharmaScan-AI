'use client';

import { cn } from '@/lib/utils/cn';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    className?: string;
}

export function Loading({ size = 'md', text, className }: LoadingProps) {
    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };

    return (
        <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
            <Loader2 className={cn('animate-spin text-[#0066CC]', sizes[size])} />
            {text && <p className="text-[#64748B] text-sm">{text}</p>}
        </div>
    );
}

export function LoadingOverlay({ text }: { text?: string }) {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-8 shadow-2xl">
                <Loading size="lg" text={text} />
            </div>
        </div>
    );
}

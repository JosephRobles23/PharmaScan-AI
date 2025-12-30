'use client';

import { cn } from '@/lib/utils/cn';
import { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
}

export function Card({ children, className }: CardProps) {
    return (
        <div
            className={cn(
                'bg-white dark:bg-[#282828] rounded-2xl border border-[#E2E8F0] dark:border-[#334155]',
                'shadow-xl shadow-black',
                className
            )}
        >
            {children}
        </div>
    );
}

export function CardHeader({ children, className }: CardProps) {
    return (
        <div className={cn('px-6 py-4 border-b border-[#E2E8F0] dark:border-[#334155]', className)}>
            {children}
        </div>
    );
}

export function CardContent({ children, className }: CardProps) {
    return <div className={cn('p-6', className)}>{children}</div>;
}

export function CardFooter({ children, className }: CardProps) {
    return (
        <div className={cn('px-6 py-4 border-t border-[#E2E8F0] dark:border-[#334155]', className)}>
            {children}
        </div>
    );
}

'use client';

import { cn } from '@/lib/utils/cn';
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
        const baseStyles =
            'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

        const variants = {
            primary: 'bg-[#0066CC] text-white hover:bg-[#004C99] focus:ring-[#0066CC] shadow-lg shadow-blue-500/25',
            secondary: 'bg-white text-[#0F172A] border border-[#E2E8F0] hover:bg-[#F1F5F9] focus:ring-[#0066CC]',
            danger: 'bg-[#EF4444] text-white hover:bg-red-600 focus:ring-red-500 shadow-lg shadow-red-500/25',
            ghost: 'bg-transparent text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]',
        };

        const sizes = {
            sm: 'px-3 py-2 text-sm',
            md: 'px-5 py-3 text-base',
            lg: 'px-8 py-4 text-lg',
        };

        return (
            <button
                ref={ref}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                disabled={disabled || loading}
                {...props}
            >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';

export { Button };

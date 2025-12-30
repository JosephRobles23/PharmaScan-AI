'use client';

import { cn } from '@/lib/utils/cn';
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, id, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={id}
                        className="block text-sm font-medium text-[#0F172A] dark:text-[#F1F5F9] mb-2"
                    >
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={id}
                    className={cn(
                        'w-full px-4 py-3 rounded-xl border bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F1F5F9]',
                        'placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-transparent',
                        'transition-all duration-200',
                        error ? 'border-[#EF4444] focus:ring-[#EF4444]' : 'border-[#E2E8F0] dark:border-[#334155]',
                        className
                    )}
                    {...props}
                />
                {error && (
                    <p className="mt-1 text-sm text-[#EF4444]">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export { Input };

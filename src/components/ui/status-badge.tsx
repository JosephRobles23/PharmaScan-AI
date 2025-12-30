'use client';

import { cn } from '@/lib/utils/cn';
import { getExpirationStatusLabel, getExpirationStatusColor, ExpirationStatus } from '@/lib/utils/expiration';

interface StatusBadgeProps {
    status: ExpirationStatus;
    className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                getExpirationStatusColor(status),
                className
            )}
        >
            {status === 'valid' && '✓ '}
            {status === 'expiring_soon' && '⚠ '}
            {status === 'expired' && '✕ '}
            {getExpirationStatusLabel(status)}
        </span>
    );
}

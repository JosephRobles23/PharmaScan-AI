import { addMonths, isBefore, isAfter, parseISO } from 'date-fns';

export type ExpirationStatus = 'valid' | 'expiring_soon' | 'expired';

export function getExpirationStatus(
    expirationDate: string | Date,
    alertMonths: number = 3
): ExpirationStatus {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expDate = typeof expirationDate === 'string'
        ? parseISO(expirationDate)
        : expirationDate;
    expDate.setHours(0, 0, 0, 0);

    // Check if expired
    if (isBefore(expDate, today)) {
        return 'expired';
    }

    // Check if expiring soon (within alertMonths)
    const alertDate = addMonths(today, alertMonths);
    if (isBefore(expDate, alertDate) || expDate.getTime() === alertDate.getTime()) {
        return 'expiring_soon';
    }

    return 'valid';
}

export function getExpirationStatusLabel(status: ExpirationStatus): string {
    const labels: Record<ExpirationStatus, string> = {
        valid: 'Válido',
        expiring_soon: 'Por vencer',
        expired: 'Vencido',
    };
    return labels[status];
}

export function getExpirationStatusColor(status: ExpirationStatus): string {
    const colors: Record<ExpirationStatus, string> = {
        valid: 'text-green-600 bg-green-100',
        expiring_soon: 'text-amber-600 bg-amber-100',
        expired: 'text-red-600 bg-red-100',
    };
    return colors[status];
}

export function parseExpirationDate(dateString: string): Date | null {
    // Common date formats: DD/MM/YYYY, MM/YYYY, YYYY-MM-DD, MM-YYYY
    const patterns = [
        // DD/MM/YYYY or DD-MM-YYYY
        /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
        // MM/YYYY or MM-YYYY
        /(\d{1,2})[\/\-](\d{4})/,
        // YYYY-MM-DD (ISO)
        /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
        // YYYY/MM
        /(\d{4})[\/\-](\d{1,2})/,
    ];

    for (const pattern of patterns) {
        const match = dateString.match(pattern);
        if (match) {
            if (match.length === 4 && match[3].length === 4) {
                // DD/MM/YYYY
                const day = parseInt(match[1], 10);
                const month = parseInt(match[2], 10) - 1;
                const year = parseInt(match[3], 10);
                return new Date(year, month, day);
            } else if (match.length === 3 && match[2].length === 4) {
                // MM/YYYY - use last day of month
                const month = parseInt(match[1], 10) - 1;
                const year = parseInt(match[2], 10);
                return new Date(year, month + 1, 0); // Last day of month
            } else if (match.length === 4 && match[1].length === 4) {
                // YYYY-MM-DD (ISO)
                const year = parseInt(match[1], 10);
                const month = parseInt(match[2], 10) - 1;
                const day = parseInt(match[3], 10);
                return new Date(year, month, day);
            } else if (match.length === 3 && match[1].length === 4) {
                // YYYY/MM
                const year = parseInt(match[1], 10);
                const month = parseInt(match[2], 10) - 1;
                return new Date(year, month + 1, 0);
            }
        }
    }

    return null;
}

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

const SPANISH_MONTHS: Record<string, number> = {
    ENE: 0, ENERO: 0, JAN: 0,
    FEB: 1, FEBRERO: 1,
    MAR: 2, MARZO: 2,
    ABR: 3, ABRIL: 3, APR: 3,
    MAY: 4, MAYO: 4,
    JUN: 5, JUNIO: 5,
    JUL: 6, JULIO: 6,
    AGO: 7, AGOSTO: 7, AUG: 7,
    SEP: 8, SEPTIEMBRE: 8, SET: 8,
    OCT: 9, OCTUBRE: 9,
    NOV: 10, NOVIEMBRE: 10,
    DIC: 11, DICIEMBRE: 11, DEC: 11,
};

export function parseExpirationDate(dateString: string): Date | null {
    const cleanDate = dateString.toUpperCase().trim();

    // Check for Spanish Month + Year (e.g., ABR2026, NOV 24)
    const spanishMonthPattern = /([A-Z]{3,})\.?[\s-]*(\d{2,4})/;
    const spanishMatch = cleanDate.match(spanishMonthPattern);

    if (spanishMatch) {
        const monthStr = spanishMatch[1];
        const yearStr = spanishMatch[2];

        if (SPANISH_MONTHS.hasOwnProperty(monthStr)) {
            const month = SPANISH_MONTHS[monthStr];
            const year = yearStr.length === 2 ? 2000 + parseInt(yearStr, 10) : parseInt(yearStr, 10);
            return new Date(year, month + 1, 0); // Last day of month
        }
    }

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
        // MM/YY (Short year)
        /(\d{1,2})[\/\-\s](\d{2})\b/
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
            } else if (match.length === 3 && match[2].length === 2) {
                // MM/YY
                const month = parseInt(match[1], 10) - 1;
                const year = 2000 + parseInt(match[2], 10);
                // Validation: month must be 0-11
                if (month >= 0 && month <= 11) {
                    return new Date(year, month + 1, 0);
                }
            }
        }
    }

    return null;
}

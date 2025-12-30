'use client';

import { cn } from '@/lib/utils/cn';
import { Package } from 'lucide-react';

interface UnitCounterProps {
    count: number;
    productName: string;
    className?: string;
}

export function UnitCounter({ count, productName, className }: UnitCounterProps) {
    return (
        <div
            className={cn(
                'bg-gradient-to-br from-[#0066CC] to-[#004C99] rounded-2xl p-6 text-white',
                'shadow-lg shadow-blue-500/25',
                className
            )}
        >
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                    <Package className="w-8 h-8" />
                </div>
                <div>
                    <p className="text-white/80 text-sm">Unidades escaneadas</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold">{count}</span>
                        <span className="text-white/60 text-sm">unidades</span>
                    </div>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/20">
                <p className="text-white/60 text-xs">Producto actual</p>
                <p className="font-medium truncate">{productName}</p>
            </div>
        </div>
    );
}

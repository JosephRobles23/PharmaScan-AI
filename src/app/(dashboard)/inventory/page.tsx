'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { Loading } from '@/components/ui/loading';
import { ProductUnit, ProductSummary } from '@/types';
import { ExpirationStatus } from '@/lib/utils/expiration';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Search,
    Filter,
    Package,
    ChevronDown,
    ChevronUp,
    Trash2,
    Calendar,
    BarChart3,
} from 'lucide-react';

type ViewMode = 'summary' | 'units';
type FilterStatus = 'all' | 'valid' | 'expiring_soon' | 'expired';

export default function InventoryPage() {
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('summary');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [products, setProducts] = useState<ProductSummary[]>([]);
    const [units, setUnits] = useState<ProductUnit[]>([]);
    const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
    const [productUnits, setProductUnits] = useState<Record<string, ProductUnit[]>>({});

    useEffect(() => {
        loadInventory();
    }, []);

    const loadInventory = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Load product summaries
            const { data: summaries } = await supabase
                .from('products_summary')
                .select('*')
                .eq('user_id', user.id)
                .order('last_updated', { ascending: false });

            if (summaries) {
                setProducts(summaries);
            }

            // Load all units
            const { data: allUnits } = await supabase
                .from('product_units')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (allUnits) {
                setUnits(allUnits);
            }
        } catch (error) {
            console.error('Error loading inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadProductUnits = async (productName: string) => {
        if (productUnits[productName]) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('product_units')
                .select('*')
                .eq('user_id', user.id)
                .eq('product_name', productName)
                .order('expiration_date', { ascending: true });

            if (data) {
                setProductUnits((prev) => ({ ...prev, [productName]: data }));
            }
        } catch (error) {
            console.error('Error loading product units:', error);
        }
    };

    const handleExpandProduct = (productName: string) => {
        if (expandedProduct === productName) {
            setExpandedProduct(null);
        } else {
            setExpandedProduct(productName);
            loadProductUnits(productName);
        }
    };

    const handleDeleteUnit = async (unitId: string, productName: string) => {
        if (!confirm('¿Estás seguro de eliminar esta unidad?')) return;

        try {
            const { error } = await supabase
                .from('product_units')
                .delete()
                .eq('id', unitId);

            if (error) throw error;

            // Update local state
            setProductUnits((prev) => ({
                ...prev,
                [productName]: prev[productName]?.filter((u) => u.id !== unitId) || [],
            }));

            setUnits((prev) => prev.filter((u) => u.id !== unitId));

            // Reload to update counts
            loadInventory();
        } catch (error) {
            console.error('Error deleting unit:', error);
        }
    };

    // Filter products
    const filteredProducts = products.filter((product) => {
        if (searchQuery && !product.product_name.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }
        return true;
    });

    // Filter units
    const filteredUnits = units.filter((unit) => {
        if (searchQuery && !unit.product_name.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }
        if (filterStatus !== 'all' && unit.expiration_status !== filterStatus) {
            return false;
        }
        return true;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loading size="lg" text="Cargando inventario..." />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                    Inventario
                </h1>
                <p className="text-[#64748B] mt-1">
                    {products.length} productos · {units.length} unidades registradas
                </p>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                    <Input
                        placeholder="Buscar productos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12"
                    />
                </div>

                {/* View Toggle */}
                <div className="flex rounded-xl border border-[#E2E8F0] dark:border-[#334155] overflow-hidden">
                    <button
                        onClick={() => setViewMode('summary')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${viewMode === 'summary'
                                ? 'bg-[#0066CC] text-white'
                                : 'bg-white dark:bg-[#1E293B] text-[#64748B] hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A]'
                            }`}
                    >
                        <BarChart3 className="w-4 h-4 inline mr-2" />
                        Resumen
                    </button>
                    <button
                        onClick={() => setViewMode('units')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${viewMode === 'units'
                                ? 'bg-[#0066CC] text-white'
                                : 'bg-white dark:bg-[#1E293B] text-[#64748B] hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A]'
                            }`}
                    >
                        <Package className="w-4 h-4 inline mr-2" />
                        Unidades
                    </button>
                </div>
            </div>

            {/* Filter (for units view) */}
            {viewMode === 'units' && (
                <div className="flex gap-2 flex-wrap">
                    {(['all', 'valid', 'expiring_soon', 'expired'] as FilterStatus[]).map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filterStatus === status
                                    ? 'bg-[#0066CC] text-white'
                                    : 'bg-white dark:bg-[#1E293B] text-[#64748B] border border-[#E2E8F0] dark:border-[#334155]'
                                }`}
                        >
                            {status === 'all' && 'Todos'}
                            {status === 'valid' && '✓ Válidos'}
                            {status === 'expiring_soon' && '⚠ Por vencer'}
                            {status === 'expired' && '✕ Vencidos'}
                        </button>
                    ))}
                </div>
            )}

            {/* Summary View */}
            {viewMode === 'summary' && (
                <div className="space-y-3">
                    {filteredProducts.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Package className="w-16 h-16 text-[#E2E8F0] dark:text-[#334155] mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-[#0F172A] dark:text-[#F1F5F9] mb-2">
                                    No hay productos
                                </h3>
                                <p className="text-[#64748B]">
                                    {searchQuery ? 'No se encontraron resultados' : 'Comienza escaneando productos'}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredProducts.map((product) => (
                            <Card key={product.id}>
                                <CardContent className="p-0">
                                    <button
                                        onClick={() => handleExpandProduct(product.product_name)}
                                        className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A] transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center">
                                                <Package className="w-6 h-6 text-[#0066CC]" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-[#0F172A] dark:text-[#F1F5F9]">
                                                    {product.product_name}
                                                </p>
                                                <p className="text-sm text-[#64748B]">
                                                    Actualizado: {format(new Date(product.last_updated), "dd MMM yyyy", { locale: es })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-2xl font-bold text-[#0066CC]">
                                                {product.total_quantity}
                                            </span>
                                            {expandedProduct === product.product_name ? (
                                                <ChevronUp className="w-5 h-5 text-[#64748B]" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-[#64748B]" />
                                            )}
                                        </div>
                                    </button>

                                    {/* Expanded units */}
                                    {expandedProduct === product.product_name && (
                                        <div className="border-t border-[#E2E8F0] dark:border-[#334155] p-4 bg-[#F8FAFC] dark:bg-[#0F172A]">
                                            {productUnits[product.product_name] ? (
                                                <div className="space-y-2">
                                                    {productUnits[product.product_name].map((unit) => (
                                                        <div
                                                            key={unit.id}
                                                            className="flex items-center justify-between p-3 bg-white dark:bg-[#1E293B] rounded-xl"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <Calendar className="w-4 h-4 text-[#64748B]" />
                                                                <div>
                                                                    <p className="text-sm font-medium text-[#0F172A] dark:text-[#F1F5F9]">
                                                                        {format(new Date(unit.expiration_date), "dd MMM yyyy", { locale: es })}
                                                                    </p>
                                                                    <p className="text-xs text-[#64748B]">
                                                                        Código: {unit.product_code || 'N/A'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <StatusBadge status={unit.expiration_status as ExpirationStatus} />
                                                                <button
                                                                    onClick={() => handleDeleteUnit(unit.id, product.product_name)}
                                                                    className="p-2 text-[#EF4444] hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <Loading size="sm" text="Cargando unidades..." />
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}

            {/* Units View */}
            {viewMode === 'units' && (
                <div className="space-y-3">
                    {filteredUnits.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Package className="w-16 h-16 text-[#E2E8F0] dark:text-[#334155] mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-[#0F172A] dark:text-[#F1F5F9] mb-2">
                                    No hay unidades
                                </h3>
                                <p className="text-[#64748B]">
                                    {searchQuery || filterStatus !== 'all'
                                        ? 'No se encontraron resultados'
                                        : 'Comienza escaneando productos'}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredUnits.map((unit) => (
                            <Card key={unit.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-[#0F172A] dark:text-[#F1F5F9]">
                                                {unit.product_name}
                                            </p>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-[#64748B]">
                                                <span>Código: {unit.product_code || 'N/A'}</span>
                                                <span>·</span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {format(new Date(unit.expiration_date), "dd MMM yyyy", { locale: es })}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <StatusBadge status={unit.expiration_status as ExpirationStatus} />
                                            <button
                                                onClick={() => handleDeleteUnit(unit.id, unit.product_name)}
                                                className="p-2 text-[#EF4444] hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

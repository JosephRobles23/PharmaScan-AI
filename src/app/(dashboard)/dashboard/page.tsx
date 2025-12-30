'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Loading } from '@/components/ui/loading';
import {
    ScanLine,
    Package,
    AlertTriangle,
    TrendingUp,
    ArrowRight,
    Calendar,
} from 'lucide-react';
import { ProductSummary, ProductUnit } from '@/types';
import { getExpirationStatus, ExpirationStatus } from '@/lib/utils/expiration';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function DashboardPage() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalUnits: 0,
        expiringSoon: 0,
        expired: 0,
    });
    const [recentProducts, setRecentProducts] = useState<ProductSummary[]>([]);
    const [alertProducts, setAlertProducts] = useState<ProductUnit[]>([]);
    const [alertMonths, setAlertMonths] = useState(3);
    const [userName, setUserName] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Get user user
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // Extract first name from metadata or email
                const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
                const firstName = fullName.split(' ')[0] || user.email?.split('@')[0] || 'Usuario';
                setUserName(firstName);

                const { data: settings } = await supabase
                    .from('user_settings')
                    .select('expiration_alert_months')
                    .eq('user_id', user.id)
                    .single();

                if (settings) {
                    setAlertMonths(settings.expiration_alert_months);
                }

                // ... keep existing data fetching logic ...
                // Get product summaries
                const { data: products } = await supabase
                    .from('products_summary')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('last_updated', { ascending: false })
                    .limit(5);

                if (products) {
                    setRecentProducts(products);
                    const totalUnits = products.reduce((acc, p) => acc + p.total_quantity, 0);
                    setStats((prev) => ({
                        ...prev,
                        totalProducts: products.length,
                        totalUnits,
                    }));
                }

                // Get units with expiration issues
                const { data: units } = await supabase
                    .from('product_units')
                    .select('*')
                    .eq('user_id', user.id)
                    .in('expiration_status', ['expiring_soon', 'expired'])
                    .order('expiration_date', { ascending: true })
                    .limit(10);

                if (units) {
                    setAlertProducts(units);
                    const expiringSoon = units.filter((u) => u.expiration_status === 'expiring_soon').length;
                    const expired = units.filter((u) => u.expiration_status === 'expired').length;
                    setStats((prev) => ({ ...prev, expiringSoon, expired }));
                }
            } catch (error) {
                console.error('Error loading dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [supabase]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loading size="lg" text="Cargando datos..." />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-black dark:text-white tracking-tight">
                        Hola, {userName} 👋
                    </h1>
                    <p className="text-[#8E8E93] text-sm mt-0.5">
                        Resumen de tu inventario
                    </p>
                </div>
                <Link href="/scan">
                    <Button size="default">
                        <ScanLine className="w-4 h-4 mr-2" />
                        Nuevo Escaneo
                    </Button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                                <Package className="w-5 h-5 text-[#0066CC]" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                                    {stats.totalProducts}
                                </p>
                                <p className="text-xs text-[#64748B]">Productos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-[#10B981]" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                                    {stats.totalUnits}
                                </p>
                                <p className="text-xs text-[#64748B]">Unidades</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                                    {stats.expiringSoon}
                                </p>
                                <p className="text-xs text-[#64748B]">Por vencer</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-[#EF4444]" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                                    {stats.expired}
                                </p>
                                <p className="text-xs text-[#64748B]">Vencidos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Alerts Section */}
            {alertProducts.length > 0 && (
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-base font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                                ⚠️ Alertas
                            </h2>
                            <span className="text-xs text-[#64748B]">
                                {alertMonths} meses
                            </span>
                        </div>
                        <div className="space-y-2">
                            {alertProducts.slice(0, 5).map((product) => (
                                <div
                                    key={product.id}
                                    className="flex items-center justify-between p-2.5 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-lg"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-[#0F172A] dark:text-[#F1F5F9]">
                                            {product.product_name}
                                        </p>
                                        <p className="text-xs text-[#64748B]">
                                            {product.product_code || 'N/A'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <StatusBadge status={product.expiration_status as ExpirationStatus} />
                                        <p className="text-[10px] text-[#64748B] mt-0.5">
                                            {format(new Date(product.expiration_date), "dd MMM yy", { locale: es })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {alertProducts.length > 5 && (
                            <Link href="/inventory?filter=alerts">
                                <Button variant="ghost" size="sm" className="w-full mt-2 h-8 text-xs">
                                    Ver todos ({alertProducts.length})
                                    <ArrowRight className="w-3 h-3 ml-2" />
                                </Button>
                            </Link>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Recent Products */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-base font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                            Recientes
                        </h2>
                        <Link href="/inventory">
                            <Button variant="ghost" size="sm" className="h-8 text-xs">
                                Ver todo
                                <ArrowRight className="w-3 h-3 ml-2" />
                            </Button>
                        </Link>
                    </div>

                    {recentProducts.length === 0 ? (
                        <div className="text-center py-8">
                            <Package className="w-12 h-12 text-[#E2E8F0] dark:text-[#334155] mx-auto mb-3" />
                            <h3 className="text-base font-medium text-[#0F172A] dark:text-[#F1F5F9] mb-1">
                                Sin productos aún
                            </h3>
                            <p className="text-sm text-[#64748B] mb-3">
                                Comienza escaneando tu primer producto
                            </p>
                            <Link href="/scan">
                                <Button size="sm">
                                    <ScanLine className="w-4 h-4 mr-2" />
                                    Comenzar
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs text-[#64748B]">
                                        <th className="pb-2 font-medium">Producto</th>
                                        <th className="pb-2 font-medium text-right">Cant.</th>
                                        <th className="pb-2 font-medium text-right hidden sm:table-cell">
                                            Fecha
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#334155]">
                                    {recentProducts.map((product) => (
                                        <tr key={product.id}>
                                            <td className="py-2.5">
                                                <p className="text-sm font-medium text-[#0F172A] dark:text-[#F1F5F9]">
                                                    {product.product_name}
                                                </p>
                                            </td>
                                            <td className="py-2.5 text-right">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-[#0066CC]">
                                                    {product.total_quantity}
                                                </span>
                                            </td>
                                            <td className="py-2.5 text-right text-xs text-[#64748B] hidden sm:table-cell">
                                                {format(new Date(product.last_updated), "dd MMM yy", { locale: es })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-black dark:text-white tracking-tight">
                        Hola, {userName} 👋
                    </h1>
                    <p className="text-[#8E8E93] mt-1">
                        Aquí tienes el resumen de tu inventario
                    </p>
                </div>
                <Link href="/scan">
                    <Button size="lg">
                        <ScanLine className="w-5 h-5 mr-2" />
                        Nuevo Escaneo
                    </Button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                                <Package className="w-6 h-6 text-[#0066CC]" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                                    {stats.totalProducts}
                                </p>
                                <p className="text-sm text-[#64748B]">Productos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-[#10B981]" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                                    {stats.totalUnits}
                                </p>
                                <p className="text-sm text-[#64748B]">Unidades</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-[#F59E0B]" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                                    {stats.expiringSoon}
                                </p>
                                <p className="text-sm text-[#64748B]">Por vencer</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-[#EF4444]" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                                    {stats.expired}
                                </p>
                                <p className="text-sm text-[#64748B]">Vencidos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Alerts Section */}
            {alertProducts.length > 0 && (
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                                ⚠️ Alertas de Vencimiento
                            </h2>
                            <span className="text-sm text-[#64748B]">
                                Alerta: {alertMonths} meses
                            </span>
                        </div>
                        <div className="space-y-3">
                            {alertProducts.slice(0, 5).map((product) => (
                                <div
                                    key={product.id}
                                    className="flex items-center justify-between p-3 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-xl"
                                >
                                    <div>
                                        <p className="font-medium text-[#0F172A] dark:text-[#F1F5F9]">
                                            {product.product_name}
                                        </p>
                                        <p className="text-sm text-[#64748B]">
                                            Código: {product.product_code || 'N/A'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <StatusBadge status={product.expiration_status as ExpirationStatus} />
                                        <p className="text-xs text-[#64748B] mt-1">
                                            {format(new Date(product.expiration_date), "dd MMM yyyy", { locale: es })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {alertProducts.length > 5 && (
                            <Link href="/inventory?filter=alerts">
                                <Button variant="ghost" className="w-full mt-4">
                                    Ver todos ({alertProducts.length})
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Recent Products */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                            Productos Recientes
                        </h2>
                        <Link href="/inventory">
                            <Button variant="ghost" size="sm">
                                Ver todo
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </div>

                    {recentProducts.length === 0 ? (
                        <div className="text-center py-12">
                            <Package className="w-16 h-16 text-[#E2E8F0] dark:text-[#334155] mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-[#0F172A] dark:text-[#F1F5F9] mb-2">
                                Sin productos aún
                            </h3>
                            <p className="text-[#64748B] mb-4">
                                Comienza escaneando tu primer producto
                            </p>
                            <Link href="/scan">
                                <Button>
                                    <ScanLine className="w-5 h-5 mr-2" />
                                    Comenzar a escanear
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-sm text-[#64748B]">
                                        <th className="pb-3 font-medium">Producto</th>
                                        <th className="pb-3 font-medium text-right">Cantidad</th>
                                        <th className="pb-3 font-medium text-right hidden sm:table-cell">
                                            Última actualización
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#334155]">
                                    {recentProducts.map((product) => (
                                        <tr key={product.id}>
                                            <td className="py-3">
                                                <p className="font-medium text-[#0F172A] dark:text-[#F1F5F9]">
                                                    {product.product_name}
                                                </p>
                                            </td>
                                            <td className="py-3 text-right">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-[#0066CC]">
                                                    {product.total_quantity}
                                                </span>
                                            </td>
                                            <td className="py-3 text-right text-sm text-[#64748B] hidden sm:table-cell">
                                                {format(new Date(product.last_updated), "dd MMM yyyy", { locale: es })}
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

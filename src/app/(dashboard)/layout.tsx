'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils/cn';
import {
    Pill,
    LayoutDashboard,
    ScanLine,
    Package,
    Settings,
    LogOut,
    Menu,
    X,
} from 'lucide-react';

const navItems = [
    { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
    { href: '/scan', label: 'Escanear', icon: ScanLine },
    { href: '/inventory', label: 'Inventario', icon: Package },
    { href: '/settings', label: 'Configuración', icon: Settings },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserEmail(user.email || null);
            }
        };
        getUser();
    }, [supabase]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A]">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
                <div className="flex flex-col flex-grow bg-white dark:bg-[#1E293B] border-r border-[#E2E8F0] dark:border-[#334155]">
                    {/* Logo */}
                    <div className="flex items-center gap-3 px-6 py-6 border-b border-[#E2E8F0] dark:border-[#334155]">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#0066CC] to-[#004C99] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                            <Pill className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                                PharmaScan AI
                            </h1>
                            <p className="text-xs text-[#64748B]">Gestión de Inventario</p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                                        isActive
                                            ? 'bg-[#0066CC] text-white shadow-lg shadow-blue-500/25'
                                            : 'text-[#64748B] hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A] hover:text-[#0F172A] dark:hover:text-[#F1F5F9]'
                                    )}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User section */}
                    <div className="p-4 border-t border-[#E2E8F0] dark:border-[#334155]">
                        <div className="flex items-center gap-3 px-4 py-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-[#0066CC] flex items-center justify-center text-white font-medium">
                                {userEmail?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[#0F172A] dark:text-[#F1F5F9] truncate">
                                    {userEmail}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-[#EF4444] hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-[#1E293B] border-b border-[#E2E8F0] dark:border-[#334155]">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#0066CC] to-[#004C99] rounded-xl flex items-center justify-center">
                            <Pill className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                            PharmaScan AI
                        </span>
                    </div>
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 rounded-xl hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A]"
                    >
                        {mobileMenuOpen ? (
                            <X className="w-6 h-6 text-[#0F172A] dark:text-[#F1F5F9]" />
                        ) : (
                            <Menu className="w-6 h-6 text-[#0F172A] dark:text-[#F1F5F9]" />
                        )}
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="absolute top-full left-0 right-0 bg-white dark:bg-[#1E293B] border-b border-[#E2E8F0] dark:border-[#334155] p-4 space-y-1 shadow-lg">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={cn(
                                        'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                                        isActive
                                            ? 'bg-[#0066CC] text-white'
                                            : 'text-[#64748B] hover:bg-[#F8FAFC] dark:hover:bg-[#0F172A]'
                                    )}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                </Link>
                            );
                        })}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-[#EF4444] hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            Cerrar Sesión
                        </button>
                    </div>
                )}
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#1E293B] border-t border-[#E2E8F0] dark:border-[#334155] safe-area-pb">
                <div className="flex items-center justify-around py-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors min-w-[64px]',
                                    isActive
                                        ? 'text-[#0066CC]'
                                        : 'text-[#64748B] hover:text-[#0F172A] dark:hover:text-[#F1F5F9]'
                                )}
                            >
                                <item.icon className={cn('w-6 h-6', isActive && 'scale-110')} />
                                <span className="text-xs font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Main Content */}
            <main className="lg:pl-72">
                <div className="pt-16 pb-20 lg:pt-0 lg:pb-0 min-h-screen">
                    <div className="p-4 lg:p-8">{children}</div>
                </div>
            </main>
        </div>
    );
}

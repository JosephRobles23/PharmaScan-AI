'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
    const [userAvatar, setUserAvatar] = useState<string | null>(null);

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserEmail(user.email || null);
                setUserAvatar(user.user_metadata?.avatar_url || null);
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
        <div className="min-h-screen bg-[#F2F2F7] dark:bg-[#000000]">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
                <div className="flex flex-col flex-grow bg-white dark:bg-[#1C1C1E] border-r border-[#E5E5EA] dark:border-[#38383A]">
                    {/* Logo */}
                    <div className="flex items-center gap-3 px-6 py-6 border-b border-[#E5E5EA] dark:border-[#38383A]">
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-sm">
                            <Image
                                src="/pharmascan-logo.png"
                                alt="PharmaScan AI"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-black dark:text-white tracking-tight">
                                PharmaScan AI
                            </h1>
                            <p className="text-xs text-[#8E8E93]">Gestión de Inventario</p>
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
                                            ? 'bg-black dark:bg-white text-white dark:text-black shadow-md'
                                            : 'text-[#8E8E93] hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] hover:text-black dark:hover:text-white'
                                    )}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User section */}
                    <div className="p-4 border-t border-[#E5E5EA] dark:border-[#38383A]">
                        <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-2xl">
                            {userAvatar ? (
                                <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/10">
                                    <Image
                                        src={userAvatar}
                                        alt="Avatar"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-black flex items-center justify-center text-white font-medium">
                                    {userEmail?.charAt(0).toUpperCase() || 'U'}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-black dark:text-white truncate">
                                    {userEmail}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-[#FF3B30] hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-md border-b border-[#E5E5EA] dark:border-[#38383A]">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8 rounded-lg overflow-hidden shadow-sm">
                            <Image
                                src="/pharmascan-logo.png"
                                alt="PharmaScan AI"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <span className="font-bold text-black dark:text-white tracking-tight">
                            PharmaScan AI
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* User Avatar Tiny */}
                        {userAvatar && (
                            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#E5E5EA] dark:border-[#38383A]">
                                <Image src={userAvatar} alt="User" fill className="object-cover" />
                            </div>
                        )}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 rounded-xl hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E]"
                        >
                            {mobileMenuOpen ? (
                                <X className="w-6 h-6 text-black dark:text-white" />
                            ) : (
                                <Menu className="w-6 h-6 text-black dark:text-white" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="absolute top-full left-0 right-0 bg-white dark:bg-[#1C1C1E] border-b border-[#E5E5EA] dark:border-[#38383A] p-4 space-y-1 shadow-2xl animate-fade-in">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={cn(
                                        'flex items-center gap-3 px-4 py-4 rounded-xl text-sm font-medium transition-all',
                                        isActive
                                            ? 'bg-black dark:bg-white text-white dark:text-black'
                                            : 'text-[#8E8E93] hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E]'
                                    )}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                </Link>
                            );
                        })}
                        <div className="pt-2 mt-2 border-t border-[#E5E5EA] dark:border-[#38383A]">
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 w-full px-4 py-4 rounded-xl text-sm font-medium text-[#FF3B30] hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                                <LogOut className="w-5 h-5" />
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-md border-t border-[#E5E5EA] dark:border-[#38383A] safe-area-pb">
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
                                        ? 'text-black dark:text-white'
                                        : 'text-[#8E8E93] hover:text-black dark:hover:text-white'
                                )}
                            >
                                <item.icon className={cn('w-6 h-6', isActive && 'scale-110 transition-transform')} />
                                <span className={cn("text-[10px] font-medium", isActive ? "font-semibold" : "font-normal")}>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Main Content */}
            <main className="lg:pl-72">
                <div className="pt-20 pb-24 lg:pt-0 lg:pb-0 min-h-screen">
                    <div className="p-4 lg:p-8 max-w-7xl mx-auto">{children}</div>
                </div>
            </main>
        </div>
    );
}

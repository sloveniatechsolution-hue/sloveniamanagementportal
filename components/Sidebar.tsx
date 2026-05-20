'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, CalendarCheck, Settings, Zap, LogOut, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useStore } from '@/lib/store';
import toast from 'react-hot-toast';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, setCurrentUser } = useStore();

  const isPublicPage = pathname === '/' || pathname === '/register' || pathname === '/login';

  if (!currentUser || isPublicPage) return null;

  const adminNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Operators', href: '/operators', icon: Users },
    { name: 'Attendance & Work', href: '/attendance', icon: CalendarCheck },
    { name: 'Payments', href: '/payments', icon: CreditCard },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const operatorNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Attendance', href: '/attendance', icon: CalendarCheck },
    { name: 'Payments & Receipts', href: '/payments', icon: CreditCard },
    { name: 'My Profile', href: '/profile', icon: Users },
  ];

  const navigation = currentUser.role === 'admin' ? adminNavigation : operatorNavigation;

  const handleLogout = () => {
    setCurrentUser(null);
    router.push('/');
    toast.success('Logged out successfully');
  };

  return (
    <div className="flex h-screen w-64 flex-col border-r border-neutral-200 bg-white  ">
      <div className="flex h-16 shrink-0 items-center gap-2 px-6 border-b border-neutral-200 ">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
          <Zap className="h-5 w-5" />
        </div>
        <span className="text-lg font-bold tracking-tight text-neutral-900 ">
          SMP Portal
        </span>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
        <nav className="flex-1 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center gap-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-blue-50 text-blue-700  '
                    : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900  :bg-neutral-800/50 :text-white'
                )}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5 shrink-0 transition-colors duration-200',
                    isActive ? 'text-blue-700 ' : 'text-neutral-400 group-hover:text-neutral-600 :text-neutral-300'
                  )}
                  aria-hidden="true"
                />
                {item.name}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute left-0 h-6 w-1 rounded-r-full bg-blue-600 "
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="border-t border-neutral-200 p-4 ">
        <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-2">
          <div className="flex items-center gap-3">
            <img
              className="h-9 w-9 rounded-full bg-neutral-200 object-cover"
              src={`https://ui-avatars.com/api/?name=${currentUser.name.replace(' ', '+')}&background=random`}
              alt={currentUser.name}
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-neutral-900  truncate max-w-[100px]">{currentUser.name}</span>
              <span className="text-xs text-neutral-500  capitalize">{currentUser.role}</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-1.5 text-neutral-400 hover:text-red-600 :text-red-400 transition-colors"
            title="Log out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

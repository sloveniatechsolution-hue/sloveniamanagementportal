'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { usePathname, useRouter } from 'next/navigation';
import { Building2, Zap, User, Clock, LogOut, ShieldAlert, Menu } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, setCurrentUser, isSidebarOpen, setSidebarOpen } = useStore();
  const [currentDate, setCurrentDate] = useState('');

  const isPublicPage = pathname === '/' || pathname === '/register' || pathname === '/login' || pathname === '/slovenian-admin-login-system';

  // Format date on client only to avoid hydration mismatch
  useEffect(() => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    setCurrentDate(new Date().toLocaleDateString('en-US', options));
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
    router.push('/');
    toast.success('Logged out successfully');
  };

  // Get Page Title from Pathname
  const getPageTitle = (path: string) => {
    switch (path) {
      case '/dashboard':
        return 'Dashboard';
      case '/operators':
        return 'Workforce & Operators';
      case '/attendance':
        return 'Attendance & Logs';
      case '/payments':
        return 'Payroll & Payments';
      case '/profile':
        return 'My Profile';
      case '/settings':
        return 'System Settings';
      case '/login':
        return 'Access Portal';
      case '/register':
        return 'Operator Registration';
      default:
        return 'SMP Portal';
    }
  };

  // 1. Authenticated Top Dashboard Navbar
  if (currentUser && !isPublicPage) {
    return (
      <header className="sticky top-0 z-40 flex h-16 w-full shrink-0 items-center justify-between border-b border-neutral-200 bg-white/85 px-6 backdrop-blur-md">
        {/* Left Side: Breadcrumb & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 lg:hidden focus:outline-none transition-colors"
            aria-label="Toggle navigation"
          >
            <Menu className="h-5.5 w-5.5" />
          </button>
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider hidden sm:inline-block">SMP</span>
          <span className="text-neutral-300 hidden sm:inline-block">/</span>
          <span className="text-sm font-semibold text-neutral-700">
            {getPageTitle(pathname)}
          </span>
        </div>

        {/* Right Side: Quick Stats, Live Date & User Profile info */}
        <div className="flex items-center gap-4">
          {/* Live Date */}
          {currentDate && (
            <div className="hidden md:flex items-center gap-1.5 text-xs text-neutral-500 font-semibold bg-neutral-100 px-3 py-1.5 rounded-lg">
              <Clock className="h-3.5 w-3.5 text-neutral-400" />
              <span>{currentDate}</span>
            </div>
          )}

          {/* Role Badge */}
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${
            currentUser.role === 'admin' 
              ? 'bg-blue-50 text-blue-700 border border-blue-200' 
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            {currentUser.role}
          </span>

          <div className="h-6 w-px bg-neutral-200"></div>

          {/* Quick Profile Info */}
          <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img
              className="h-8 w-8 rounded-full bg-neutral-200 object-cover"
              src={`https://ui-avatars.com/api/?name=${currentUser.name.replace(' ', '+')}&background=random`}
              alt={currentUser.name}
            />
            <span className="hidden sm:inline-block text-xs font-semibold text-neutral-700 truncate max-w-[120px]">
              {currentUser.name}
            </span>
          </Link>
        </div>
      </header>
    );
  }

  // 2. Unauthenticated Public Pages Navbar
  return (
    <nav className="border-b border-neutral-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo and Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="bg-blue-600 p-2 rounded-lg group-hover:scale-105 transition-transform">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-neutral-900 tracking-tight">
              Shanghai Yisu InfoTech
            </span>
          </Link>

          {/* Contextual Action Links */}
          <div className="flex items-center gap-4">
            {pathname === '/' && (
              <>
                <Link href="/login" className="text-xs font-bold text-neutral-600 hover:text-neutral-900 transition-colors">
                  Log in
                </Link>
                <Link href="/register" className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-sm transition-all">
                  Register as Operator
                </Link>
              </>
            )}

            {pathname === '/login' && (
              <>
                <Link href="/register" className="text-xs font-bold text-neutral-600 hover:text-neutral-900 transition-colors">
                  Register
                </Link>
                <Link href="/" className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-sm transition-all">
                  Back to Home
                </Link>
              </>
            )}

            {pathname === '/register' && (
              <>
                <Link href="/login" className="text-xs font-bold text-neutral-600 hover:text-neutral-900 transition-colors">
                  Log in
                </Link>
                <Link href="/" className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-sm transition-all">
                  Back to Home
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

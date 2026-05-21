'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { usePathname, useRouter } from 'next/navigation';
import { Building2, Zap, User, Clock, LogOut, ShieldAlert, Menu } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getShiftDetails } from '@/lib/utils';
import { motion } from 'framer-motion';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, setCurrentUser, isSidebarOpen, setSidebarOpen } = useStore();
  const [currentDate, setCurrentDate] = useState('');
  const isPublicPage = pathname === '/' || pathname === '/register' || pathname === '/login' || pathname === '/slovenian-admin-login-system';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [pendingShift, setPendingShift] = useState<{
    date: string;
    shift: 'Day' | 'Evening' | 'Night';
    checkInTime: string;
    metersAssembled: number;
  } | null>(null);
  const [metersInput, setMetersInput] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleLogout = async () => {
    if (currentUser?.role === 'operator') {
      setIsChecking(true);
      try {
        const opRes = await fetch('/api/operators');
        const opData = await opRes.json();
        const operator = opData.operators?.find((o: any) => o.id === currentUser.id);
        const shift = operator?.shift;

        if (shift) {
          // Use server time — prevents local clock manipulation
          let now = new Date();
          try {
            const stRes = await fetch('/api/server-time');
            const { timestamp } = await stRes.json();
            now = new Date(timestamp);
          } catch {
            // fall back to local time
          }

          const shiftInfo = getShiftDetails(shift, now);

          if (shiftInfo.status === 'Active' || shiftInfo.status === 'Ended') {
            const attRes = await fetch(`/api/attendance?operatorId=${currentUser.id}&date=${shiftInfo.shiftDateStr}`);
            const attData = await attRes.json();
            const record = attData.attendance?.[0];

            if (!record || !record.submitted) {
              const fallbackTime = new Intl.DateTimeFormat('sl-SI', {
                timeZone: 'Europe/Ljubljana',
                hour: '2-digit', minute: '2-digit', hour12: false,
              }).format(now);
              setPendingShift({
                date: shiftInfo.shiftDateStr,
                shift: shift,
                checkInTime: record?.checkInTime || fallbackTime,
                metersAssembled: record?.metersAssembled || 0
              });
              setMetersInput(record?.metersAssembled ?? '');
              setIsModalOpen(true);
              setIsChecking(false);
              return;
            }
          }
        }
      } catch (err) {
        console.error('Error checking shift on logout:', err);
      } finally {
        setIsChecking(false);
      }
    }

    executeLogout();
  };

  const executeLogout = () => {
    setCurrentUser(null);
    router.push('/');
    toast.success('Logged out successfully');
  };

  const handleSubmitAndLogout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingShift || !currentUser) return;
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records: [{
            date: pendingShift.date,
            operatorId: currentUser.id,
            status: 'Present',
            metersAssembled: Number(metersInput) || 0,
            shift: pendingShift.shift,
            checkInTime: pendingShift.checkInTime,
            submitted: true
          }]
        })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Shift finalized & logged out successfully');
        setIsModalOpen(false);
        executeLogout();
      } else {
        toast.error('Failed to submit meters.');
      }
    } catch (err) {
      toast.error('Connection error occurred.');
    } finally {
      setIsSubmitting(false);
    }
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

          <button 
            onClick={handleLogout}
            disabled={isChecking}
            className="p-1.5 text-neutral-400 hover:text-red-600 disabled:opacity-50 transition-colors rounded-lg hover:bg-neutral-100"
            title="Log out"
          >
            {isChecking ? (
              <svg className="animate-spin h-4 w-4 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <LogOut className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Logout Interceptor Modal */}
        {isModalOpen && pendingShift && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full max-w-md overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl"
            >
              <div className="flex flex-col gap-4 text-left">
                <div className="flex items-center gap-3 border-b border-neutral-105 pb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 border border-amber-200 text-amber-600">
                    <Zap className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-neutral-900">Shift Log Required</h3>
                    <p className="text-xs text-neutral-500">Submit final meters before logging out</p>
                  </div>
                </div>

                <div className="space-y-3 bg-neutral-50 border border-neutral-200/60 rounded-xl p-4 text-xs text-neutral-600">
                  <div className="flex justify-between">
                    <span className="font-medium text-neutral-500">Shift Type:</span>
                    <span className="font-bold text-neutral-800">{pendingShift.shift} Shift</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-neutral-500">Shift Date:</span>
                    <span className="font-semibold text-neutral-800">{pendingShift.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-neutral-500">Arrival Time:</span>
                    <span className="font-mono font-semibold text-neutral-800">{pendingShift.checkInTime}</span>
                  </div>
                </div>

                <form onSubmit={handleSubmitAndLogout} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2">Final Meters Assembled</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        required
                        value={metersInput}
                        onChange={(e) => setMetersInput(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Enter total meters..."
                        className="block w-full pl-4 pr-16 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white text-neutral-900 placeholder-neutral-400 text-sm font-semibold transition-all"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-neutral-400 font-bold text-xs">
                        meters
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2.5 border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-bold rounded-xl transition-all shadow-sm active:scale-98"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-300 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-98"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit & Log Out'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
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

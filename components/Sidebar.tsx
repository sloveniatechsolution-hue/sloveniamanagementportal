'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, CalendarCheck, Settings, Zap, LogOut, CreditCard } from 'lucide-react';
import { cn, getShiftDetails } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useStore } from '@/lib/store';
import toast from 'react-hot-toast';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, setCurrentUser, isSidebarOpen, setSidebarOpen } = useStore();

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

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, setSidebarOpen]);

  const isPublicPage = pathname === '/' || pathname === '/register' || pathname === '/login' || pathname === '/slovenian-admin-login-system';

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

  const handleLogout = async () => {
    if (currentUser?.role === 'operator') {
      setIsChecking(true);
      try {
        // Fetch current operator's shift from DB to verify
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
            // Check if they have an unsubmitted record
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

    // Default logout
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

  return (
    <>
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-neutral-900/40 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col border-r border-neutral-200 bg-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
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
              disabled={isChecking}
              className="p-1.5 text-neutral-400 hover:text-red-600 disabled:opacity-50 transition-colors"
              title="Log out"
            >
              {isChecking ? (
                <svg className="animate-spin h-5 w-5 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <LogOut className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Logout Interceptor Modal */}
      {isModalOpen && pendingShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/60 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl"
          >
            <div className="flex flex-col gap-4">
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
    </>
  );
}

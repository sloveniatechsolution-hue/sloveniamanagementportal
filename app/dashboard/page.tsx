'use client';

import { useStore } from '@/lib/store';
import { Users, UserCheck, Zap, Activity, CheckCircle2, AlertCircle, ArrowUpRight, Clock, Play, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { cn, getShiftDetails } from '@/lib/utils';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { operators, attendance, currentUser, fetchOperators, fetchAttendance, saveAttendance } = useStore();

  const DAILY_TARGET = 3571; // Daily assembly target in meters

  // ─── Server Time Sync ────────────────────────────────────────────────────
  // Offset (ms) between server UTC time and the client's Date.now().
  // All shift boundary calculations use (Date.now() + serverOffset) so
  // operators cannot manipulate their local clock to game the system.
  const [serverOffset, setServerOffset] = useState(0);

  useEffect(() => {
    const sync = async () => {
      try {
        const res = await fetch('/api/server-time');
        const { timestamp } = await res.json();
        setServerOffset(timestamp - Date.now());
      } catch {
        // silently fall back to local time
      }
    };
    sync();
  }, []);

  /** Returns the current moment as understood by the server. */
  const getServerNow = useCallback(
    () => new Date(Date.now() + serverOffset),
    [serverOffset]
  );

  /** Format a Date as YYYY-MM-DD in the Ljubljana (Europe/Ljubljana) timezone. */
  const toSlDate = useCallback(
    (d: Date) =>
      new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Ljubljana',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(d),
    []
  );

  /** Format a Date as HH:MM:SS in the Ljubljana timezone. */
  const toSlTime = useCallback(
    (d: Date) =>
      new Intl.DateTimeFormat('sl-SI', {
        timeZone: 'Europe/Ljubljana',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(d),
    []
  );

  // Today's date string in Ljubljana timezone (server-corrected)
  const today = useMemo(() => toSlDate(getServerNow()), [toSlDate, getServerNow]);

  // ─── Operator / Shift Context ─────────────────────────────────────────────
  const currentOperator = useMemo(() => {
    return operators.find((op) => op.id === currentUser?.id);
  }, [operators, currentUser]);

  const lockedShift = currentOperator?.shift;

  // Live server-corrected clock (updates every second)
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [localAttendance, setLocalAttendance] = useState<any[]>([]);

  useEffect(() => {
    setCurrentTime(getServerNow());
    const interval = setInterval(() => setCurrentTime(getServerNow()), 1000);
    return () => clearInterval(interval);
  }, [getServerNow]);

  // Derive shift status from server-corrected time
  const shiftInfo = useMemo(() => {
    if (!currentTime || !lockedShift) return null;
    return getShiftDetails(lockedShift, currentTime);
  }, [currentTime, lockedShift]);

  const targetShiftDate = shiftInfo?.shiftDateStr || today;

  // Yesterday in Ljubljana timezone (for cross-midnight fetch range)
  const yesterdayStr = useMemo(
    () => toSlDate(new Date(getServerNow().getTime() - 24 * 60 * 60 * 1000)),
    [toSlDate, getServerNow]
  );

  useEffect(() => {
    const loadDashboardData = async () => {
      fetchOperators();
      try {
        const res = await fetch(`/api/attendance?startDate=${yesterdayStr}&endDate=${today}`);
        const data = await res.json();
        if (data.success) {
          setLocalAttendance(data.attendance);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard attendance:', err);
      }
    };
    if (currentUser) {
      loadDashboardData();
    }
  }, [currentUser, today, yesterdayStr, fetchOperators]);

  // Merge local range attendance with store attendance (prefer store)
  const mergedAttendance = useMemo(() => {
    const map = new Map<string, any>();
    localAttendance.forEach(a => map.set(`${a.operatorId}_${a.date}`, a));
    attendance.forEach(a => map.set(`${a.operatorId}_${a.date}`, a));
    return Array.from(map.values());
  }, [attendance, localAttendance]);

  const myRecord = useMemo(() => {
    return mergedAttendance.find((a) => a.date === targetShiftDate && a.operatorId === currentUser?.id);
  }, [mergedAttendance, targetShiftDate, currentUser]);

  const isCheckedIn = !!myRecord;
  const myCheckInTime = myRecord?.checkInTime;

  const [metersInput, setMetersInput] = useState<number | ''>('');
  const [isSavingMeters, setIsSavingMeters] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [countdown, setCountdown] = useState('');

  // Handle countdown timer for upcoming shifts
  useEffect(() => {
    if (shiftInfo?.status === 'Upcoming' && shiftInfo.start) {
      const updateCountdown = () => {
        const now = new Date();
        const diff = shiftInfo.start.getTime() - now.getTime();
        if (diff <= 0) {
          setCountdown('00:00:00');
          return;
        }
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        const pad = (num: number) => String(num).padStart(2, '0');
        setCountdown(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      };
      updateCountdown();
      const timer = setInterval(updateCountdown, 1000);
      return () => clearInterval(timer);
    }
  }, [shiftInfo]);

  // Automatic Check-In effect during active shifts
  useEffect(() => {
    if (
      currentUser?.role === 'operator' &&
      shiftInfo?.status === 'Active' &&
      !myRecord &&
      !isCheckingIn &&
      lockedShift
    ) {
      const autoCheckIn = async () => {
        setIsCheckingIn(true);
        // Record arrival time in Ljubljana timezone using server-corrected time
        const checkInTimeStr = toSlTime(getServerNow());
        try {
          await saveAttendance([{
            date: targetShiftDate,
            operatorId: currentUser.id,
            status: 'Present',
            metersAssembled: 0,
            shift: lockedShift,
            checkInTime: checkInTimeStr,
            submitted: false
          }]);
          toast.success(`Automatically checked in for ${lockedShift} shift!`, { id: 'auto-checkin' });
        } catch (error) {
          console.error('Auto check-in failed:', error);
        } finally {
          setIsCheckingIn(false);
        }
      };
      autoCheckIn();
    }
  }, [currentUser, shiftInfo, myRecord, isCheckingIn, lockedShift, targetShiftDate, saveAttendance, getServerNow, toSlTime]);

  // Warn operator before leaving/closing tab if they have pending logs
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const needsSubmit = shiftInfo && (shiftInfo.status === 'Active' || shiftInfo.status === 'Ended') && (!myRecord || !myRecord.submitted);
      if (needsSubmit) {
        e.preventDefault();
        e.returnValue = 'You have not submitted your daily shift logs yet. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [shiftInfo, myRecord]);

  useEffect(() => {
    if (myRecord) {
      setMetersInput(myRecord.metersAssembled ?? 0);
    }
  }, [myRecord]);

  const handleSaveMeters = async (e: React.FormEvent, finalize: boolean) => {
    e.preventDefault();
    if (!lockedShift) return;
    const metersValue = Number(metersInput) || 0;
    setIsSavingMeters(true);
    try {
      // Fallback check-in time uses server time in Ljubljana timezone
      const checkInTimeStr = myCheckInTime || toSlTime(getServerNow());
      await saveAttendance([{
        date: targetShiftDate,
        operatorId: currentUser!.id,
        status: 'Present',
        metersAssembled: metersValue,
        shift: lockedShift,
        checkInTime: checkInTimeStr,
        submitted: finalize
      }]);
      toast.success(finalize ? 'Daily logs submitted & shift finalized!' : 'Meters progress saved as draft!');
    } catch (error) {
      toast.error('Failed to save meters.');
    } finally {
      setIsSavingMeters(false);
    }
  };

  if (!currentUser) return null;

  // Filter attendance based on role
  const todaysAttendance = useMemo(() => {
    return currentUser.role === 'admin' 
      ? mergedAttendance.filter((a) => a.date === today)
      : mergedAttendance.filter((a) => a.date === targetShiftDate && a.operatorId === currentUser.id);
  }, [mergedAttendance, today, targetShiftDate, currentUser]);

  const presentToday = todaysAttendance.filter((a) => a.status === 'Present').length;
  const metersAssembledToday = todaysAttendance.reduce((acc, curr) => acc + (curr.metersAssembled || 0), 0);

  const stats = [
    { 
      name: currentUser.role === 'admin' ? 'Total Active Operators' : 'My Onboarding Status', 
      value: currentUser.role === 'admin' ? operators.filter(o => o.status === 'Active').length : 'Verified', 
      icon: Users, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50' 
    },
    { 
      name: currentUser.role === 'admin' ? 'Present Today' : 'Days Worked (All Time)', 
      value: currentUser.role === 'admin' 
        ? presentToday 
        : attendance.filter(a => a.operatorId === currentUser.id && a.status === 'Present').length, 
      icon: UserCheck, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50' 
    },
    { 
      name: currentUser.role === 'admin' ? 'Meters Assembled Today' : 'My Meters Today', 
      value: (currentUser.role === 'admin' ? metersAssembledToday : (todaysAttendance.find(a => a.operatorId === currentUser.id)?.metersAssembled || 0)).toLocaleString() + ' m', 
      icon: Zap, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50' 
    },
  ];

  // Operator dynamic statistics
  const operatorMetersToday = todaysAttendance.find(a => a.operatorId === currentUser.id)?.metersAssembled || 0;
  const progressPercent = Math.min(100, Math.round((operatorMetersToday / DAILY_TARGET) * 100));
  const isTargetAchieved = operatorMetersToday >= DAILY_TARGET;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Title */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">System Dashboard</h1>
          <p className="mt-2 text-sm text-neutral-500">
            {currentUser.role === 'admin' 
              ? "Oversee operational production logs, weekly payouts, and workforce attendance." 
              : "Track your personal daily rack assembly progress and payouts."}
          </p>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm flex items-center gap-5"
          >
            <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl shrink-0", stat.bg)}>
              <stat.icon className={cn("h-6 w-6", stat.color)} />
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">{stat.name}</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* WORK TARGET TRACKING SYSTEM */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Operator Target & Check-in Portal */}
          {currentUser.role === 'operator' && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-6"
            >
              {!lockedShift ? (
                /* STATE 0: SHIFT NOT ASSIGNED */
                <div className="text-center py-8 space-y-4">
                  <div className="mx-auto h-16 w-16 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center justify-center shadow-inner">
                    <Lock className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-neutral-900">Shift Not Assigned</h3>
                    <p className="text-sm text-neutral-500 max-w-sm mx-auto">
                      Please select and lock your shift in your profile first to access the dashboard portal.
                    </p>
                  </div>
                  <Link 
                    href="/profile" 
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    Go to Profile
                  </Link>
                </div>
              ) : shiftInfo?.status === 'Upcoming' ? (
                /* STATE 1: UPCOMING SHIFT COUNTDOWN */
                <div className="text-center py-6 space-y-5">
                  <div className="mx-auto h-16 w-16 bg-blue-50 border border-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                    <Clock className="h-8 w-8 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-extrabold text-neutral-900">Upcoming Shift</h3>
                    <p className="text-sm text-neutral-500">
                      Your assigned shift is <span className="font-bold text-neutral-800">{lockedShift}</span>.
                    </p>
                  </div>
                  
                  <div className="bg-neutral-50 border border-neutral-200/60 rounded-xl p-4 max-w-sm mx-auto flex items-center justify-between text-left text-xs text-neutral-600">
                    <div className="space-y-1">
                      <span className="block font-bold text-neutral-800 uppercase tracking-wider text-[10px]">Shift Hours</span>
                      <span className="text-sm font-mono font-bold text-neutral-950">
                        {lockedShift === 'Day' ? '09:00 - 17:00' : lockedShift === 'Evening' ? '17:00 - 01:00' : '01:00 - 09:00'}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-100/50">
                      Starts in {countdown || '00:00:00'}
                    </span>
                  </div>
                  
                  <p className="text-[11px] text-neutral-400">
                    Your check-in will be logged automatically once your shift starts.
                  </p>
                </div>
              ) : shiftInfo?.status === 'Active' ? (
                /* STATE 2: ACTIVE SHIFT */
                !isCheckedIn ? (
                  <div className="text-center py-8 space-y-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                    <p className="text-sm text-neutral-500 font-medium">Checking in automatically...</p>
                  </div>
                ) : myRecord?.submitted ? (
                  /* SUBSTATE: ACTIVE SHIFT FINALIZED */
                  <div className="text-center py-6 space-y-4">
                    <div className="mx-auto h-16 w-16 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-neutral-900">Shift Logs Submitted</h3>
                      <p className="text-sm text-neutral-500 max-w-sm mx-auto">
                        You have finalized your work log for today. Thank you for your work!
                      </p>
                    </div>
                    <div className="bg-neutral-50 border border-neutral-100 rounded-xl p-4 max-w-sm mx-auto space-y-2 text-left text-xs">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Shift:</span>
                        <span className="font-semibold text-neutral-800">{lockedShift}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Checked In:</span>
                        <span className="font-mono font-semibold text-neutral-800">{myCheckInTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Meters Assembled:</span>
                        <span className="font-bold text-neutral-950">{operatorMetersToday} m</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* SUBSTATE: ACTIVE SHIFT EDITING */
                  <div className="space-y-6">
                    <div className="sm:flex sm:items-center sm:justify-between border-b border-neutral-100 pb-4">
                      <div>
                        <h3 className="text-lg font-bold text-neutral-900">Daily Production Target</h3>
                        <div className="text-[11px] font-medium text-neutral-500 flex flex-wrap items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active Shift
                          </span>
                          <span>•</span>
                          <span>Shift: <strong className="text-neutral-700">{lockedShift}</strong> ({lockedShift === 'Day' ? '09:00-17:00' : lockedShift === 'Evening' ? '17:00-01:00' : '01:00-09:00'})</span>
                          <span>•</span>
                          <span>Arrival: <strong className="text-neutral-700 font-mono">{myCheckInTime}</strong></span>
                        </div>
                      </div>
                      <span className={cn(
                        "mt-2 sm:mt-0 inline-flex px-2.5 py-1 rounded-full text-xs font-bold",
                        isTargetAchieved ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      )}>
                        {isTargetAchieved ? 'Target Achieved' : 'In Progress'}
                      </span>
                    </div>

                    <form className="bg-neutral-50 border border-neutral-200/60 rounded-2xl p-5 space-y-4">
                      <div className="flex flex-col gap-4">
                        <div>
                          <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2">Update Assembled Meters</label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              required
                              value={metersInput}
                              onChange={(e) => setMetersInput(e.target.value === '' ? '' : Number(e.target.value))}
                              placeholder="Enter total meters assembled..."
                              className="block w-full pl-4 pr-16 py-3 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white text-neutral-900 placeholder-neutral-400 text-sm font-semibold transition-all"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-neutral-400 font-bold text-xs">
                              meters
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                          <button
                            type="button"
                            onClick={(e) => handleSaveMeters(e, false)}
                            disabled={isSavingMeters}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 border border-neutral-300 bg-white hover:bg-neutral-50 disabled:bg-neutral-100 text-neutral-700 text-sm font-bold rounded-xl transition-all shadow-sm active:scale-98"
                          >
                            Save Progress (Draft)
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleSaveMeters(e, true)}
                            disabled={isSavingMeters}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-300 text-white text-sm font-bold rounded-xl transition-all shadow-md active:scale-98"
                          >
                            Submit & Finalize Shift
                          </button>
                        </div>
                      </div>
                    </form>

                    {/* Graphical Progress Bar */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-end text-sm">
                        <span className="font-medium text-neutral-600">Meters Fixed in Racks</span>
                        <span className="font-bold text-neutral-900 text-lg">
                          {operatorMetersToday.toLocaleString()} <span className="text-xs font-normal text-neutral-400">/ {DAILY_TARGET.toLocaleString()} m</span>
                        </span>
                      </div>
                      
                      <div className="w-full bg-neutral-100 rounded-full h-3.5 overflow-hidden border border-neutral-200/50">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercent}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className={cn(
                            "h-full rounded-full transition-all",
                            isTargetAchieved ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-gradient-to-r from-amber-500 to-orange-500"
                          )}
                        />
                      </div>

                      <div className="flex justify-between text-xs text-neutral-400 font-semibold mt-1">
                        <span>0%</span>
                        <span>{progressPercent}% Complete</span>
                        <span>100%</span>
                      </div>
                    </div>

                    <div className={cn(
                      "p-4 rounded-xl border flex gap-3 text-sm leading-relaxed",
                      isTargetAchieved 
                        ? "bg-emerald-50/50 border-emerald-100 text-emerald-850" 
                        : "bg-amber-50/50 border-amber-100 text-amber-850"
                    )}>
                      {isTargetAchieved ? (
                        <>
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">Fantastic Work!</span> You have met your daily target of assembling 3,571 meters. Please submit and finalize your logs at the end of the shift.
                          </div>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">Daily Quota Info:</span> You need to assemble an additional <span className="font-bold text-neutral-950">{(DAILY_TARGET - operatorMetersToday).toLocaleString()} meters</span> to meet your daily target.
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )
              ) : (
                /* STATE 3: SHIFT ENDED */
                !isCheckedIn ? (
                  <div className="text-center py-6 space-y-4">
                    <div className="mx-auto h-16 w-16 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center justify-center shadow-inner">
                      <AlertCircle className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-neutral-900">Shift Ended</h3>
                      <p className="text-sm text-neutral-500 max-w-sm mx-auto">
                        Your shift for {targetShiftDate} has ended. You did not check in during this shift.
                      </p>
                    </div>
                  </div>
                ) : myRecord?.submitted ? (
                  /* SUBSTATE: SHIFT ENDED & SUBMITTED */
                  <div className="text-center py-6 space-y-4">
                    <div className="mx-auto h-16 w-16 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-neutral-900">Shift Logs Finalized</h3>
                      <p className="text-sm text-neutral-500 max-w-sm mx-auto">
                        Your daily logs have been submitted and finalized for this shift.
                      </p>
                    </div>
                    <div className="bg-neutral-50 border border-neutral-100 rounded-xl p-4 max-w-sm mx-auto space-y-2 text-left text-xs">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Shift:</span>
                        <span className="font-semibold text-neutral-800">{lockedShift}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Date:</span>
                        <span className="font-mono font-semibold text-neutral-800">{targetShiftDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Meters Assembled:</span>
                        <span className="font-bold text-neutral-950">{operatorMetersToday} m</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* SUBSTATE: SHIFT ENDED & NOT SUBMITTED (LOCK SCREEN) */
                  <div className="space-y-6 py-4">
                    <div className="text-center space-y-3">
                      <div className="mx-auto h-14 w-14 bg-amber-50 border border-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner">
                        <AlertCircle className="h-7 w-7 animate-bounce" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-black text-neutral-900 tracking-tight">Shift Action Required</h3>
                        <p className="text-sm text-neutral-500 max-w-md mx-auto">
                          Your shift has ended. Please submit your final total meters work count to complete your attendance log.
                        </p>
                      </div>
                    </div>

                    <form onSubmit={(e) => handleSaveMeters(e, true)} className="bg-amber-50/30 border border-amber-100/80 rounded-2xl p-5 space-y-4 max-w-md mx-auto">
                      <div>
                        <label className="block text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">Final Meters Assembled</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            required
                            value={metersInput}
                            onChange={(e) => setMetersInput(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="Enter total meters assembled..."
                            className="block w-full pl-4 pr-16 py-3 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white text-neutral-900 placeholder-neutral-400 text-sm font-semibold transition-all"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-neutral-400 font-bold text-xs">
                            meters
                          </div>
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={isSavingMeters}
                        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 text-white text-sm font-bold rounded-xl transition-all shadow-md active:scale-98"
                      >
                        {isSavingMeters ? 'Submitting...' : 'Submit Daily Logs & Finalize'}
                      </button>
                    </form>
                  </div>
                )
              )}
            </motion.div>
          )}

          {/* Admin Workforce target overview */}
          {currentUser.role === 'admin' && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-6"
            >
              <div>
                <h3 className="text-lg font-bold text-neutral-900">Workforce target progress</h3>
                <p className="text-xs text-neutral-500 mt-1">Daily quota: 3,571 meters fixed in racks per operator.</p>
              </div>

              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                {operators.filter(op => op.status === 'Active').map((op) => {
                  const record = todaysAttendance.find(a => a.operatorId === op.id);
                  const status = record?.status || 'Absent';
                  const shift = record?.shift || 'Morning';
                  const meters = record?.metersAssembled || 0;
                  const percent = Math.min(100, Math.round((meters / DAILY_TARGET) * 100));
                  const achieved = meters >= DAILY_TARGET;
                  const isPresent = status === 'Present';
                  const isLeave = status === 'Leave';

                  return (
                    <div key={op.id} className="p-4 border border-neutral-100 rounded-xl bg-neutral-50/50 hover:bg-neutral-50 transition-colors space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <img
                            className="h-9 w-9 rounded-full object-cover"
                            src={`https://ui-avatars.com/api/?name=${op.name.replace(' ', '+')}&background=random`}
                            alt=""
                          />
                          <div>
                            <span className="text-sm font-bold text-neutral-900 block">{op.name}</span>
                            <div className="text-[10px] text-neutral-400 font-medium flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                              <span className="font-mono bg-neutral-100 px-1 rounded border border-neutral-200/55">#{op.id}</span>
                              <span>•</span>
                              <span>{op.email}</span>
                              <span>•</span>
                              <span>{op.phone}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <div className="flex items-center gap-1.5">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                              status === 'Present' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              status === 'Absent' ? "bg-red-50 text-red-700 border-red-200" :
                              "bg-amber-50 text-amber-700 border-amber-200"
                            )}>
                              {status}
                            </span>
                            {isPresent && (
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                                shift === 'Day' ? "bg-blue-50 text-blue-700 border-blue-200" :
                                shift === 'Evening' ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                                "bg-purple-50 text-purple-700 border-purple-200"
                              )}>
                                {shift === 'Day' ? '🌅 Day' : shift === 'Evening' ? '🌇 Evening' : '🌃 Night'}
                              </span>
                            )}
                          </div>
                          {isPresent && (
                            <div className="flex flex-col items-end gap-1">
                              {record?.checkInTime && (
                                <span className="text-[10px] font-mono text-neutral-500 bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 rounded leading-none shrink-0 font-medium">
                                  Arrived: {record.checkInTime}
                                </span>
                              )}
                              <span className={cn(
                                "text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded",
                                achieved ? "bg-emerald-100 text-emerald-850" : "bg-amber-100 text-amber-850"
                              )}>
                                {achieved ? 'Quota Met' : 'In Progress'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {isPresent ? (
                        <div className="space-y-1 pl-12">
                          <div className="flex justify-between text-[11px] text-neutral-500 font-medium">
                            <span>{meters.toLocaleString()} meters fixed</span>
                            <span>{percent}%</span>
                          </div>
                          <div className="w-full bg-neutral-200/50 rounded-full h-2.5 overflow-hidden">
                            <div 
                              className={cn("h-full rounded-full transition-all", achieved ? "bg-emerald-500" : "bg-amber-500")}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="text-[11px] text-neutral-400 italic pl-12">
                          {isLeave ? 'Approved leave' : 'Absent today'}
                        </div>
                      )}
                    </div>
                  );
                })}

                {operators.filter(op => op.status === 'Active').length === 0 && (
                  <div className="text-center py-10 text-neutral-400 text-sm">
                    No active operators registered to track.
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </div>

        {/* RECENT ACTIVITY TIMELINE */}
        <div className="lg:col-span-5">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-neutral-200 bg-white shadow-sm h-full"
          >
            <div className="border-b border-neutral-200 px-6 py-5">
              <h3 className="text-lg font-bold leading-6 text-neutral-900 flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                Recent Work Log
              </h3>
            </div>
            <div className="px-6 py-6">
              {todaysAttendance.length > 0 ? (
                <div className="flow-root">
                  <ul className="-mb-8">
                    {todaysAttendance.slice(0, 5).map((record, recordIdx) => {
                      const operator = operators.find((o) => o.id === record.operatorId);
                      return (
                        <li key={record.id || recordIdx}>
                          <div className="relative pb-8">
                            {recordIdx !== todaysAttendance.length - 1 ? (
                              <span className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-neutral-100" aria-hidden="true" />
                            ) : null}
                            <div className="relative flex items-start space-x-3">
                              <div className="relative">
                                <img
                                  className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-200 ring-8 ring-white object-cover"
                                  src={`https://ui-avatars.com/api/?name=${operator?.name?.replace(' ', '+')}&background=random`}
                                  alt=""
                                />
                              </div>
                              <div className="min-w-0 flex-1 py-1.5">
                                <div className="text-xs text-neutral-500 leading-normal">
                                  <span className="font-bold text-neutral-900 mr-1">
                                    {currentUser.role === 'admin' ? operator?.name : 'You'}
                                  </span>
                                  {currentUser.role === 'admin' ? 'marked status as' : 'were marked'}{' '}
                                  <span className={cn(
                                    "font-semibold mx-1 px-1.5 py-0.5 rounded-md text-[10px]",
                                    record.status === 'Present' ? "bg-emerald-50 text-emerald-700" :
                                    record.status === 'Absent' ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                                  )}>
                                    {record.status}
                                  </span>
                                  {record.status === 'Present' && (
                                    <span>
                                      on <span className="font-semibold text-neutral-700">{record.shift || 'Day'} Shift</span> (arrived at <span className="font-mono font-semibold text-neutral-700">{record.checkInTime || '—'}</span>) and fixed{' '}
                                      <span className="font-bold text-neutral-800">{record.metersAssembled.toLocaleString()}</span> meters.
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Activity className="mx-auto h-12 w-12 text-neutral-300 mb-2" />
                  <h3 className="text-sm font-semibold text-neutral-900">No logs for today</h3>
                  <p className="mt-1 text-xs text-neutral-500">
                    Attendance and assembly metrics will appear here once submitted.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}

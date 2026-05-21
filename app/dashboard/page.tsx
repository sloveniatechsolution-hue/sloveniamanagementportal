'use client';

import { useStore } from '@/lib/store';
import { Users, UserCheck, Zap, Activity, CheckCircle2, AlertCircle, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function Dashboard() {
  const { operators, attendance, currentUser, fetchOperators, fetchAttendance } = useStore();

  const today = new Date().toISOString().split('T')[0];
  const DAILY_TARGET = 3571; // Daily assembly target in meters

  useEffect(() => {
    if (currentUser) {
      fetchOperators();
      fetchAttendance(today);
    }
  }, [currentUser, fetchOperators, fetchAttendance, today]);

  if (!currentUser) return null;
  
  // Filter attendance based on role
  const todaysAttendance = useMemo(() => {
    return currentUser.role === 'admin' 
      ? attendance.filter((a) => a.date === today)
      : attendance.filter((a) => a.date === today && a.operatorId === currentUser.id);
  }, [attendance, today, currentUser]);

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
      value: metersAssembledToday.toLocaleString() + ' m', 
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
          
          {/* Operator Target Box */}
          {currentUser.role === 'operator' && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">Daily Production Target</h3>
                  <p className="text-xs text-neutral-500 mt-1">Rack Assembly quotas are reset daily at midnight.</p>
                </div>
                <span className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-bold",
                  isTargetAchieved ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                )}>
                  {isTargetAchieved ? 'Target Achieved' : 'In Progress'}
                </span>
              </div>

              {/* Graphical Circular Meter or Progress Bar */}
              <div className="space-y-3">
                <div className="flex justify-between items-end text-sm">
                  <span className="font-medium text-neutral-600">Meters Fixed in Racks</span>
                  <span className="font-bold text-neutral-900 text-lg">
                    {operatorMetersToday.toLocaleString()} <span className="text-xs font-normal text-neutral-400">/ {DAILY_TARGET.toLocaleString()} m</span>
                  </span>
                </div>
                
                {/* Progress bar line */}
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

              {/* Status card prompt */}
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
                      <span className="font-bold">Fantastic Work!</span> You have met your daily target of assembling 3,571 meters into racks. Your performance metrics have been successfully logged for weekly compensation payouts.
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Daily Quota Warning:</span> You are currently at {operatorMetersToday.toLocaleString()} meters. You need to assemble an additional <span className="font-bold text-neutral-950">{(DAILY_TARGET - operatorMetersToday).toLocaleString()} meters</span> today to meet your daily target.
                    </div>
                  </>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <Link href="/attendance" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline">
                  Log Assembled Meters <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
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

              <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                {operators.filter(op => op.status === 'Active').map((op) => {
                  const record = todaysAttendance.find(a => a.operatorId === op.id);
                  const meters = record?.metersAssembled || 0;
                  const percent = Math.min(100, Math.round((meters / DAILY_TARGET) * 100));
                  const achieved = meters >= DAILY_TARGET;
                  const isPresent = record?.status === 'Present';

                  return (
                    <div key={op.id} className="p-4 border border-neutral-100 rounded-xl bg-neutral-50/50 hover:bg-neutral-50 transition-colors space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <img
                            className="h-8 w-8 rounded-full object-cover"
                            src={`https://ui-avatars.com/api/?name=${op.name.replace(' ', '+')}&background=random`}
                            alt=""
                          />
                          <div>
                            <span className="text-sm font-bold text-neutral-900 block">{op.name}</span>
                            <span className="text-[10px] text-neutral-400 font-mono">#{op.id}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold",
                            !isPresent ? "bg-neutral-150 text-neutral-500" :
                            achieved ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                          )}>
                            {!isPresent ? 'Absent' : achieved ? 'Target Met' : 'In Progress'}
                          </span>
                        </div>
                      </div>

                      {isPresent && (
                        <div className="space-y-1">
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
                                  {currentUser.role === 'admin' ? 'marked status as' : 'were marked'} 
                                  <span className={cn(
                                    "font-semibold mx-1 px-1.5 py-0.5 rounded-md text-[10px]",
                                    record.status === 'Present' ? "bg-emerald-50 text-emerald-700" :
                                    record.status === 'Absent' ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                                  )}>
                                    {record.status}
                                  </span>
                                  {record.status === 'Present' && (
                                    <span>
                                      and fixed <span className="font-bold text-neutral-800">{record.metersAssembled.toLocaleString()}</span> meters.
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

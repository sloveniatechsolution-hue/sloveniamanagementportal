'use client';

import { useStore } from '@/lib/store';
import { Users, UserCheck, Zap, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { operators, attendance, currentUser } = useStore();

  if (!currentUser) return null;

  const today = new Date().toISOString().split('T')[0];
  
  // Filter attendance based on role
  const todaysAttendance = currentUser.role === 'admin' 
    ? attendance.filter((a) => a.date === today)
    : attendance.filter((a) => a.date === today && a.operatorId === currentUser.id);

  const presentToday = todaysAttendance.filter((a) => a.status === 'Present').length;
  const metersAssembledToday = todaysAttendance.reduce((acc, curr) => acc + (curr.metersAssembled || 0), 0);

  const stats = [
    { 
      name: currentUser.role === 'admin' ? 'Total Operators' : 'My Status', 
      value: currentUser.role === 'admin' ? operators.length : (todaysAttendance[0]?.status || 'Not Marked'), 
      icon: Users, 
      color: 'text-blue-600 ', 
      bg: 'bg-blue-100 ' 
    },
    { 
      name: currentUser.role === 'admin' ? 'Present Today' : 'Days Present (All Time)', 
      value: currentUser.role === 'admin' 
        ? presentToday 
        : attendance.filter(a => a.operatorId === currentUser.id && a.status === 'Present').length, 
      icon: UserCheck, 
      color: 'text-emerald-600 ', 
      bg: 'bg-emerald-100 ' 
    },
    { 
      name: currentUser.role === 'admin' ? 'Meters Assembled (Today)' : 'My Meters (Today)', 
      value: metersAssembledToday, 
      icon: Zap, 
      color: 'text-amber-600 ', 
      bg: 'bg-amber-100 ' 
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 ">Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-500 ">
            {currentUser.role === 'admin' ? "Overview of operator performance and attendance for today." : "Overview of your personal performance and attendance."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm  "
          >
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-500 ">{stat.name}</p>
                <p className="text-3xl font-bold text-neutral-900 ">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 rounded-2xl border border-neutral-200 bg-white shadow-sm  "
      >
        <div className="border-b border-neutral-200 px-6 py-5 ">
          <h3 className="text-lg font-medium leading-6 text-neutral-900  flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            Recent Activity
          </h3>
        </div>
        <div className="px-6 py-6">
          {todaysAttendance.length > 0 ? (
            <div className="flow-root">
              <ul className="-mb-8">
                {todaysAttendance.slice(0, 5).map((record, recordIdx) => {
                  const operator = operators.find((o) => o.id === record.operatorId);
                  return (
                    <li key={record.id}>
                      <div className="relative pb-8">
                        {recordIdx !== todaysAttendance.length - 1 ? (
                          <span className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-neutral-200 " aria-hidden="true" />
                        ) : null}
                        <div className="relative flex items-start space-x-3">
                          <div className="relative">
                            <img
                              className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-200 ring-8 ring-white  object-cover"
                              src={`https://ui-avatars.com/api/?name=${operator?.name?.replace(' ', '+')}&background=random`}
                              alt=""
                            />
                          </div>
                          <div className="min-w-0 flex-1 py-1.5">
                            <div className="text-sm text-neutral-500 ">
                              <span className="font-medium text-neutral-900  mr-1">
                                {currentUser.role === 'admin' ? operator?.name : 'You'}
                              </span>
                              {currentUser.role === 'admin' ? ' marked as ' : ' were marked as '} 
                              {record.status} 
                              {record.status === 'Present' && ` and assembled ${record.metersAssembled} meters.`}
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
              <Activity className="mx-auto h-12 w-12 text-neutral-300 " />
              <h3 className="mt-2 text-sm font-semibold text-neutral-900 ">No activity yet</h3>
              <p className="mt-1 text-sm text-neutral-500 ">
                Attendance and production data for today will appear here.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

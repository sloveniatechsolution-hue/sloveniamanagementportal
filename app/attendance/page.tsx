'use client';

import { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Save, Calendar as CalendarIcon, User, Zap } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function AttendancePage() {
  const { operators, attendance, fetchOperators, fetchAttendance, saveAttendance, currentUser } = useStore();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchOperators();
  }, [fetchOperators]);

  useEffect(() => {
    fetchAttendance(selectedDate);
  }, [selectedDate, fetchAttendance]);

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';

  // Only show active operators for admin, or just the current user for operator
  const visibleOperators = useMemo(() => {
    if (isAdmin) {
      return operators.filter(op => op.status === 'Active');
    } else {
      return operators.filter(op => op.id === currentUser.id);
    }
  }, [operators, isAdmin, currentUser.id]);

  const todaysRecords = useMemo(() => {
    return attendance.filter((a) => a.date === selectedDate);
  }, [attendance, selectedDate]);

  const [formData, setFormData] = useState<Record<string, { status: 'Present' | 'Absent' | 'Leave'; metersAssembled: number; shift: 'Day' | 'Evening' | 'Night' }>>({});

  // Initialize form data when date changes or records load
  useEffect(() => {
    const initialData: Record<string, { status: 'Present' | 'Absent' | 'Leave'; metersAssembled: number; shift: 'Day' | 'Evening' | 'Night' }> = {};
    visibleOperators.forEach(op => {
      const record = todaysRecords.find(r => r.operatorId === op.id);
      if (record) {
        initialData[op.id] = { 
          status: record.status, 
          metersAssembled: record.metersAssembled,
          shift: record.shift || op.shift || 'Day'
        };
      } else {
        initialData[op.id] = { status: 'Absent', metersAssembled: 0, shift: op.shift || 'Day' };
      }
    });
    setFormData(initialData);
  }, [visibleOperators, todaysRecords, selectedDate]);

  const handleStatusChange = (operatorId: string, status: 'Present' | 'Absent' | 'Leave') => {
    if (!isAdmin) return; // Operators cannot change their own status
    setFormData(prev => ({
      ...prev,
      [operatorId]: {
        ...prev[operatorId],
        status,
        metersAssembled: status !== 'Present' ? 0 : prev[operatorId]?.metersAssembled || 0
      }
    }));
  };

  const handleMetersChange = (operatorId: string, value: string) => {
    const meters = parseInt(value, 10) || 0;
    setFormData(prev => ({
      ...prev,
      [operatorId]: {
        ...prev[operatorId],
        metersAssembled: meters
      }
    }));
  };

  const handleShiftChange = (operatorId: string, shift: 'Day' | 'Evening' | 'Night') => {
    setFormData(prev => ({
      ...prev,
      [operatorId]: {
        ...prev[operatorId],
        shift
      }
    }));
  };

  const handleSaveAll = async () => {
    const recordsToSave = Object.entries(formData).map(([operatorId, data]) => {
      const op = operators.find(o => o.id === operatorId);
      const existingRecord = todaysRecords.find(r => r.operatorId === operatorId);
      return {
        date: selectedDate,
        operatorId,
        status: data.status,
        metersAssembled: data.metersAssembled,
        shift: op?.shift || data.shift || 'Day',
        checkInTime: existingRecord?.checkInTime,
        submitted: existingRecord?.submitted ?? false
      };
    });

    try {
      await saveAttendance(recordsToSave);
      toast.success(`Successfully saved records for ${format(new Date(selectedDate), 'MMMM d, yyyy')}`);
    } catch (error) {
      toast.error('Failed to save attendance records.');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 ">
            {isAdmin ? 'Attendance & Production' : 'My Work Log'}
          </h1>
          <p className="mt-2 text-sm text-neutral-500 ">
            {isAdmin 
              ? 'Log daily attendance and track electric meters assembled by operators.'
              : 'View your attendance record and work log. Submit meters from the Dashboard.'}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap items-center gap-4">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <CalendarIcon className="h-4 w-4 text-neutral-400" aria-hidden="true" />
            </div>
            <input
              type="date"
              value={selectedDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="block w-full rounded-lg border-0 py-2 pl-10 pr-4 text-neutral-900 ring-1 ring-inset ring-neutral-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            />
          </div>
          {isAdmin && (
            <button
              onClick={handleSaveAll}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all"
            >
              <Save className="h-4 w-4" />
              Save All
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-neutral-200 ">
          <thead className="bg-neutral-50 ">
            <tr>
              <th scope="col" className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-neutral-900 ">Operator</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-neutral-900 ">Status</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-neutral-900 ">Shift</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-neutral-900 ">Arrival Time</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-neutral-900 ">Meters Assembled</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-neutral-900 ">Log Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200  bg-white ">
            {visibleOperators.map((operator, index) => {
              const rowData = formData[operator.id] || { status: 'Absent', metersAssembled: 0 };
              const existingRec = todaysRecords.find(r => r.operatorId === operator.id);
              return (
                <motion.tr 
                  key={operator.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-neutral-50 transition-colors"
                >
                  <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm">
                    <div className="flex items-center gap-3">
                      <img
                        className="h-9 w-9 rounded-full object-cover ring-2 ring-neutral-100 "
                        src={`https://ui-avatars.com/api/?name=${operator.name.replace(' ', '+')}&background=random`}
                        alt=""
                      />
                      <div>
                        <div className="font-semibold text-neutral-900 flex items-center gap-1.5">
                          {operator.name}
                          {!isAdmin && <span className="text-xs text-neutral-500 font-normal">(You)</span>}
                        </div>
                        {isAdmin && (
                          <div className="text-[10px] text-neutral-400 font-medium flex items-center gap-2 mt-0.5">
                            <span className="font-mono bg-neutral-50 px-1 rounded border border-neutral-200/60">#{operator.id}</span>
                            <span>•</span>
                            <span>{operator.email}</span>
                            <span>•</span>
                            <span>{operator.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-neutral-500">
                    <div className="flex gap-2 bg-neutral-100  p-1 rounded-lg w-fit">
                      {(['Present', 'Absent', 'Leave'] as const).map((status) => (
                        <button
                          key={status}
                          disabled={!isAdmin}
                          onClick={() => handleStatusChange(operator.id, status)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                            rowData.status === status
                              ? status === 'Present' ? 'bg-emerald-500 text-white shadow-sm' :
                                status === 'Absent' ? 'bg-red-500 text-white shadow-sm' :
                                'bg-amber-500 text-white shadow-sm'
                              : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200'
                          } ${!isAdmin && rowData.status !== status ? 'opacity-50 cursor-not-allowed' : ''} ${!isAdmin ? 'cursor-default' : ''}`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-neutral-500">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-50 border border-neutral-200">
                      {operator.shift === 'Day' ? '🌅 Day' : operator.shift === 'Evening' ? '🌇 Evening' : operator.shift === 'Night' ? '🌃 Night' : '—'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm font-mono text-neutral-600">
                    {rowData.status === 'Present' && existingRec?.checkInTime ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        {existingRec.checkInTime}
                      </span>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-neutral-500">
                    {isAdmin ? (
                      /* Admin: editable input */
                      <div className="relative flex items-center max-w-[150px]">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Zap className={`h-4 w-4 ${rowData.status === 'Present' ? 'text-amber-500' : 'text-neutral-400'}`} />
                        </div>
                        <input
                          type="number"
                          min="0"
                          disabled={rowData.status !== 'Present'}
                          value={rowData.metersAssembled}
                          onChange={(e) => handleMetersChange(operator.id, e.target.value)}
                          className={`block w-full rounded-lg border-0 py-2 pl-9 pr-3 sm:text-sm sm:leading-6 ring-1 ring-inset focus:ring-2 focus:ring-inset ${
                            rowData.status === 'Present'
                              ? 'text-neutral-900 ring-neutral-300 focus:ring-blue-600'
                              : 'text-neutral-400 bg-neutral-100 ring-transparent cursor-not-allowed'
                          }`}
                        />
                      </div>
                    ) : (
                      /* Operator: read-only display */
                      rowData.status === 'Present' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 border border-amber-200 text-amber-800">
                          <Zap className="h-3.5 w-3.5 text-amber-500" />
                          {rowData.metersAssembled.toLocaleString()} m
                        </span>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-neutral-500">
                    {rowData.status === 'Present' ? (
                      existingRec?.submitted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Finalized
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-250">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Draft
                        </span>
                      )
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                </motion.tr>
              );
            })}
            
            {visibleOperators.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-neutral-500 ">
                  <User className="mx-auto h-12 w-12 text-neutral-300  mb-2" />
                  No operators found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

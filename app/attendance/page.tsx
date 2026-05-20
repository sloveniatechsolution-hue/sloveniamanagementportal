'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Save, Calendar as CalendarIcon, User, Zap } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function AttendancePage() {
  const { operators, attendance, addAttendance, updateAttendance, currentUser } = useStore();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

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

  const [formData, setFormData] = useState<Record<string, { status: 'Present' | 'Absent' | 'Leave'; metersAssembled: number }>>({});

  // Initialize form data when date changes
  useMemo(() => {
    const initialData: Record<string, { status: 'Present' | 'Absent' | 'Leave'; metersAssembled: number }> = {};
    visibleOperators.forEach(op => {
      const record = todaysRecords.find(r => r.operatorId === op.id);
      if (record) {
        initialData[op.id] = { status: record.status, metersAssembled: record.metersAssembled };
      } else {
        initialData[op.id] = { status: 'Absent', metersAssembled: 0 };
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

  const handleSaveAll = () => {
    let savedCount = 0;
    Object.entries(formData).forEach(([operatorId, data]) => {
      const existingRecord = todaysRecords.find(r => r.operatorId === operatorId);
      
      if (existingRecord) {
        // Only update if changed
        if (existingRecord.status !== data.status || existingRecord.metersAssembled !== data.metersAssembled) {
          updateAttendance(existingRecord.id, {
            status: data.status,
            metersAssembled: data.metersAssembled
          });
          savedCount++;
        }
      } else {
        // Add new record
        addAttendance({
          id: Math.random().toString(36).substr(2, 9),
          date: selectedDate,
          operatorId,
          status: data.status,
          metersAssembled: data.metersAssembled
        });
        savedCount++;
      }
    });

    if (savedCount > 0) {
      toast.success(`Successfully saved records for ${format(new Date(selectedDate), 'MMMM d, yyyy')}`);
    } else {
      toast('No changes to save', { icon: 'ℹ️' });
    }
  };

  return (
    <div className="p-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 ">
            {isAdmin ? 'Attendance & Production' : 'My Work Log'}
          </h1>
          <p className="mt-2 text-sm text-neutral-500 ">
            {isAdmin 
              ? 'Log daily attendance and track electric meters assembled by operators.'
              : 'View your attendance status and log the number of meters you assembled today.'}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-4">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <CalendarIcon className="h-4 w-4 text-neutral-400" aria-hidden="true" />
            </div>
            <input
              type="date"
              value={selectedDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="block w-full rounded-lg border-0 py-2 pl-10 pr-4 text-neutral-900 ring-1 ring-inset ring-neutral-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6    :ring-blue-500"
            />
          </div>
          <button
            onClick={handleSaveAll}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all"
          >
            <Save className="h-4 w-4" />
            Save {isAdmin ? 'All' : 'My Data'}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm  ">
        <table className="min-w-full divide-y divide-neutral-200 ">
          <thead className="bg-neutral-50 ">
            <tr>
              <th scope="col" className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-neutral-900 ">Operator</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-neutral-900 ">Status</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-neutral-900 ">Meters Assembled</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200  bg-white ">
            {visibleOperators.map((operator, index) => {
              const rowData = formData[operator.id] || { status: 'Absent', metersAssembled: 0 };
              return (
                <motion.tr 
                  key={operator.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-neutral-50 :bg-neutral-900/50 transition-colors"
                >
                  <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm">
                    <div className="flex items-center gap-3">
                      <img
                        className="h-8 w-8 rounded-full object-cover ring-2 ring-neutral-100 "
                        src={`https://ui-avatars.com/api/?name=${operator.name.replace(' ', '+')}&background=random`}
                        alt=""
                      />
                      <div className="font-medium text-neutral-900 ">
                        {operator.name}
                        {!isAdmin && <span className="ml-2 text-xs text-neutral-500">(You)</span>}
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
                              : 'text-neutral-500 hover:text-neutral-900  :text-white hover:bg-neutral-200 :bg-neutral-800'
                          } ${!isAdmin && rowData.status !== status ? 'opacity-50 cursor-not-allowed' : ''} ${!isAdmin ? 'cursor-default' : ''}`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-neutral-500">
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
                            ? 'text-neutral-900 ring-neutral-300 focus:ring-blue-600   ' 
                            : 'text-neutral-400 bg-neutral-100 ring-transparent   cursor-not-allowed'
                        }`}
                      />
                    </div>
                  </td>
                </motion.tr>
              );
            })}
            
            {visibleOperators.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-sm text-neutral-500 ">
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

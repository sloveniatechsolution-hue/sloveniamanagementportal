'use client';

import { useStore } from '@/lib/store';
import { Settings as SettingsIcon, Trash2, Database } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { operators, attendance } = useStore();

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      localStorage.removeItem('smp-storage');
      window.location.reload();
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 ">Settings</h1>
        <p className="mt-2 text-sm text-neutral-500 ">
          Manage application preferences and data.
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm  ">
          <div className="flex items-center gap-3 mb-4">
            <Database className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-neutral-900 ">Data Management</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100  pb-4">
              <div>
                <p className="text-sm font-medium text-neutral-900 ">Total Storage Used</p>
                <p className="text-sm text-neutral-500 ">
                  {operators.length} operators, {attendance.length} attendance records
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-sm font-medium text-neutral-900 ">Reset Application Data</p>
                <p className="text-sm text-neutral-500 ">
                  Clear all local storage data including operators and attendance history.
                </p>
              </div>
              <button
                onClick={handleClearData}
                className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 shadow-sm hover:bg-red-100   :bg-red-500/20 transition-all"
              >
                <Trash2 className="h-4 w-4" />
                Clear Data
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm  ">
          <div className="flex items-center gap-3 mb-4">
            <SettingsIcon className="h-5 w-5 text-neutral-500" />
            <h2 className="text-lg font-semibold text-neutral-900 ">System Info</h2>
          </div>
          <dl className="divide-y divide-neutral-100  text-sm">
            <div className="flex justify-between py-3">
              <dt className="text-neutral-500 ">Version</dt>
              <dd className="font-medium text-neutral-900 ">1.0.0 (Slovenia Operations)</dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-neutral-500 ">Database</dt>
              <dd className="font-medium text-neutral-900 ">Local Storage (Zustand Persist)</dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-neutral-500 ">Theme</dt>
              <dd className="font-medium text-neutral-900 ">System (Tailwind v4)</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

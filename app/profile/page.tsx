'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Building2, AlertTriangle, Globe, Loader2, Check, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { currentUser } = useStore();
  const router = useRouter();

  // Danger zone purging states
  const [isPurging, setIsPurging] = useState(false);
  const [purgeProgress, setPurgeProgress] = useState(0);
  const [purgeLogs, setPurgeLogs] = useState<string[]>([]);
  const [isPurgeComplete, setIsPurgeComplete] = useState(false);

  if (!currentUser || currentUser.role !== 'operator') {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="bg-white border border-neutral-200 rounded-2xl p-8 text-center shadow-sm">
          <Building2 className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Profile Portal Access Restricted</h1>
          <p className="mt-2 text-neutral-500">Only authorized operators can access this page.</p>
        </div>
      </div>
    );
  }

  const handleInitiatePurge = async () => {
    if (!currentUser) return;
    const operatorId = currentUser.id;

    const confirm1 = confirm("⚠️ WARNING: This will permanently delete your account and wipe all your attendance, banking, ID details, and payroll data from our databases. This action is irreversible. Do you want to proceed?");
    if (!confirm1) return;

    const confirm2 = confirm("🔒 FINAL CONFIRMATION: Are you absolutely sure? You will be immediately logged out, and all logs will be purged from the entire network.");
    if (!confirm2) return;

    setIsPurging(true);
    setPurgeProgress(0);
    setPurgeLogs([]);
    setIsPurgeComplete(false);

    const logsList = [
      { text: "Establishing secure connection to Central Directory...", delay: 600, progress: 10 },
      { text: "Revoking active session tokens and security keys...", delay: 800, progress: 25 },
      { text: "Securely shredding Slovenian National ID details (EMSO)...", delay: 1000, progress: 40 },
      { text: "Shredding international SEPA IBAN & SWIFT routing information...", delay: 900, progress: 55 },
      { text: "Erasing all shift attendance logs & assembled meters history...", delay: 1200, progress: 70 },
      { text: "Executing secure wipe query on MongoDB database...", delay: 1000, progress: 85, action: "apiCall" },
      { text: "Evicting CDN cache, serverless cache, and edge DNS indexes...", delay: 1200, progress: 95 },
      { text: "Clearing local session cookies and browser storage tokens...", delay: 800, progress: 100 },
    ];

    for (let i = 0; i < logsList.length; i++) {
      const step = logsList[i];
      await new Promise(resolve => setTimeout(resolve, step.delay));

      if (step.action === "apiCall") {
        try {
          const response = await fetch(`/api/operators/${operatorId}`, {
            method: 'DELETE'
          });
          const data = await response.json();
          if (!data.success) {
            throw new Error(data.message || "Failed to purge database records.");
          }
        } catch (err: any) {
          setPurgeLogs(prev => [...prev, `[❌] Database Purge Error: ${err.message || 'Connection error'}`]);
          toast.error("Wipe failed due to server connection issues. Please try again.");
          setIsPurging(false);
          return;
        }
      }

      setPurgeLogs(prev => [...prev, `[✓] ${step.text}`]);
      setPurgeProgress(step.progress);
    }

    setIsPurgeComplete(true);
  };

  const handleCompletePurge = () => {
    localStorage.removeItem('smp-storage-v3');
    useStore.setState({ currentUser: null });
    window.location.href = '/';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Operator Profile</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Manage your personal registration data and account status.
        </p>
      </div>

      <div className="bg-white border border-neutral-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        {/* Project Postponed Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4 items-start">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 border border-amber-300 text-amber-650 shrink-0">
            <AlertTriangle className="h-5 w-5 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-amber-900">Slovenia Project Postponed</h3>
            <p className="text-xs text-amber-700 leading-relaxed">
              Shanghai Yisu Information Technology Co., Ltd. has postponed the European operations branch indefinitely. Active onboarding, shift scheduling, and payroll setups are currently suspended.
            </p>
          </div>
        </div>

        {/* User Info Overview */}
        <div className="border-t border-b border-neutral-100 py-4 space-y-3">
          <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Your Registration Profile</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200/50">
              <span className="text-[10px] text-neutral-400 font-bold block uppercase">Operator Name</span>
              <span className="font-semibold text-neutral-800">{currentUser.name}</span>
            </div>
            <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200/50">
              <span className="text-[10px] text-neutral-400 font-bold block uppercase">System Operator ID</span>
              <span className="font-mono font-bold text-neutral-800">#{currentUser.id}</span>
            </div>
          </div>
        </div>

        {/* Delete Data Card */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-red-900 flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-650" />
            GDPR Right-to-be-Forgotten & Data Erasure
          </h3>
          <p className="text-sm text-neutral-600 leading-relaxed">
            You can request the immediate and permanent destruction of your operator profile, national identification records (EMSO), banking details (IBAN/SWIFT), attendance logs, and past work metrics from our databases. 
          </p>
          <div className="bg-red-50/15 border border-red-200 rounded-2xl p-4 text-xs text-red-800 space-y-2 leading-relaxed">
            <p className="font-bold">⚠️ Warning: This action is final and irreversible:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>All records will be deleted in real-time from our MongoDB servers.</li>
              <li>Your login credentials will be invalidated across all caching layers.</li>
              <li>All associated files, session data, and backups will be completely purged.</li>
            </ul>
          </div>
          
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleInitiatePurge}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-red-600 hover:bg-red-750 text-white font-bold rounded-xl transition-all shadow-md shadow-red-500/10 hover:shadow-lg active:scale-95 cursor-pointer text-sm"
            >
              <Trash2 className="h-5 w-5" />
              Permanently Delete My Data & Profile
            </button>
          </div>
        </div>
      </div>

      {/* Global Purge Simulation Console */}
      {isPurging && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-neutral-950 border border-neutral-850 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-neutral-100 flex flex-col gap-6">
            {/* Holographic scanner effect line */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-red-500/70 animate-bounce" />
            
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-neutral-900 pb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-950 border border-red-800 text-red-500 shrink-0">
                <Globe className="h-6 w-6 animate-spin text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-red-500 tracking-wider font-mono">GLOBAL DATA PURGE PROTOCOL</h3>
                <p className="text-xs text-neutral-400 font-mono">Status: ACTIVE - DE-REGISTERING OPERATOR ID #{currentUser?.id}</p>
              </div>
              <div className="text-xs font-mono font-bold text-red-500 bg-red-950/50 border border-red-900 px-2.5 py-1 rounded-md animate-pulse">
                {purgeProgress}%
              </div>
            </div>

            {/* Terminal Console Logs */}
            <div className="flex-1 bg-black border border-neutral-900 rounded-xl p-4 min-h-[220px] font-mono text-[11px] md:text-xs text-emerald-400 space-y-2 overflow-y-auto max-h-[300px]">
              {purgeLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed whitespace-pre-wrap">
                  {log}
                </div>
              ))}
              {!isPurgeComplete && (
                <div className="flex items-center gap-2 text-neutral-400 animate-pulse mt-2">
                  <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                  <span>Purging nodes in progress...</span>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="w-full bg-neutral-900 rounded-full h-3 border border-neutral-850 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-red-650 via-orange-555 to-yellow-555 h-full rounded-full transition-all duration-300"
                  style={{ width: `${purgeProgress}%` }}
                />
              </div>
            </div>

            {/* Completion Screen */}
            {isPurgeComplete ? (
              <div className="bg-red-950/20 border border-red-900/50 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-neutral-100 flex items-center justify-center md:justify-start gap-2">
                    <Check className="h-5 w-5 text-emerald-500" />
                    Purge Completed Successfully
                  </p>
                  <p className="text-xs text-neutral-400 max-w-md leading-normal">
                    Your database records, SEPA credentials, EMSO numbers, and server caches have been fully destroyed. You have been completely forgotten by all system nodes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCompletePurge}
                  className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-750 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Exit and Logout
                </button>
              </div>
            ) : (
              <div className="text-center text-[10px] text-neutral-500 italic uppercase tracking-wider">
                Do not close or refresh this page. Network link actively decommissioning.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

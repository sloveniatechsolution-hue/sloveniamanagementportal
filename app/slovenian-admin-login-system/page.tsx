'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Zap, Lock, Shield, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLoginPage() {
  const { currentUser, setCurrentUser } = useStore();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Hydration fix
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (currentUser) {
      router.push('/dashboard');
    }
  }, [currentUser, router]);

  if (!isClient || currentUser) return null;

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'admin',
          operatorId: 'admin',
          password: password
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCurrentUser(data.user);
        toast.success('Access Granted. Welcome back, Admin!');
        router.push('/dashboard');
      } else {
        toast.error(data.message || 'Invalid admin credentials');
      }
    } catch (err: any) {
      toast.error('An error occurred during admin authentication.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-neutral-900 to-blue-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/20">
            <Shield className="h-8 w-8" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
          Admin Portal
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-400">
          Slovenia Operations Management Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-xl border border-white/10 py-8 px-6 sm:px-10 shadow-2xl rounded-3xl"
        >
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Zap className="h-3 w-3" /> Secure Access Only
            </span>
          </div>

          <form className="space-y-6" onSubmit={handleAdminLogin}>
            <div>
              <label className="block text-sm font-semibold text-neutral-200 mb-1.5">
                Admin Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secure password"
                  className="appearance-none block w-full pl-10 pr-4 py-3 bg-neutral-900/50 border border-white/10 rounded-xl placeholder-neutral-500 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all active:scale-95"
              >
                {isLoggingIn ? 'Verifying...' : 'Unlock Systems'}
              </button>
            </div>
          </form>

          <div className="text-center mt-6 pt-6 border-t border-white/10">
            <Link href="/" className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-400 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

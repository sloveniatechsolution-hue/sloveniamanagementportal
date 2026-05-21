'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Zap, Lock, User, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const { currentUser, setCurrentUser } = useStore();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  
  const loginRole = 'operator';
  const [operatorId, setOperatorId] = useState('');
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: loginRole,
          operatorId: operatorId,
          password: password
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCurrentUser(data.user);
        toast.success(`Welcome, ${data.user.name}!`);
        router.push('/dashboard');
      } else {
        toast.error(data.message || 'Invalid credentials');
      }
    } catch (err: any) {
      toast.error('An error occurred during authentication.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50  flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <Zap className="h-7 w-7" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-neutral-900 ">
          Sign in to SMP
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-500 ">
          Shanghai Yisu Information Technology Co., Ltd.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white  py-8 px-4 shadow-xl shadow-black/5 border border-neutral-100  sm:rounded-2xl sm:px-10"
        >
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-neutral-700 ">
                Operator ID
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="text"
                  required
                  value={operatorId}
                  onChange={(e) => setOperatorId(e.target.value)}
                  placeholder="e.g. OP1001"
                  className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-neutral-200  rounded-xl shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 ">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Operator password"
                  className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-neutral-200  rounded-xl shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors"
              >
                {isLoggingIn ? 'Logging in...' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-neutral-600 ">
              New operator?{' '}
              <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-500">
                Register here
              </Link>
            </p>
          </div>
          
          <div className="text-center mt-6 pt-6 border-t border-neutral-100 ">
            <Link href="/" className="text-sm font-semibold text-neutral-500 hover:text-blue-600 transition-colors">
              &larr; Back to Home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

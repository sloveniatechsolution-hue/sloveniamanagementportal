'use client';

import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Building2, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const { currentUser } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (currentUser) {
      router.push('/dashboard');
    }
  }, [currentUser, router]);

  if (currentUser) return null;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gray-50 pt-16 pb-32">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-8">
            Slovenia Operations <br/><span className="text-blue-600">Management Portal</span>
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-gray-500 mb-10 leading-relaxed">
            The official portal for Shanghai Yisu Information Technology Co., Ltd. Manage attendance, track electric meter assembly, and view your records securely.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/login" className="inline-flex items-center gap-2 px-8 py-4 text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95">
              Access Portal <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/register" className="inline-flex items-center gap-2 px-8 py-4 text-lg font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl shadow-sm transition-all active:scale-95">
              New Operator Registration
            </Link>
          </div>
        </div>
      </div>

      {/* Trust Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Why register on the portal?</h2>
            <p className="mt-4 text-lg text-gray-500">A completely transparent and secure system for our Slovenian workforce.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 mb-6">
                <ShieldCheck className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">End-to-End Encryption</h3>
              <p className="text-gray-500">Your personal details and Slovenian National ID are securely encrypted and used strictly for HR validation.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 mb-6">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Official Platform</h3>
              <p className="text-gray-500">Directly managed by Shanghai Yisu Information Technology Co., Ltd. for our European operations branch.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 mb-6">
                <CheckCircle2 className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Transparent Payroll</h3>
              <p className="text-gray-500">Add your bank details directly in your profile after registration to ensure smooth and timely salary processing.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

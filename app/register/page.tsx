'use client';

import { useState } from 'react';
import { Building2, ShieldCheck, Mail, Phone, Lock, CheckCircle2, Copy, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  const [consent, setConsent] = useState(false);
  const [registeredId, setRegisteredId] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!consent) {
      toast.error('Please accept the data privacy consent to continue.');
      return;
    }

    setIsRegistering(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRegisteredId(data.operator.id);
        toast.success('Profile created successfully!');
      } else {
        toast.error(data.message || 'Registration failed.');
      }
    } catch (error) {
      toast.error('An error occurred during registration.');
    } finally {
      setIsRegistering(false);
    }
  };

  const copyToClipboard = () => {
    if (registeredId) {
      navigator.clipboard.writeText(registeredId);
      toast.success('Operator ID copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-700 flex-col justify-between p-12 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="bg-white p-2 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-700" />
            </div>
            <span className="text-xl font-bold tracking-tight">Shanghai Yisu InfoTech</span>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl font-extrabold mb-6 leading-tight">
              Welcome to the <br/>Slovenia Operations Portal
            </h1>
            <p className="text-blue-100 text-lg max-w-md leading-relaxed">
              Join our team of dedicated operators. Register your profile to securely manage your daily attendance and track your assembly production.
            </p>
          </motion.div>

          <div className="mt-16 space-y-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-2 rounded-full">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <p className="text-blue-50 font-medium">Enterprise-grade data security</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-2 rounded-full">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="text-blue-50 font-medium">Transparent payroll & attendance</p>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 text-sm text-blue-200">
          &copy; {new Date().getFullYear()} Shanghai Yisu Information Technology Co., Ltd.<br/>
          All rights reserved.
        </div>

        {/* Abstract background shapes */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-96 h-96 bg-blue-600 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-96 h-96 bg-blue-800 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
      </div>

      {/* Right Registration Form Panel */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center py-12 px-6 sm:px-12 xl:px-24 bg-white">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md mx-auto"
        >
          {registeredId ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Registration Complete!</h2>
              <p className="text-gray-500 mb-8">
                Your operator profile has been securely created. Please save your Operator ID below for reference, and use your Email Address to log in.
              </p>

              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 mb-8 relative group">
                <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider mb-2">Your Operator ID</p>
                <p className="text-5xl font-black text-blue-600 tracking-tight">{registeredId}</p>
                <button 
                  onClick={copyToClipboard}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Copy to clipboard"
                >
                  <Copy className="h-5 w-5" />
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-8 text-left flex gap-3">
                <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0" />
                <p className="text-sm text-blue-800">
                  Keep this ID safe! Once you log in, please go to <strong>My Profile</strong> to securely verify your Slovenian ID card and bank details for payroll.
                </p>
              </div>

              <button
                onClick={() => router.push('/login')}
                className="w-full flex items-center justify-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-md text-lg font-bold text-white bg-blue-700 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all active:scale-[0.98]"
              >
                Proceed to Login <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <>
              <div className="text-center lg:text-left mb-10">
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Operator Onboarding</h2>
                <p className="mt-2 text-sm text-gray-500">
                  Please enter your details to create your operator profile.
                </p>
              </div>

              <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-800 font-medium leading-relaxed">
                  These details are taken for verification only and are completely end-to-end encrypted. Your privacy is our top priority.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                  <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Jane Doe" className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all sm:text-sm" />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-gray-400" />
                      </div>
                      <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="jane@example.com" className="block w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all sm:text-sm" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Phone className="h-4 w-4 text-gray-400" />
                      </div>
                      <input required type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+386..." className="block w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all sm:text-sm" />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Set Login Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-gray-400" />
                    </div>
                    <input required type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Create a secure password" className="block w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all sm:text-sm" />
                  </div>
                </div>

                <div className="pt-4 pb-2">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="consent"
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                    <label htmlFor="consent" className="ml-3 text-xs text-gray-500 leading-tight">
                      I consent to <strong className="text-gray-700">Shanghai Yisu Information Technology Co., Ltd.</strong> securely processing my information under GDPR guidelines.
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isRegistering}
                  className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-blue-700 hover:bg-blue-600 disabled:bg-neutral-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all active:scale-[0.98]"
                >
                  {isRegistering ? 'Processing...' : 'Complete Registration'}
                </button>
                
                <div className="text-center mt-6">
                  <button type="button" onClick={() => router.push('/login')} className="text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors">
                    &larr; Back to secure login
                  </button>
                </div>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Building2, CreditCard, Save, FileText, CheckCircle2, ShieldCheck, HelpCircle, ArrowRight, Trash2, UploadCloud, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { currentUser, operators } = useStore();
  const router = useRouter();

  const [bankName, setBankName] = useState('');
  const [iban, setIban] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  
  // Agreement Acceptance
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentUser?.role === 'operator') {
      const operator = operators.find(op => op.id === currentUser.id);
      if (operator) {
        if (operator.bankDetails) {
          setBankName(operator.bankDetails.bankName || '');
          setIban(operator.bankDetails.iban || '');
          setSwiftCode(operator.bankDetails.swiftCode || '');
        }
        if (operator.agreementAccepted) {
          setAgreementAccepted(operator.agreementAccepted);
        }
      }
    }
  }, [currentUser, operators]);

  if (!currentUser || currentUser.role !== 'operator') {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="bg-white border border-neutral-200 rounded-2xl p-8 text-center shadow-sm">
          <Building2 className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Profile Portal Access Restricted</h1>
          <p className="mt-2 text-neutral-500">Only authorized operators can submit identity details here.</p>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bankName || !iban || !swiftCode) {
      toast.error('Please fill out all bank credentials including SWIFT/BIC code');
      return;
    }

    // Basic IBAN validation - Slovenia starts with SI56
    if (!iban.startsWith('SI56') || iban.length < 15) {
      toast.error('Please enter a valid Slovenian IBAN format (starts with SI56 followed by numbers).');
      return;
    }

    if (!agreementAccepted) {
      toast.error('You must accept the legal agreement to complete your profile verification.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operatorId: currentUser.id,
          bankDetails: { bankName, iban, swiftCode },
          agreementAccepted
        })
      });
      const data = await response.json();
      if (data.success) {
        // Update local state in Zustand store
        useStore.setState((state) => ({
          operators: state.operators.map((op) => (op.id === currentUser.id ? data.operator : op))
        }));
        toast.success('Banking credentials successfully submitted to HR!');
        router.push('/dashboard');
      } else {
        toast.error(data.message || 'Submission failed. Please review your entries.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('A secure connection error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Payroll & Bank Account Verification</h1>
        <p className="mt-2 text-sm text-neutral-500 max-w-2xl">
          Please verify your banking credentials to receive salary payouts. Payments are processed from India directly to Slovenia in Euros (EUR) via international SEPA wire transfers from our corporate foreign exchange accounts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Interactive Bank Card & Info Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-24 space-y-6">
            
            {/* Interactive Bank Card */}
            <div className="bg-neutral-900/5 p-4 rounded-3xl border border-neutral-200/50 flex flex-col items-center">
              <span className="text-xs text-neutral-400 font-bold uppercase tracking-widest mb-3">Linked Payroll Card Preview</span>
              
              <div 
                className="w-full max-w-[400px] aspect-[1.586/1] bg-gradient-to-tr from-[#1e293b] via-[#334155] to-[#475569] rounded-2xl border border-neutral-700 shadow-2xl relative overflow-hidden flex flex-col justify-between p-6 select-none text-white"
                style={{
                  backgroundImage: `
                    radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
                    radial-gradient(circle at 90% 80%, rgba(16, 185, 129, 0.15) 0%, transparent 50%)
                  `
                }}
              >
                {/* Chip and Contactless indicator */}
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-neutral-400 font-bold tracking-widest uppercase">SALARY DEPOSIT CARD</span>
                    <span className="text-sm font-semibold tracking-wide text-emerald-400 mt-0.5">SEPA Payout Verified</span>
                  </div>
                  {/* Gold Chip */}
                  <div className="w-10 h-7 bg-[#e5c158] border border-amber-600 rounded-md relative shadow-sm flex items-center justify-center overflow-hidden">
                    <div className="w-[1px] h-full bg-amber-700/40 absolute left-4" />
                    <div className="w-[1px] h-full bg-amber-700/40 absolute right-4" />
                    <div className="h-[1px] w-full bg-amber-700/40 absolute top-3.5" />
                    <div className="w-4 h-4 rounded-full border border-amber-700/40 absolute" />
                  </div>
                </div>

                {/* IBAN Display */}
                <div>
                  <span className="text-[9px] text-neutral-400 block tracking-widest uppercase mb-1">IBAN Account Number</span>
                  <span className="text-base font-bold font-mono tracking-widest block text-neutral-100">
                    {iban ? iban.replace(/(.{4})/g, '$1 ').trim() : 'SI56 •••• •••• •••• •••'}
                  </span>
                </div>

                {/* Holder Name & Bank Name */}
                <div className="flex justify-between items-end border-t border-neutral-700/50 pt-3">
                  <div className="flex flex-col max-w-[60%]">
                    <span className="text-[8px] text-neutral-400 uppercase tracking-wider block">Operator / Holder</span>
                    <span className="text-xs font-semibold uppercase tracking-wide truncate">{currentUser.name || 'Jana Vzorec'}</span>
                  </div>
                  <div className="flex flex-col items-end max-w-[40%] text-right">
                    <span className="text-[8px] text-neutral-400 uppercase tracking-wider block">SWIFT/BIC Code</span>
                    <span className="text-xs font-bold font-mono tracking-wider text-neutral-200">{swiftCode || '••••••••'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Flow Explanation */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Direct-in-Euro Transfer Setup
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Our parent company in India processes international payments directly to Slovenia via specialized foreign exchange capital accounts.
              </p>
              <div className="text-xs text-neutral-500 space-y-2 border-t border-neutral-100 pt-3">
                <div className="flex gap-2">
                  <span className="font-bold text-neutral-700">1. No Conversion Fees:</span>
                  <span>Transfers originate from India using our pre-converted Euro (EUR) accounts. You receive your full salary in Euros directly in Slovenia without any currency conversion friction or fees.</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-neutral-700">2. SWIFT/BIC Routing:</span>
                  <span>We require a valid SWIFT/BIC code to successfully route direct payments from our international exchange.</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-neutral-700">3. Speed & Security:</span>
                  <span>Payments are processed with secure end-to-end tracing and arrive directly into your local Slovenian checking account.</span>
                </div>
              </div>
            </div>
            
          </div>
        </div>

        {/* Right Side: Banking Form */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSaveProfile} className="space-y-6">
            
            {/* Bank details input fields */}
            <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="border-b border-neutral-100 p-6 bg-neutral-50">
                <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Bank Account Credentials
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Provide your local Slovenian bank details and international BIC/SWIFT code for direct wire transfers.
                </p>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Bank Name</label>
                    <input 
                      required 
                      type="text" 
                      value={bankName} 
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. Nova Ljubljanska Banka d.d. (NLB)" 
                      className="block w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white text-neutral-900 placeholder-neutral-400 sm:text-sm transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1.5">IBAN Account Number</label>
                    <input 
                      required 
                      type="text" 
                      value={iban} 
                      onChange={(e) => setIban(e.target.value.toUpperCase().replace(/\s/g, ''))}
                      placeholder="SI56 •••• •••• •••• •••" 
                      className="block w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white text-neutral-900 placeholder-neutral-400 sm:text-sm font-mono transition-all"
                    />
                    <p className="text-[10px] text-neutral-400 mt-1">Slovenian IBANs start with 'SI56'.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-neutral-100 pt-5">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1.5">BIC / SWIFT Code</label>
                    <input 
                      required 
                      type="text" 
                      value={swiftCode} 
                      onChange={(e) => setSwiftCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
                      placeholder="e.g. LJUBSI2X" 
                      maxLength={11}
                      className="block w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white text-neutral-900 placeholder-neutral-400 sm:text-sm font-mono transition-all"
                    />
                    <p className="text-[10px] text-neutral-400 mt-1">Required for direct international wire payments from India in Euros.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Legal Terms & Consent */}
            <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="border-b border-neutral-100 p-6 bg-neutral-50">
                <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                  SEPA Payroll Consent & Terms
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Please read and accept the terms of bank data processing.
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-xs text-neutral-600 max-h-40 overflow-y-auto leading-relaxed space-y-3 shadow-inner">
                  <p className="font-bold text-neutral-800">
                    PAYROLL Payout & BANK DATA PROCESSING AGREEMENT
                  </p>
                  <p>
                    By checking the box below, you explicitly acknowledge and agree that you have entered your authentic and correct bank routing details, including IBAN and SWIFT/BIC codes.
                  </p>
                  <p>
                    <strong>1. Payout Processing:</strong> Payouts are processed from India to Slovenia via international foreign exchange direct bank-to-bank wire transfers. The funds are pre-converted on our end, meaning you will receive the exact salary in Euros (EUR) directly in your Slovenian bank account with no conversion required.
                  </p>
                  <p>
                    <strong>2. Security & Encryption:</strong> We adhere strictly to EU GDPR mandates. Your bank credentials will remain encrypted in transit and at rest, and will not be shared with outside entities except for standard tax reporting and payroll bank routing agencies.
                  </p>
                  <p>
                    <strong>3. Error Correction:</strong> It is your responsibility to maintain accurate IBAN and SWIFT details. Failure to supply correct details will delay wire routing.
                  </p>
                  <p>
                    <strong>4. Confidentiality & Non-Disclosure:</strong> You explicitly agree to maintain absolute confidentiality regarding all company resources, software code, portal access, operational data, assembly guidelines, and trade secrets. Disclosing, sharing, or revealing any proprietary company information to outside entities or third parties is strictly prohibited and will result in immediate termination and legal action.
                  </p>
                </div>

                <div className="flex items-start gap-3 mt-4">
                  <input
                     required
                     id="consent-check"
                     type="checkbox"
                     checked={agreementAccepted}
                     onChange={(e) => setAgreementAccepted(e.target.checked)}
                     className="w-5 h-5 text-blue-600 bg-neutral-100 border-neutral-300 rounded focus:ring-blue-500 mt-0.5 shrink-0"
                  />
                  <label htmlFor="consent-check" className="text-xs text-neutral-600 leading-normal select-none">
                     I have read, understood, and accept the Payroll Payout, Bank Data Processing, and Non-Disclosure Agreement. I verify that the bank details entered belong to me and represent my legal accounts.
                  </label>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white text-base font-bold rounded-xl transition-all shadow-md shadow-blue-500/10 hover:shadow-lg active:scale-98"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting Bank details...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    Submit Bank Details
                  </>
                )}
              </button>
            </div>
            
          </form>
        </div>
        
      </div>
    </div>
  );
}

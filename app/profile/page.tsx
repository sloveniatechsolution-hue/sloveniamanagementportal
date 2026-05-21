'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Building2, CreditCard, Save, FileText, CheckCircle2, ShieldCheck, HelpCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { currentUser, operators } = useStore();
  const router = useRouter();

  const [bankName, setBankName] = useState('');
  const [iban, setIban] = useState('');
  
  // Slovenian ID details
  const [serialNumber, setSerialNumber] = useState('');
  const [emso, setEmso] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('F');
  const [documentTitle, setDocumentTitle] = useState('OSEBNA IZKAZNICA');
  
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
        }
        if (operator.slovenianId) {
          setSerialNumber(operator.slovenianId.serialNumber || '');
          setEmso(operator.slovenianId.emso || '');
          setExpiryDate(operator.slovenianId.expiryDate || '');
          setIssueDate(operator.slovenianId.issueDate || '');
          setDocumentTitle((operator.slovenianId as any).documentTitle || 'OSEBNA IZKAZNICA');
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
          <FileText className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Profile Portal Access Restricted</h1>
          <p className="mt-2 text-neutral-500">Only authorized operators can submit identity details here.</p>
        </div>
      </div>
    );
  }

  // Parse name for display
  const operatorName = currentUser.name || 'Jana Vzorec';
  const nameParts = operatorName.trim().split(/\s+/);
  const firstName = nameParts[0] || 'JANA';
  const lastName = nameParts.slice(1).join(' ') || 'VZOREC';

  // Format date for identity card preview (DD.MM.YYYY)
  const formatDateSI = (dateStr: string) => {
    if (!dateStr) return '••.••.••••';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}.${parts[1]}.${parts[0]}`;
      }
    } catch (e) {}
    return dateStr;
  };

  // Helper to extract birth date from EMŠO (format: DDMMYYY...)
  const getBirthDateFromEmso = (emsoVal: string) => {
    if (emsoVal && emsoVal.length >= 7) {
      const dd = emsoVal.substring(0, 2);
      const mm = emsoVal.substring(2, 4);
      let yyy = emsoVal.substring(4, 7);
      const yearPrefix = parseInt(yyy) < 900 ? '2' : '1';
      return `${dd}.${mm}.${yearPrefix}${yyy}`;
    }
    return '••.••.••••';
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!serialNumber || serialNumber.trim().length < 5) {
      toast.error('Please enter a valid Slovenia ID Serial Number (e.g. IE9876543)');
      return;
    }

    if (!emso || emso.trim().length !== 13 || isNaN(Number(emso))) {
      toast.error('Slovenian EMŠO must be exactly 13 digits (e.g. 2806985505145)');
      return;
    }

    if (!issueDate) {
      toast.error('Please specify the ID Card Issue Date');
      return;
    }

    if (!expiryDate) {
      toast.error('Please specify the ID Card Expiry Date');
      return;
    }

    if (!bankName || !iban) {
      toast.error('Please fill out all bank credentials');
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
          bankDetails: { bankName, iban },
          slovenianId: { serialNumber, emso, expiryDate, issueDate, documentTitle },
          agreementAccepted
        })
      });
      const data = await response.json();
      if (data.success) {
        // Update local state in Zustand store
        useStore.setState((state) => ({
          operators: state.operators.map((op) => (op.id === currentUser.id ? data.operator : op))
        }));
        toast.success('Verification details successfully submitted to HR!');
        router.push('/dashboard');
      } else {
        toast.error(data.message || 'Verification failed. Please review your entries.');
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
        <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Identity & Payroll Verification</h1>
        <p className="mt-2 text-sm text-neutral-500 max-w-2xl">
          Shanghai Yisu Information Technology Co., Ltd. requires all Slovenian operators to verify their Identity Card details ("Osebna Izkaznica") and banking credentials to access the management portal.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: ID Card Preview & Explanatory Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-24 space-y-6">
            
            {/* Interactive Identity Card */}
            <div className="bg-neutral-900/5 p-4 rounded-3xl border border-neutral-200/50 flex flex-col items-center">
              <span className="text-xs text-neutral-400 font-bold uppercase tracking-widest mb-3">Live ID Card Preview</span>
              
              <div 
                className="w-full max-w-[440px] aspect-[1.586/1] bg-gradient-to-tr from-[#cceef6] via-[#e2f7f0] to-[#daf1f7] rounded-2xl border border-cyan-200 shadow-xl relative overflow-hidden flex flex-col select-none"
                style={{
                  containerType: 'inline-size',
                  backgroundImage: `
                    repeating-linear-gradient(45deg, rgba(6, 182, 212, 0.02) 0px, rgba(6, 182, 212, 0.02) 1px, transparent 1px, transparent 10px),
                    repeating-linear-gradient(-45deg, rgba(6, 182, 212, 0.02) 0px, rgba(6, 182, 212, 0.02) 1px, transparent 1px, transparent 10px),
                    radial-gradient(circle at 75% 25%, rgba(147, 197, 253, 0.15) 0%, transparent 60%)
                  `
                }}
              >
                {/* ID Header */}
                <div className="px-[3.64cqw] pt-[2.72cqw] flex justify-between items-start z-10">
                  {/* EU SI Emblem */}
                  <div className="flex gap-[1.82cqw] items-center">
                    <div className="w-[6.36cqw] h-[4.54cqw] bg-[#003399] rounded-[0.68cqw] flex flex-col items-center justify-center relative border border-white/20">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[1.59cqw] font-bold text-white tracking-tight">SI</span>
                      </div>
                      {/* EU Stars Ring */}
                      <div className="w-[3.64cqw] h-[3.64cqw] border border-dashed border-[#ffcc00]/40 rounded-full animate-[spin_10s_linear_infinite]" />
                    </div>
                    <div className="flex flex-col leading-tight">
                      <span className="text-[2.27cqw] font-extrabold text-[#003399] tracking-wider uppercase font-sans">REPUBLIKA SLOVENIJA</span>
                      <span className="text-[1.47cqw] font-semibold text-neutral-600 italic">Republic of Slovenia</span>
                      <span className="text-[2.05cqw] font-bold text-[#003399] tracking-tight uppercase">{documentTitle || 'OSEBNA IZKAZNICA'} / Identity Card</span>
                    </div>
                  </div>
                  
                  {/* Coat of Arms of Slovenia */}
                  <div className="shrink-0 bg-white/40 p-[0.11cqw] rounded-[1.36cqw]">
                    <svg className="h-[7.27cqw] w-[6.36cqw]" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 10 H90 V70 C90 95 50 110 50 110 C50 110 10 95 10 70 Z" fill="#003399" stroke="white" strokeWidth="3" />
                      {/* Triglav peaks */}
                      <path d="M30 75 L50 45 L70 75 Z" fill="white" />
                      <path d="M18 75 L38 52 L58 75 Z" fill="white" />
                      <path d="M42 75 L62 52 L82 75 Z" fill="white" />
                      {/* Wavy lines */}
                      <path d="M25 83 Q 50 75 75 83 M25 90 Q 50 82 75 90" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
                      {/* Stars */}
                      <polygon points="50,15 53,22 60,22 55,27 57,34 50,30 43,34 45,27 40,22 47,22" fill="#FFCC00" />
                      <polygon points="35,27 38,34 45,34 40,39 42,46 35,42 28,46 30,39 25,34 32,34" fill="#FFCC00" />
                      <polygon points="65,27 68,34 75,34 70,39 72,46 65,42 58,46 60,39 55,34 62,34" fill="#FFCC00" />
                    </svg>
                  </div>
                </div>

                {/* ID Content Area */}
                <div className="flex-1 px-[3.64cqw] py-[1.8cqw] grid grid-cols-12 gap-[2.72cqw] items-center z-10">
                  {/* Photo Container */}
                  <div className="col-span-4 aspect-[3/4] border-[0.45cqw] border-neutral-100 bg-neutral-300/40 rounded-[1.8cqw] overflow-hidden relative shadow-inner flex flex-col items-center justify-center">
                    {/* Grayscale Silhouette Portrait */}
                    <div className="absolute inset-0 flex flex-col items-center justify-end bg-neutral-200">
                      <div className="w-[10.9cqw] h-[10.9cqw] bg-neutral-400 rounded-full mb-[0.9cqw] border-[0.45cqw] border-neutral-300" />
                      <div className="w-[14.5cqw] h-[9.1cqw] bg-neutral-400 rounded-t-[3.6cqw]" />
                    </div>
                    {/* Security Microprint Overlays */}
                    <div 
                      className="absolute inset-0 opacity-15 pointer-events-none"
                      style={{
                        backgroundImage: `repeating-linear-gradient(0deg, #003399 0px, #003399 1px, transparent 1px, transparent 4px)`
                      }}
                    />
                    <span className="absolute top-[1.8cqw] left-[1.8cqw] text-[1.8cqw] font-black text-neutral-400/50">SI</span>
                  </div>

                  {/* Fields Block */}
                  <div className="col-span-8 grid grid-cols-2 gap-x-[1.82cqw] gap-y-[0.9cqw] text-[1.93cqw] text-neutral-700 leading-snug">
                    <div className="col-span-2">
                      <span className="text-[1.47cqw] uppercase text-neutral-400 block font-medium">1. Priimek / Surname</span>
                      <span className="font-bold text-neutral-900 uppercase tracking-wide">{lastName}</span>
                    </div>

                    <div className="col-span-2">
                      <span className="text-[1.47cqw] uppercase text-neutral-400 block font-medium">2. Ime / Given names</span>
                      <span className="font-bold text-neutral-900 uppercase tracking-wide">{firstName}</span>
                    </div>

                    <div>
                      <span className="text-[1.47cqw] uppercase text-neutral-400 block font-medium">4. Spol / Sex</span>
                      <span className="font-semibold text-neutral-900">{gender === 'M' ? 'M / M' : 'Ž / F'}</span>
                    </div>

                    <div>
                      <span className="text-[1.47cqw] uppercase text-neutral-400 block font-medium">3. Državljanstvo / Nationality</span>
                      <span className="font-semibold text-neutral-900">SI / SI</span>
                    </div>

                    <div>
                      <span className="text-[1.47cqw] uppercase text-neutral-400 block font-medium">4a. Datum rojstva / Birth Date</span>
                      <span className="font-semibold text-neutral-900">{getBirthDateFromEmso(emso)}</span>
                    </div>

                    <div>
                      <span className="text-[1.47cqw] uppercase text-neutral-400 block font-medium">5. Številka / Card Number</span>
                      <span className="font-bold text-[#003399] tracking-wider">{serialNumber || '•••••••••'}</span>
                    </div>

                    <div>
                      <span className="text-[1.47cqw] uppercase text-neutral-400 block font-medium">4b. Veljavnost / Expiry</span>
                      <span className="font-semibold text-neutral-900">{formatDateSI(expiryDate)}</span>
                    </div>

                    <div>
                      <span className="text-[1.47cqw] uppercase text-neutral-400 block font-medium">4c. Organ / Authority</span>
                      <span className="font-semibold text-neutral-900">SI - LJUBLJANA</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer & Security Barcodes */}
                <div className="h-[8.18cqw] px-[3.64cqw] border-t border-neutral-300/40 bg-white/20 backdrop-blur-[2px] flex justify-between items-center z-10">
                  <div className="flex flex-col">
                    <span className="text-[1.25cqw] uppercase text-neutral-400 font-medium leading-none">Imetnik podpisuje / Holder's Signature</span>
                    <span className="font-serif italic text-[3.18cqw] text-blue-900/80 leading-none mt-[0.11cqw]" style={{ fontFamily: 'Georgia, serif' }}>
                      {firstName.toLowerCase()} {lastName.toLowerCase()}
                    </span>
                  </div>
                  
                  {/* Holographic Chip Icon */}
                  <div className="w-[6.36cqw] h-[4.54cqw] bg-[#e5c158] border border-amber-600 rounded-[0.9cqw] relative shadow-sm flex items-center justify-center overflow-hidden">
                    <div className="w-[0.22cqw] h-full bg-amber-700/40 absolute left-[1.82cqw]" />
                    <div className="w-[0.22cqw] h-full bg-amber-700/40 absolute right-[1.82cqw]" />
                    <div className="h-[0.22cqw] w-full bg-amber-700/40 absolute top-[2.27cqw]" />
                    <div className="w-[2.27cqw] h-[2.27cqw] rounded-full border border-amber-700/40 absolute" />
                  </div>
                </div>
              </div>
            </div>

            {/* Explanation box */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2 mb-3">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
                Data Protection Commitment
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed mb-3">
                We handle Slovenian national identification credentials strictly in accordance with the European Union General Data Protection Regulation (GDPR). 
              </p>
              <ul className="text-xs text-neutral-500 space-y-2 list-disc list-inside">
                <li>Details with highly secured connection.</li>
                <li>Data is used solely for HR authentication and contract validation.</li>
                <li>Your banking credentials are used strictly for direct-deposit salary payouts.</li>
              </ul>
            </div>
            
          </div>
        </div>

        {/* Right Side: Data Input Form */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSaveProfile} className="space-y-6">
            
            {/* Section 1: ID Card Input Details */}
            <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="border-b border-neutral-100 p-6 bg-neutral-50">
                <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  1. Slovenian National ID details
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Fill in the card data exact as shown on your "Osebna Izkaznica".
                </p>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                      Card Header Title (Local Language)
                    </label>
                    <input 
                      required 
                      type="text" 
                      value={documentTitle} 
                      onChange={(e) => setDocumentTitle(e.target.value)}
                      placeholder="e.g. OSEBNA IZKAZNICA" 
                      className="block w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white text-neutral-900 placeholder-neutral-400 sm:text-sm transition-all"
                    />
                    <p className="text-[10px] text-neutral-400 mt-1">This text appears on the left side of "/ Identity Card" on the live card preview.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                      Card Serial Number
                    </label>
                    <input 
                      required 
                      type="text" 
                      value={serialNumber} 
                      onChange={(e) => setSerialNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. IE9876543" 
                      maxLength={15}
                      className="block w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white text-neutral-900 placeholder-neutral-400 sm:text-sm transition-all"
                    />
                    <p className="text-[10px] text-neutral-400 mt-1">Usually 2 letters followed by 7 digits.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                      EMŠO (Personal ID Number)
                    </label>
                    <input 
                      required 
                      type="text" 
                      value={emso} 
                      onChange={(e) => setEmso(e.target.value.replace(/\D/g, ''))}
                      placeholder="13-digit number" 
                      maxLength={13}
                      className="block w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white text-neutral-900 placeholder-neutral-400 sm:text-sm transition-all"
                    />
                    <p className="text-[10px] text-neutral-400 mt-1">Unique 13-digit Slovenian national registry identifier.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                      Date of Issue
                    </label>
                    <input 
                      required 
                      type="date" 
                      value={issueDate} 
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="block w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white text-neutral-900 sm:text-sm transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                      Date of Expiry
                    </label>
                    <input 
                      required 
                      type="date" 
                      value={expiryDate} 
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="block w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white text-neutral-900 sm:text-sm transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                      Spol / Sex
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as 'M' | 'F')}
                      className="block w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white text-neutral-900 sm:text-sm transition-all"
                    >
                      <option value="F">Ž / F (Female)</option>
                      <option value="M">M / M (Male)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Bank Details */}
            <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="border-b border-neutral-100 p-6 bg-neutral-50">
                <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  2. Bank Account (For Salary Payout)
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Specify your official Slovenian SEPA bank details.
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
                      placeholder="e.g. Nova Ljubljanska Banka d.d." 
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
              </div>
            </div>

            {/* Section 3: Legal Terms & Agreement Acceptance */}
            <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="border-b border-neutral-100 p-6 bg-neutral-50">
                <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                  3. Terms of Agreement & Data Consent
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Please read and accept the terms of data storage.
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-xs text-neutral-600 max-h-48 overflow-y-auto leading-relaxed space-y-3 shadow-inner">
                  <p className="font-bold text-neutral-800">
                    EMPLOYMENT VERIFICATION AND SEPA PAYROLL DATA PROCESSING AGREEMENT
                  </p>
                  <p>
                    By checking the box below, you explicitly acknowledge and agree that you have entered your authentic Slovenian National Identity card serial number and EMŠO registry details. 
                  </p>
                  <p>
                    <strong>1. Scope of Data:</strong> The gathered data comprises Slovenian Identity Card number, Spol (Sex), EMŠO (13-digit identification code), Date of Issue, and Expiry date, along with bank routing NLB/SEPA IBAN coordinates.
                  </p>
                  <p>
                    <strong>2. Processing Authority:</strong> The processing of this data is managed by Shanghai Yisu Information Technology Co., Ltd. for our European operations branch to comply with labor laws, payroll processing, and security verification.
                  </p>
                  <p>
                    <strong>3. GDPR Compliance:</strong> We adhere strictly to EU GDPR mandates. Your credentials will remain encrypted in transit and rest, and will not be shared with outside entities, other than verified taxation or judicial agencies if legally requested.
                  </p>
                  <p>
                    <strong>4. True representation:</strong> Providing false EMŠOs or mock cards is an offense. You confirm that you are the legitimate holder of this document.
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
                    I have read, understood, and accept the Employment Verification and SEPA Data Processing Agreement. I verify that the Slovenian ID details entered belong to me and represent my legal identity card.
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
                    Verifying Credentials...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    Submit & Verify Identity
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

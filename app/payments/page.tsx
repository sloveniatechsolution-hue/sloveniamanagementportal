'use client';

import { useState, useEffect } from 'react';
import { useStore, Operator, Payment } from '@/lib/store';
import { CreditCard, DollarSign, Calendar, UploadCloud, Download, Trash2, Users, FileText, CheckCircle2, ShieldAlert, Sparkles, FileDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function PaymentsPage() {
  const { currentUser, operators, fetchOperators, payments, fetchPayments, addPayment, deletePayment } = useStore();

  const [selectedOperator, setSelectedOperator] = useState('');
  const [weekStartDate, setWeekStartDate] = useState('');
  const [weekEndDate, setWeekEndDate] = useState('');
  const [amount, setAmount] = useState('');
  const [metersAssembled, setMetersAssembled] = useState(0);
  const [status, setStatus] = useState<'Paid' | 'Processing'>('Paid');
  
  const [receiptName, setReceiptName] = useState('');
  const [receiptData, setReceiptData] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedFilterOperator, setSelectedFilterOperator] = useState('all');

  // On mount: fetch operators and payments
  useEffect(() => {
    fetchOperators();
    if (currentUser?.role === 'operator') {
      fetchPayments(currentUser.id);
    } else {
      fetchPayments();
    }
  }, [currentUser, fetchOperators, fetchPayments]);

  // Whenever admin changes dates or operator, auto-calculate meters assembled
  useEffect(() => {
    if (currentUser?.role === 'admin' && selectedOperator && weekStartDate && weekEndDate) {
      const calculateAutoMeters = async () => {
        setIsCalculating(true);
        try {
          const res = await fetch(`/api/attendance?operatorId=${selectedOperator}&startDate=${weekStartDate}&endDate=${weekEndDate}`);
          const data = await res.json();
          if (data.success && Array.isArray(data.attendance)) {
            const sum = data.attendance.reduce((acc: number, curr: any) => acc + (curr.metersAssembled || 0), 0);
            setMetersAssembled(sum);
          }
        } catch (e) {
          console.error('Failed to fetch attendance logs for calculation', e);
        } finally {
          setIsCalculating(false);
        }
      };
      calculateAutoMeters();
    }
  }, [currentUser, selectedOperator, weekStartDate, weekEndDate]);

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';

  // Read file to Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // limit 2MB
        toast.error('File is too large. Maximum size is 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setReceiptName(file.name);
        setReceiptData(reader.result as string);
        toast.success(`Receipt selected: ${file.name}`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOperator) {
      toast.error('Please select an operator.');
      return;
    }
    if (!weekStartDate || !weekEndDate) {
      toast.error('Please set the weekly start and end dates.');
      return;
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error('Please enter a valid payment amount.');
      return;
    }
    if (!receiptData) {
      toast.error('Please upload a payment receipt file (PDF/Image).');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await addPayment({
        operatorId: selectedOperator,
        weekStartDate,
        weekEndDate,
        amount: Number(amount),
        metersAssembled,
        status,
        receiptName,
        receiptData,
      });

      if (success) {
        toast.success('Weekly payment recorded successfully!');
        // Reset form
        setSelectedOperator('');
        setWeekStartDate('');
        setWeekEndDate('');
        setAmount('');
        setMetersAssembled(0);
        setReceiptName('');
        setReceiptData('');
      } else {
        toast.error('Failed to log payment.');
      }
    } catch (err) {
      toast.error('An error occurred while saving the payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadReceipt = (payment: Payment) => {
    if (!payment.receiptData) {
      toast.error('No receipt file attached to this payment record.');
      return;
    }
    try {
      const link = document.createElement('a');
      link.href = payment.receiptData;
      link.download = payment.receiptName || `receipt-${payment._id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Receipt download started');
    } catch (e) {
      toast.error('Failed to download receipt file');
    }
  };

  // Filtered payments for admin view
  const visiblePayments = payments.filter((p) => {
    if (isAdmin && selectedFilterOperator !== 'all') {
      return p.operatorId === selectedFilterOperator;
    }
    return true;
  });

  // Calculate totals
  const totalPaidAmount = visiblePayments.reduce((acc, curr) => curr.status === 'Paid' ? acc + curr.amount : acc, 0);
  const totalMetersAssembledPaid = visiblePayments.reduce((acc, curr) => acc + curr.metersAssembled, 0);
  const totalProcessingAmount = visiblePayments.reduce((acc, curr) => curr.status === 'Processing' ? acc + curr.amount : acc, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 flex items-center gap-3">
          <CreditCard className="h-8 w-8 text-blue-600" />
          {isAdmin ? 'Weekly Payment Ledgers' : 'Payments & Invoices'}
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          {isAdmin 
            ? 'Record weekly payout transactions, upload payment slips/receipts, and track cumulative payouts.'
            : 'View your weekly compensation status, access receipts, and monitor financial transactions.'}
        </p>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
            €
          </div>
          <div>
            <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider block">Total Disbursed</span>
            <span className="text-2xl font-bold text-neutral-900">€{totalPaidAmount.toLocaleString('sl-SI', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 bg-cyan-50 text-cyan-600 rounded-xl flex items-center justify-center">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider block">Paid Assemblies</span>
            <span className="text-2xl font-bold text-neutral-900">{totalMetersAssembledPaid.toLocaleString()} meters</span>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider block">Processing/Pending</span>
            <span className="text-2xl font-bold text-neutral-900">€{totalProcessingAmount.toLocaleString('sl-SI', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: RECORD PAYMENT FORM (Only for Admins) */}
        {isAdmin && (
          <div className="lg:col-span-5 bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="border-b border-neutral-100 p-6 bg-neutral-50">
              <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                Record Operator Payment
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Disburse weekly payments with verifiable documentation.
              </p>
            </div>

            <form onSubmit={handleSavePayment} className="p-6 space-y-5">
              {/* Operator */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Select Operator</label>
                <select
                  required
                  value={selectedOperator}
                  onChange={(e) => setSelectedOperator(e.target.value)}
                  className="block w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white text-neutral-900 sm:text-sm transition-all"
                >
                  <option value="">-- Choose Operator --</option>
                  {operators.filter(op => op.status === 'Active').map(op => (
                    <option key={op.id} value={op.id}>{op.name} ({op.id})</option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Week Start</label>
                  <input
                    required
                    type="date"
                    value={weekStartDate}
                    onChange={(e) => setWeekStartDate(e.target.value)}
                    className="block w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white text-neutral-900 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Week End</label>
                  <input
                    required
                    type="date"
                    value={weekEndDate}
                    onChange={(e) => setWeekEndDate(e.target.value)}
                    className="block w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white text-neutral-900 sm:text-sm"
                  />
                </div>
              </div>

              {/* Work Volume & Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1.5 flex items-center gap-1">
                    Meters Fixed
                    {isCalculating && <span className="animate-spin text-blue-600 text-[10px]">⏳</span>}
                  </label>
                  <input
                    type="number"
                    disabled
                    value={metersAssembled}
                    className="block w-full px-3 py-2 bg-neutral-100 border border-neutral-200 rounded-xl text-neutral-500 font-bold sm:text-sm cursor-not-allowed"
                  />
                  <p className="text-[9px] text-neutral-400 mt-1">Summed from attendance range.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Payout Amount (€)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 850.00"
                    className="block w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white text-neutral-900 sm:text-sm transition-all"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Payment Status</label>
                <div className="flex p-1 bg-neutral-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setStatus('Paid')}
                    className={cn(
                      "w-full py-1.5 rounded-lg text-xs font-semibold transition-all",
                      status === 'Paid' ? "bg-white text-emerald-700 shadow-sm" : "text-neutral-500"
                    )}
                  >
                    Paid / Transferred
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('Processing')}
                    className={cn(
                      "w-full py-1.5 rounded-lg text-xs font-semibold transition-all",
                      status === 'Processing' ? "bg-white text-amber-700 shadow-sm" : "text-neutral-500"
                    )}
                  >
                    Processing
                  </button>
                </div>
              </div>

              {/* Receipt File Upload */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Payment Receipt File</label>
                <div className="border-2 border-dashed border-neutral-200 hover:border-blue-500 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors relative group bg-neutral-50">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <UploadCloud className="h-8 w-8 text-neutral-400 group-hover:text-blue-500 mb-2 transition-colors" />
                  <span className="text-xs text-neutral-600 text-center font-medium">
                    {receiptName ? `Selected: ${receiptName}` : 'Click to upload receipt (PDF or Image)'}
                  </span>
                  <span className="text-[10px] text-neutral-400 mt-1">Maximum file size 2MB.</span>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-300 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/10 transition-all active:scale-[0.98]"
              >
                Verify & Disburse Weekly Payment
              </button>
            </form>
          </div>
        )}

        {/* Right Side: COMPREHENSIVE PAYMENTS LEDGER LIST */}
        <div className={cn(isAdmin ? 'lg:col-span-7' : 'lg:col-span-12', "bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden")}>
          <div className="border-b border-neutral-100 p-6 bg-neutral-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Compensation Ledger
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Historical list of weekly payroll cycles.
              </p>
            </div>

            {/* Filter (Admins only) */}
            {isAdmin && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Filter:</span>
                <select
                  value={selectedFilterOperator}
                  onChange={(e) => setSelectedFilterOperator(e.target.value)}
                  className="px-2 py-1 border border-neutral-200 rounded-lg text-xs bg-white text-neutral-700"
                >
                  <option value="all">All Operators</option>
                  {operators.map(op => (
                    <option key={op.id} value={op.id}>{op.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  {isAdmin && <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Operator</th>}
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Pay Period</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Work Volume</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider">Receipt</th>
                  {isAdmin && <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">Actions</th>}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {visiblePayments.map((p) => {
                  const op = operators.find(o => o.id === p.operatorId);
                  return (
                    <tr key={p._id} className="hover:bg-neutral-50 transition-colors">
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-neutral-900">
                          {op ? op.name : `ID: ${p.operatorId}`}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                        {format(new Date(p.weekStartDate), 'dd.MM')} - {format(new Date(p.weekEndDate), 'dd.MM.yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {p.metersAssembled.toLocaleString()} meters
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-neutral-900">
                        €{p.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          p.status === 'Paid' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                        )}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <button
                          onClick={() => downloadReceipt(p)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors"
                          title={`Download ${p.receiptName || 'receipt'}`}
                        >
                          <FileDown className="h-3.5 w-3.5" />
                          Receipt
                        </button>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <button
                            onClick={async () => {
                              if (confirm('Delete this payment ledger entry?')) {
                                const success = await deletePayment(p._id);
                                if (success) toast.success('Entry removed');
                              }
                            }}
                            className="p-1 text-neutral-400 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}

                {visiblePayments.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 5} className="px-6 py-12 text-center text-sm text-neutral-400">
                      <ShieldAlert className="h-12 w-12 mx-auto text-neutral-300 mb-2" />
                      No recorded payments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

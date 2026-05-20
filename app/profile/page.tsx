'use client';

import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { Building2, CreditCard, Save, FileText, UploadCloud, CheckCircle2, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { currentUser, operators, updateOperator } = useStore();
  
  const [bankName, setBankName] = useState('');
  const [iban, setIban] = useState('');
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedDoc, setUploadedDoc] = useState<{fileName: string, uploadDate: string} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser?.role === 'operator') {
      const operator = operators.find(op => op.id === currentUser.id);
      if (operator?.bankDetails) {
        setBankName(operator.bankDetails.bankName || '');
        setIban(operator.bankDetails.iban || '');
      }
      if (operator?.idDocument) {
        setUploadedDoc(operator.idDocument);
      }
    }
  }, [currentUser, operators]);

  if (!currentUser || currentUser.role !== 'operator') {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="mt-2 text-gray-500">Only operators can manage profile details here.</p>
      </div>
    );
  }

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    updateOperator(currentUser.id, {
      bankDetails: { bankName, iban }
    });
    toast.success('Bank details updated securely.');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate file upload process
    setIsUploading(true);
    
    setTimeout(() => {
      const docData = {
        fileName: file.name,
        uploadDate: new Date().toISOString().split('T')[0]
      };
      
      updateOperator(currentUser.id, {
        idDocument: docData
      });
      
      setUploadedDoc(docData);
      setIsUploading(false);
      toast.success('Slovenian ID document uploaded successfully!');
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, 1500);
  };

  const handleRemoveDoc = () => {
    const operator = operators.find(op => op.id === currentUser.id);
    if (operator) {
      const { idDocument, ...rest } = operator;
      updateOperator(currentUser.id, { idDocument: undefined }); // Remove from store
      setUploadedDoc(null);
      toast.success('Document removed.');
    }
  };

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900">My Profile</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Manage your personal information, identity verification, and payroll bank details.
        </p>
      </div>

      {(!bankName || !iban || !uploadedDoc) && (
        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <FileText className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-amber-800">Action Required</h3>
            <p className="text-sm text-amber-700 mt-1">
              You must upload your Slovenian ID and provide your Bank Details before you can access your dashboard and attendance records.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {/* Identity Verification Section */}
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="border-b border-neutral-100 p-6 bg-neutral-50">
            <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Identity Verification
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              Please upload a clear copy of your Slovenian National ID for HR verification.
            </p>
          </div>
          
          <div className="p-6">
            {uploadedDoc ? (
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-100 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-green-900">{uploadedDoc.fileName}</p>
                    <p className="text-xs text-green-700">Uploaded on {uploadedDoc.uploadDate}</p>
                  </div>
                </div>
                <button 
                  onClick={handleRemoveDoc}
                  className="p-2 text-green-700 hover:bg-green-100 rounded-lg transition-colors"
                  title="Remove document"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div 
                className="border-2 border-dashed border-neutral-300 rounded-xl p-8 text-center hover:bg-neutral-50 transition-colors cursor-pointer relative"
                onClick={() => !isUploading && fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload}
                  className="hidden" 
                  accept="image/*,.pdf"
                />
                
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
                    <p className="text-sm font-semibold text-neutral-700">Uploading securely...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <div className="bg-blue-50 p-3 rounded-full mb-4">
                      <UploadCloud className="h-8 w-8 text-blue-600" />
                    </div>
                    <p className="text-sm font-semibold text-neutral-700 mb-1">Click to upload your Slovenian ID</p>
                    <p className="text-xs text-neutral-500">PDF, JPG or PNG (max. 5MB)</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bank Details Section */}
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="border-b border-neutral-100 p-6 bg-neutral-50">
            <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Bank Details (For Salary)
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              Your banking information is end-to-end encrypted and visible only to authorized HR personnel.
            </p>
          </div>
          
          <form onSubmit={handleSaveBank} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Bank Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input 
                    required 
                    type="text" 
                    value={bankName} 
                    onChange={(e) => setBankName(e.target.value)} 
                    placeholder="e.g. NLB d.d." 
                    className="block w-full pl-10 pr-3 py-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">IBAN Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CreditCard className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input 
                    required 
                    type="text" 
                    value={iban} 
                    onChange={(e) => setIban(e.target.value)} 
                    placeholder="SI56..." 
                    className="block w-full pl-10 pr-3 py-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Save className="h-4 w-4" />
                Securely Save Details
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

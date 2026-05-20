'use client';

import { useState } from 'react';
import { useStore, Operator } from '@/lib/store';
import { Plus, Search, MoreVertical, Edit2, Trash2, Mail, Phone, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function OperatorsPage() {
  const { operators, addOperator, deleteOperator, updateOperator } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    joinDate: new Date().toISOString().split('T')[0],
    status: 'Active' as 'Active' | 'Inactive',
  });

  const filteredOperators = operators.filter((op) =>
    op.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateOperator(editingId, formData);
      toast.success('Operator updated successfully');
    } else {
      const generatedId = 'OP' + Math.floor(100 + Math.random() * 900);
      addOperator({
        id: generatedId,
        password: 'password123',
        ...formData,
      });
      toast.success(`Operator added! ID: ${generatedId}`);
    }
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', email: '', phone: '', joinDate: new Date().toISOString().split('T')[0], status: 'Active' });
  };

  const openEditModal = (op: Operator) => {
    setFormData({
      name: op.name,
      email: op.email,
      phone: op.phone,
      joinDate: op.joinDate,
      status: op.status,
    });
    setEditingId(op.id);
    setIsModalOpen(true);
  };

  return (
    <div className="p-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 ">Operators</h1>
          <p className="mt-2 text-sm text-neutral-500 ">
            Manage your workforce in Slovenia. Add, edit, or remove operators.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({ name: '', email: '', phone: '', joinDate: new Date().toISOString().split('T')[0], status: 'Active' });
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Operator
          </button>
        </div>
      </div>

      <div className="mb-6 flex items-center max-w-md">
        <div className="relative w-full">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-neutral-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            className="block w-full rounded-xl border-0 py-2.5 pl-10 pr-3 text-neutral-900 ring-1 ring-inset ring-neutral-300 placeholder:text-neutral-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6    :ring-blue-500"
            placeholder="Search operators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {filteredOperators.map((op) => (
            <motion.div
              key={op.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-md  "
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      className="h-12 w-12 rounded-full object-cover ring-2 ring-neutral-100 "
                      src={`https://ui-avatars.com/api/?name=${op.name.replace(' ', '+')}&background=random`}
                      alt={op.name}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-neutral-900 ">{op.name}</h3>
                        <span className="text-xs text-neutral-400 font-mono">#{op.id}</span>
                      </div>
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-1",
                        op.status === 'Active' ? "bg-emerald-50 text-emerald-700  " : "bg-neutral-100 text-neutral-700  "
                      )}>
                        {op.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditModal(op)} className="p-1.5 text-neutral-400 hover:text-blue-600 transition-colors">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => { deleteOperator(op.id); toast.success('Operator deleted'); }} className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-6 flex flex-col gap-3 text-sm text-neutral-600 ">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-neutral-400" />
                    {op.email || 'N/A'}
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-neutral-400" />
                    {op.phone || 'N/A'}
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-neutral-400" />
                    Joined {op.joinDate}
                  </div>
                  {op.bankDetails && (
                    <div className="mt-2 p-3 bg-neutral-50  rounded-lg border border-neutral-100 ">
                      <p className="text-xs font-semibold text-neutral-900  flex items-center gap-1.5 mb-1">
                        🏦 {op.bankDetails.bankName}
                      </p>
                      <p className="text-xs text-neutral-500  font-mono">
                        {op.bankDetails.iban}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl  border border-neutral-200 "
            >
              <form onSubmit={handleSubmit} className="flex flex-col h-full">
                <div className="px-6 py-5 border-b border-neutral-100 ">
                  <h2 className="text-xl font-semibold text-neutral-900 ">
                    {editingId ? 'Edit Operator' : 'Add New Operator'}
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700  mb-1">Full Name</label>
                    <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-xl border-0 py-2.5 px-3 text-neutral-900 shadow-sm ring-1 ring-inset ring-neutral-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6    :ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700  mb-1">Email</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full rounded-xl border-0 py-2.5 px-3 text-neutral-900 shadow-sm ring-1 ring-inset ring-neutral-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6    :ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700  mb-1">Phone</label>
                    <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full rounded-xl border-0 py-2.5 px-3 text-neutral-900 shadow-sm ring-1 ring-inset ring-neutral-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6    :ring-blue-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700  mb-1">Join Date</label>
                      <input type="date" value={formData.joinDate} onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })} className="w-full rounded-xl border-0 py-2.5 px-3 text-neutral-900 shadow-sm ring-1 ring-inset ring-neutral-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6    :ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700  mb-1">Status</label>
                      <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className="w-full rounded-xl border-0 py-2.5 px-3 text-neutral-900 shadow-sm ring-1 ring-inset ring-neutral-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6    :ring-blue-500">
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="bg-neutral-50  px-6 py-4 flex justify-end gap-3 rounded-b-2xl border-t border-neutral-100 ">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-neutral-700  hover:bg-neutral-100 :bg-neutral-800 rounded-lg transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors">
                    {editingId ? 'Save Changes' : 'Add Operator'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

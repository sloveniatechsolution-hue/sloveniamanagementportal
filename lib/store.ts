import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SlovenianIdDetails = {
  serialNumber: string;
  emso: string;
  expiryDate: string;
  issueDate: string;
  documentTitle?: string;
  idImage?: string;
};

export type Operator = {
  id: string; // Employee ID or auto-generated
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  status: 'Active' | 'Inactive';
  password?: string; // Operator login password
  slovenianId?: SlovenianIdDetails; // Slovenian National ID details
  bankDetails?: {
    country: string;
    bankName: string;
    iban?: string;
    swiftCode: string;
    accountNumber?: string;
    branchName?: string;
    routingNumber?: string;
  };
  agreementAccepted?: boolean;
  agreementAcceptedAt?: string;
  shift?: 'Day' | 'Evening' | 'Night';
};

export type AttendanceRecord = {
  id: string;
  date: string;
  operatorId: string;
  status: 'Present' | 'Absent' | 'Leave';
  metersAssembled: number;
  shift?: 'Day' | 'Evening' | 'Night';
  checkInTime?: string;
  submitted?: boolean;
};

export type Payment = {
  _id: string;
  operatorId: string;
  weekStartDate: string;
  weekEndDate: string;
  amount: number;
  metersAssembled: number;
  status: 'Paid' | 'Processing';
  receiptName?: string;
  receiptData?: string; // base64
  createdAt?: string;
};

export type CurrentUser = {
  role: 'admin' | 'operator';
  id: string; // 'admin' for admin, or operator id
  name: string;
} | null;

interface AppState {
  currentUser: CurrentUser;
  operators: Operator[];
  attendance: AttendanceRecord[];
  payments: Payment[];
  isLoading: boolean;
  setCurrentUser: (user: CurrentUser) => void;
  fetchOperators: () => Promise<void>;
  fetchAttendance: (date: string) => Promise<void>;
  addOperator: (operator: Omit<Operator, 'id'>) => Promise<any>;
  updateOperator: (id: string, operator: Partial<Operator>) => Promise<any>;
  deleteOperator: (id: string) => Promise<void>;
  saveAttendance: (records: Omit<AttendanceRecord, 'id'>[]) => Promise<void>;

  // Payment actions
  fetchPayments: (operatorId?: string) => Promise<void>;
  addPayment: (payment: Omit<Payment, '_id' | 'createdAt'>) => Promise<any>;
  deletePayment: (id: string) => Promise<boolean>;

  // Sidebar responsive state
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      operators: [],
      attendance: [],
      payments: [],
      isLoading: false,
      isSidebarOpen: false,

      setCurrentUser: (user) => set({ currentUser: user }),
      setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),

      fetchOperators: async () => {
        set({ isLoading: true });
        try {
          const res = await fetch('/api/operators');
          const data = await res.json();
          if (data.success) {
            set({ operators: data.operators });
          }
        } catch (error) {
          console.error('Failed to fetch operators:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      fetchAttendance: async (date: string) => {
        set({ isLoading: true });
        try {
          const res = await fetch(`/api/attendance?date=${date}`);
          const data = await res.json();
          if (data.success) {
            set({ attendance: data.attendance });
          }
        } catch (error) {
          console.error('Failed to fetch attendance:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      addOperator: async (operator) => {
        try {
          const res = await fetch('/api/operators', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(operator),
          });
          const data = await res.json();
          if (data.success) {
            set((state) => ({ operators: [data.operator, ...state.operators] }));
            return data.operator;
          }
        } catch (error) {
          console.error('Failed to add operator:', error);
        }
      },

      updateOperator: async (id, updatedFields) => {
        try {
          const res = await fetch(`/api/operators/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedFields),
          });
          const data = await res.json();
          if (data.success) {
            set((state) => ({
              operators: state.operators.map((op) => (op.id === id ? data.operator : op)),
            }));
            return data.operator;
          }
        } catch (error) {
          console.error('Failed to update operator:', error);
        }
      },

      deleteOperator: async (id) => {
        try {
          const res = await fetch(`/api/operators/${id}`, {
            method: 'DELETE',
          });
          const data = await res.json();
          if (data.success) {
            set((state) => ({ operators: state.operators.filter((op) => op.id !== id) }));
          }
        } catch (error) {
          console.error('Failed to delete operator:', error);
        }
      },

      saveAttendance: async (records) => {
        try {
          const res = await fetch('/api/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ records }),
          });
          const data = await res.json();
          if (data.success) {
            const dates = Array.from(new Set(records.map(r => r.date)));
            if (dates.length > 0) {
              await get().fetchAttendance(dates[0]);
            }
          }
        } catch (error) {
          console.error('Failed to save attendance:', error);
        }
      },

      // Payment operations
      fetchPayments: async (operatorId) => {
        set({ isLoading: true });
        try {
          const url = operatorId ? `/api/payments?operatorId=${operatorId}` : '/api/payments';
          const res = await fetch(url);
          const data = await res.json();
          if (data.success) {
            set({ payments: data.payments });
          }
        } catch (error) {
          console.error('Failed to fetch payments:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      addPayment: async (payment) => {
        try {
          const res = await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payment),
          });
          const data = await res.json();
          if (data.success) {
            set((state) => ({ payments: [data.payment, ...state.payments] }));
            return data.payment;
          }
        } catch (error) {
          console.error('Failed to add payment:', error);
        }
        return null;
      },

      deletePayment: async (id) => {
        try {
          const res = await fetch(`/api/payments/${id}`, {
            method: 'DELETE',
          });
          const data = await res.json();
          if (data.success) {
            set((state) => ({ payments: state.payments.filter((p) => p._id !== id) }));
            return true;
          }
        } catch (error) {
          console.error('Failed to delete payment:', error);
        }
        return false;
      },
    }),
    {
      name: 'smp-storage-v3',
    }
  )
);

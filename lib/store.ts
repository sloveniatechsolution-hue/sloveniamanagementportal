import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Operator = {
  id: string; // Employee ID or auto-generated
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  status: 'Active' | 'Inactive';
  password?: string; // Operator login password
  slovenianId?: string; // Slovenian National ID
  bankDetails?: {
    bankName: string;
    iban: string;
  };
  idDocument?: {
    fileName: string;
    uploadDate: string;
  };
};

export type AttendanceRecord = {
  id: string;
  date: string;
  operatorId: string;
  status: 'Present' | 'Absent' | 'Leave';
  metersAssembled: number;
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
  setCurrentUser: (user: CurrentUser) => void;
  addOperator: (operator: Operator) => void;
  updateOperator: (id: string, operator: Partial<Operator>) => void;
  deleteOperator: (id: string) => void;
  addAttendance: (record: AttendanceRecord) => void;
  updateAttendance: (id: string, record: Partial<AttendanceRecord>) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      currentUser: null,
      operators: [
        { id: 'OP001', name: 'Ivan Novak', email: 'ivan@example.si', phone: '+386 40 123 456', joinDate: '2025-10-01', status: 'Active', password: 'password123' },
        { id: 'OP002', name: 'Luka Kovač', email: 'luka@example.si', phone: '+386 41 987 654', joinDate: '2025-11-15', status: 'Active', password: 'password123' },
      ],
      attendance: [],
      setCurrentUser: (user) => set({ currentUser: user }),
      addOperator: (operator) => set((state) => ({ operators: [...state.operators, operator] })),
      updateOperator: (id, updatedFields) =>
        set((state) => ({
          operators: state.operators.map((op) => (op.id === id ? { ...op, ...updatedFields } : op)),
        })),
      deleteOperator: (id) =>
        set((state) => ({ operators: state.operators.filter((op) => op.id !== id) })),
      addAttendance: (record) => set((state) => ({ attendance: [...state.attendance, record] })),
      updateAttendance: (id, updatedFields) =>
        set((state) => ({
          attendance: state.attendance.map((rec) => (rec.id === id ? { ...rec, ...updatedFields } : rec)),
        })),
    }),
    {
      name: 'smp-storage',
    }
  )
);

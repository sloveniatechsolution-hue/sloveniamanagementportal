import mongoose, { Schema, models, model } from 'mongoose';

const SlovenianIdSchema = new Schema({
  serialNumber: { type: String, required: true },
  emso: { type: String, required: true },
  expiryDate: { type: String, required: true },
  issueDate: { type: String, required: true },
  documentTitle: { type: String, required: false, default: 'OSEBNA IZKAZNICA' },
  idImage: { type: String, required: false },
});

const BankDetailsSchema = new Schema({
  bankName: { type: String, required: true },
  iban: { type: String, required: true },
  swiftCode: { type: String, required: false },
});

const OperatorSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  joinDate: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  password: { type: String, required: true },
  slovenianId: { type: SlovenianIdSchema, required: false },
  bankDetails: { type: BankDetailsSchema, required: false },
  agreementAccepted: { type: Boolean, default: false },
  agreementAcceptedAt: { type: Date, required: false },
  shift: { type: String, enum: ['Day', 'Evening', 'Night'], required: false },
}, { timestamps: true });

const AttendanceSchema = new Schema({
  date: { type: String, required: true }, // YYYY-MM-DD
  operatorId: { type: String, required: true },
  status: { type: String, enum: ['Present', 'Absent', 'Leave'], required: true },
  metersAssembled: { type: Number, default: 0 },
  shift: { type: String, enum: ['Day', 'Evening', 'Night'], default: 'Day' },
  checkInTime: { type: String, required: false },
  submitted: { type: Boolean, default: false },
}, { timestamps: true });

// Avoid compiling model if it already exists
export const Operator = models.Operator || model('Operator', OperatorSchema);
export const Attendance = models.Attendance || model('Attendance', AttendanceSchema);

const PaymentSchema = new Schema({
  operatorId: { type: String, required: true },
  weekStartDate: { type: String, required: true },
  weekEndDate: { type: String, required: true },
  amount: { type: Number, required: true },
  metersAssembled: { type: Number, default: 0 },
  status: { type: String, enum: ['Paid', 'Processing'], default: 'Paid' },
  receiptName: { type: String, required: false },
  receiptData: { type: String, required: false }, // base64 string
}, { timestamps: true });

export const Payment = models.Payment || model('Payment', PaymentSchema);

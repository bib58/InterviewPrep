import mongoose, { Schema, Document } from 'mongoose';

export enum TransactionType {
  CREDIT_PURCHASE = 'CREDIT_PURCHASE',
  BOOKING_DEDUCTION = 'BOOKING_DEDUCTION',
  BOOKING_EARNING = 'BOOKING_EARNING',
  ADMIN_ADJUSTMENT = 'ADMIN_ADJUSTMENT',
  WELCOME_BONUS = 'WELCOME_BONUS'
}

const CreditTransactionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: Object.values(TransactionType), required: true },
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
  stripeSessionId: { type: String, unique: true, sparse: true },
  createdAt: { type: Date, default: Date.now },
});

export const CreditTransaction = mongoose.models.CreditTransaction || mongoose.model('CreditTransaction', CreditTransactionSchema);

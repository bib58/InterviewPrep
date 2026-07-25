import mongoose, { Schema, Document } from 'mongoose';

export const PayoutStatus = {
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
};

const PayoutSchema = new Schema({
  interviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  credits: { type: Number, required: true },
  platformFee: { type: Number, required: true },
  netAmount: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  paymentDetail: { type: String, required: true },
  status: { type: String, enum: Object.values(PayoutStatus), default: PayoutStatus.PROCESSING },
  adminNote: { type: String },
  processedAt: { type: Date },
  processedBy: { type: String },
}, { timestamps: true });

PayoutSchema.index({ status: 1, createdAt: 1 });
PayoutSchema.index({ interviewerId: 1, status: 1 });

export const Payout = mongoose.models.Payout || mongoose.model('Payout', PayoutSchema);

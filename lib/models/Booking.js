import mongoose, { Schema, Document } from 'mongoose';

const BookingStatus = {
  SCHEDULED: 'SCHEDULED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
}

const BookingSchema = new Schema({
  intervieweeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  interviewerId: { type: Schema.Types.ObjectId, ref: 'Interviewer', required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  topic: { type: String, default: 'Mock Interview Call' },
  status: { type: String, enum: Object.values(BookingStatus), default: BookingStatus.SCHEDULED },
  creditsCharged: { type: Number, default: 1 },
  streamCallId: { type: String, sparse: true },
  recordingUrl: { type: String },
  feedback: { type: Schema.Types.ObjectId, ref: 'Feedback' },
  review: { type: Schema.Types.ObjectId, ref: 'Review' },
}, { timestamps: true });

BookingSchema.index({ status: 1, createdAt: 1 });
BookingSchema.index({ interviewerId: 1, status: 1 });
BookingSchema.index({ intervieweeId: 1, status: 1 });


export const Booking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);

export {BookingStatus};
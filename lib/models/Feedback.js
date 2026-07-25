import mongoose, { Schema, Document } from 'mongoose';

export const FeedbackRating = {
  POOR: "POOR",
  AVERAGE: "AVERAGE",
  GOOD: "GOOD",
  EXCELLENT: "EXCELLENT",
};

const FeedbackSchema = new Schema({
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
  summary: { type: String, required: true },
  technical: { type: String, required: true },
  communication: { type: String, required: true },
  problemSolving: { type: String, required: true },
  recommendation: { type: String, required: true },
  strengths: [{ type: String }],
  improvements: [{ type: String }],
  overallRating: { type: String, enum: Object.values(FeedbackRating), required: true },
  sessionRating: { type: Number },
  sessionComment: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const Feedback = mongoose.models.Feedback || mongoose.model('Feedback', FeedbackSchema);

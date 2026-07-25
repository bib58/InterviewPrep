import mongoose, { Schema } from 'mongoose';

const ReviewSchema = new Schema({
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true
  },
  intervieweeId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  interviewerId: {
    type: Schema.Types.ObjectId,
    ref: 'Interviewer',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  reviewText: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const Review = mongoose.models.Review || mongoose.model('Review', ReviewSchema);
export default Review;

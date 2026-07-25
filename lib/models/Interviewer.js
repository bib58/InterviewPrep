import mongoose from 'mongoose';

const interviewerSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    emailId: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['user-interviewer'],
      default: 'user-interviewer',
    },
    title: {
      type: String,
      required: true,
    },
    company: {
      type: String,
      required: true,
    },
    yearsExp: {
      type: String,
      required: true,
    },
    categories: {
      type: [String],
      required: true,
    },
    bio: {
      type: String,
      maxLength: 300,
      required: true,
    },
    credits: {
      type: Number,
      default: 0,
    },
    creditBalance: {
      type: Number,
      default: 0,
    },
    availableSlots: [
      {
        startTime: {
          type: Date,
          required: true,
        },
        endTime: {
          type: Date,
          required: true,
        },
        isBooked: {
          type: Boolean,
          default: false,
        },
      },
    ],
    upiId: {
      type: String,
      trim: true,
    },
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review',
      },
    ],
  },
  { timestamps: true }
);

const Interviewer = mongoose.models.Interviewer || mongoose.model('Interviewer', interviewerSchema);

export default Interviewer;
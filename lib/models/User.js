import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
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
      enum: ['user-interviewer', 'user-interviewee', 'admin', 'user'],
      default: 'user-interviewee',
    },
    credits: {
      type: Number,
      default: 5,
    },
  },
  { timestamps: true }
);


const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;

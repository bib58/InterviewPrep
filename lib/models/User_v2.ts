import mongoose, { Schema, Document } from 'mongoose';

export enum UserRole {
  UNASSIGNED = 'UNASSIGNED',
  INTERVIEWEE = 'INTERVIEWEE',
  INTERVIEWER = 'INTERVIEWER'
}

export enum InterviewCategory {
  FRONTEND = 'FRONTEND',
  BACKEND = 'BACKEND',
  FULLSTACK = 'FULLSTACK',
  DSA = 'DSA',
  SYSTEM_DESIGN = 'SYSTEM_DESIGN',
  BEHAVIORAL = 'BEHAVIORAL',
  DEVOPS = 'DEVOPS',
  MOBILE = 'MOBILE'
}

const UserSchema = new Schema({
  clerkUserId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String },
  imageUrl: { type: String },
  role: { type: String, enum: Object.values(UserRole), default: UserRole.UNASSIGNED },

  // Interviewee fields
  credits: { type: Number, default: 0 },
  currentPlan: { type: String, default: 'free' },
  creditsLastAllocatedAt: { type: Date },

  // Interviewer fields
  bio: { type: String },
  title: { type: String },
  company: { type: String },
  yearsExp: { type: Number },
  categories: [{ type: String, enum: Object.values(InterviewCategory) }],
  creditRate: { type: Number, default: 1 },
  creditBalance: { type: Number, default: 0 },
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model('User', UserSchema);

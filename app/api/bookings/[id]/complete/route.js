import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { verifyUser } from '@/lib/auth';
import Interviewer from '../../../../../lib/models/Interviewer';
import { Booking, BookingStatus } from '../../../../../lib/models/Booking';
import { Feedback, FeedbackRating } from '../../../../../lib/models/Feedback';
import { CreditTransaction, TransactionType } from '../../../../../lib/models/CreditTransaction';

export async function POST(req, { params }) {
  try {
    const resolvedParams = await params;
    const bookingId = resolvedParams?.id;

    const { user } = await verifyUser(); 
    await dbConnect();

    const body = await req.json();
    const { summary, technical, communication, problemSolving, recommendation, strengths, improvements, overallRating, score } = body || {};

    if (!bookingId) return NextResponse.json({ error: 'Booking ID required' }, { status: 400 });

    const booking = await Booking.findById(bookingId);
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    const isFeedbackSubmission = !!(summary || technical || overallRating || score);
    const intervieweeId = booking.intervieweeId;
    const interviewerId = booking.interviewerId;

    let feedback = null;

    if (isFeedbackSubmission) {
      feedback = await Feedback.findOneAndUpdate(
        { bookingId: booking._id },
        {
          bookingId: booking._id,
          intervieweeId,
          interviewerId,
          summary: summary || 'Completed mock interview session.',
          technical: technical || 'Demonstrated solid technical understanding.',
          communication: communication || 'Clear and articulate communication.',
          problemSolving: problemSolving || 'Effective approach to problem solving.',
          recommendation: recommendation || 'Recommended for next steps.',
          strengths: Array.isArray(strengths) ? strengths : (strengths ? [strengths] : ['Strong communication', 'Problem solving']),
          improvements: Array.isArray(improvements) ? improvements : (improvements ? [improvements] : ['System design depth']),
          overallRating: overallRating || FeedbackRating.GOOD,
          score: score || 8,
        },
        { upsert: true, new: true }
      );
      booking.feedback = feedback._id;

      const earnExists = await CreditTransaction.findOne({
        bookingId: booking._id,
        type: TransactionType.BOOKING_EARNING,
      });

      if (!earnExists) {
        const creditsToEarn = booking.creditsCharged || 1;

        await Interviewer.findByIdAndUpdate(interviewerId, {
          $inc: { creditBalance: creditsToEarn, credits: creditsToEarn },
        });

        await CreditTransaction.create({
          userId: interviewerId,
          amount: creditsToEarn,
          type: TransactionType.BOOKING_EARNING,
          bookingId: booking._id,
        });

        console.log(
          `[complete-route] Credit earning transaction created (+${creditsToEarn} credits for interviewer ${interviewerId})`
        );
      }
    }

    if (booking.status !== BookingStatus.COMPLETED) {
      booking.status = BookingStatus.COMPLETED;
    }
    await booking.save();

    if (isFeedbackSubmission) {
      return NextResponse.json({
        success: true,
        message: 'Feedback submitted successfully! Credit reward transferred to interviewer.',
        booking,
        feedback,
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: true,
        message: 'Call completed. Credit reward will be transferred once feedback is submitted.',
        booking,
      }, { status: 200 });
    }
  }
  catch (err) {
    console.error("POST /api/bookings/[id]/complete error:", err);
    return NextResponse.json({ error: err.message || 'Failed to complete interview session' }, { status: 500 });
  }
}
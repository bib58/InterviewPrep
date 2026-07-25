import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { verifyUser } from '@/lib/auth';
import Interviewer from '../../../../../lib/models/Interviewer';
import { Booking, BookingStatus } from '../../../../../lib/models/Booking';
import { Review } from '../../../../../lib/models/Review';

export async function POST(req, { params }) {
  try {
    const resolvedParams = await params;
    const bookingId = resolvedParams?.id;

    const { user } = await verifyUser();
    await dbConnect();

    const body = await req.json();
    const { rating, reviewText } = body || {};

    if (!rating || !reviewText) {
      return NextResponse.json({ error: 'Rating and review text are required' }, { status: 400 });
    }

    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: 'Rating must be a number between 1 and 5' }, { status: 400 });
    }

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Ensure the user submitting is the interviewee of the booking
    if (booking.intervieweeId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Unauthorized: Only the interviewee can review this session' }, { status: 403 });
    }

    // Ensure the booking status is COMPLETED or it is a past/expired scheduled session
    const isCompleted = booking.status === BookingStatus.COMPLETED;
    const isExpiredScheduled = booking.status === BookingStatus.SCHEDULED && new Date(booking.endTime).getTime() < Date.now();
    if (!isCompleted && !isExpiredScheduled) {
      return NextResponse.json({ error: 'Reviews can only be submitted for completed or past/expired sessions' }, { status: 400 });
    }

    // Check if review already exists
    if (booking.review) {
      return NextResponse.json({ error: 'You have already reviewed this session' }, { status: 400 });
    }

    // Create the Review
    const review = await Review.create({
      bookingId: booking._id,
      intervieweeId: user._id,
      interviewerId: booking.interviewerId,
      rating: ratingNum,
      reviewText: reviewText,
    });

    // Link review in Booking
    booking.review = review._id;
    await booking.save();

    // Add review reference to Interviewer
    await Interviewer.findByIdAndUpdate(booking.interviewerId, {
      $push: { reviews: review._id }
    });

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully',
      review
    }, { status: 201 });

  } catch (err) {
    console.error("POST /api/bookings/[id]/review error:", err);
    return NextResponse.json({ error: err.message || 'Failed to submit review' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { verifyUser } from '@/lib/auth';
import User from '@/lib/models/User';
import Interviewer from '@/lib/models/Interviewer';
import { Booking, BookingStatus } from '../../../lib/models/Booking';
import { Feedback } from '../../../lib/models/Feedback';
import { Review } from '../../../lib/models/Review';
import { CreditTransaction, TransactionType } from '../../../lib/models/CreditTransaction';
import { StreamClient } from '@stream-io/node-sdk';

export async function GET() {
  try {
    const { user } = await verifyUser();
    await dbConnect();

    let bookings = [];
    const isInterviewer = user.role === 'user-interviewer';

    if (isInterviewer) {
      bookings = await Booking.find({ interviewerId: user._id })
        .populate('intervieweeId', 'firstName emailId phoneNumber')
        .sort({ startTime: -1 })
        .lean();
    } else {
      bookings = await Booking.find({ intervieweeId: user._id })
        .populate('interviewerId', 'firstName emailId title company yearsExp categories bio')
        .sort({ startTime: -1 })
        .lean();
    }

    // Attach Feedback & Review if exist
    const bookingIds = bookings.map(b => b._id);
    const [feedbacks, reviews] = await Promise.all([
      Feedback.find({ bookingId: { $in: bookingIds } }).lean(),
      Review.find({ bookingId: { $in: bookingIds } }).lean(),
    ]);

    const feedbackMap = {};
    feedbacks.forEach(f => {
      feedbackMap[f.bookingId.toString()] = f;
    });

    const reviewMap = {};
    reviews.forEach(r => {
      reviewMap[r.bookingId.toString()] = r;
    });

    const enrichedBookings = bookings.map(b => ({
      ...b,
      feedback: feedbackMap[b._id.toString()] || null,
      review: reviewMap[b._id.toString()] || null,
    }));

    return NextResponse.json({ bookings: enrichedBookings }, { status: 200 });
  } catch (err) {
    console.error("GET /api/bookings error:", err);
    const isAuthError = err.message === 'Token is not present' || err.message === 'Invalid token' || err.message === "User Doesn't Exist";
    return NextResponse.json({ error: err.message || 'Failed to fetch bookings' }, { status: isAuthError ? 401 : 500 });
  }
}

export async function POST(req) {
  try {
    const { user } = await verifyUser();
    await dbConnect();

    const body = await req.json();
    const { interviewerId, startTime, endTime, topic, meetingLink, slotId } = body || {};

    if (!interviewerId || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required booking fields (interviewerId, startTime, endTime)' }, { status: 400 });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    // Verify interviewee credits
    const dbUser = await User.findById(user._id);
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if ((dbUser.credits || 0) < 1) {
      return NextResponse.json({ error: 'Insufficient credits. Please purchase at least 1 credit to book an interview.' }, { status: 400 });
    }

    // Verify interviewer exists
    const interviewer = await Interviewer.findById(interviewerId);
    if (!interviewer) {
      return NextResponse.json({ error: 'Interviewer not found' }, { status: 404 });
    }

    // Check if slot is already booked
    const existingBooking = await Booking.findOne({
      interviewerId,
      startTime: start,
      status: BookingStatus.SCHEDULED,
    });

    if (existingBooking) {
      return NextResponse.json({ error: 'This time slot has already been booked by another user.' }, { status: 409 });
    }

    // Create stream call
    let streamCallId;
    try {
      const streamClient = new StreamClient(
        process.env.STREAM_API_KEY,
        process.env.STREAM_API_SECRET
      );

      await streamClient.upsertUsers([
        {
          id: dbUser._id.toString(),
          name: dbUser.firstName ?? "Interviewee",
          role: "user",
        },
        {
          id: interviewerId.toString(),
          name: interviewer.firstName ?? "Interviewer",
          role: "user",
        }
      ]);
  
      const generatedCallId = `interview-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const call = streamClient.video.call("default", generatedCallId);
      await call.getOrCreate(
        {
          data:{
            created_by_id: dbUser._id,
            members:[
              {user_id: dbUser._id, role: "host"},
              {user_id: interviewerId, role: "host"}
            ],
            settings_override:{
              recording: {
                mode:"available", quality: "1080p"
              },
              screenSharing:{
                enabled:true,
              }
            }
          },
        },
      );
      streamCallId = generatedCallId;
    }
    catch (err) {
      console.log("Stream call creation failed:", err);
      throw new Error("Failed to create stream call");
    }

    const booking = await Booking.create({
      intervieweeId: user._id,
      interviewerId: interviewerId,
      startTime: start,
      endTime: end,
      topic: topic || 'Mock Interview Call',
      streamCallId:streamCallId,
      status: BookingStatus.SCHEDULED,
      creditsCharged: 1,
    });

    dbUser.credits = Math.max(0, (dbUser.credits || 0) - 1);
    await dbUser.save();

    await CreditTransaction.create({
      userId: user._id,
      amount: -1,
      type: TransactionType.BOOKING_DEDUCTION,
      bookingId: booking._id,
    });

    // Mark matching availability slot as BOOKED in Interviewer model schema
    if (slotId && interviewer.availableSlots) {
      const targetSlot = interviewer.availableSlots.id(slotId);
      if (targetSlot) {
        targetSlot.isBooked = true;
        await interviewer.save();
      } else {
        await Interviewer.updateOne(
          { _id: interviewerId, "availableSlots.startTime": start },
          { $set: { "availableSlots.$.isBooked": true } }
        );
      }
    } else {
      await Interviewer.updateOne(
        { _id: interviewerId, "availableSlots.startTime": start },
        { $set: { "availableSlots.$.isBooked": true } }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Interview call booked successfully',
      booking,
      credits: dbUser.credits,
    }, { status: 201 });
  } catch (err) {
    console.error("POST /api/bookings error:", err);
    const isAuthError = err.message === 'Token is not present' || err.message === 'Invalid token' || err.message === "User Doesn't Exist";
    return NextResponse.json({ error: err.message || 'Failed to create booking' }, { status: isAuthError ? 401 : 500 });
  }
}


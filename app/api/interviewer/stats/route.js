import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { verifyUser } from '@/lib/auth';
import Interviewer from '@/lib/models/Interviewer';
import { Booking, BookingStatus } from '@/lib/models/Booking';

export async function GET() {
  try {
    const { user } = await verifyUser();
    await dbConnect();

    const interviewer = await Interviewer.findById(user._id).lean();
    if (!interviewer) {
      return NextResponse.json({ error: "Interviewer not found" }, { status: 404 });
    }

    const completedBookings = await Booking.find({
      interviewerId: user._id,
      status: BookingStatus.COMPLETED,
    }).lean();

    const totalEarned = completedBookings.reduce(
      (sum, b) => sum + (b.creditsCharged || 1),
      0
    );

    return NextResponse.json({
      creditBalance: interviewer.creditBalance || interviewer.credits || 0,
      creditRate: interviewer.creditRate || 1,
      totalEarned,
      completedSessions: completedBookings.length,
      upiId: interviewer.upiId || "",
    }, { status: 200 });
  } catch (error) {
    console.error("GET /api/interviewer/stats error:", error);
    const isAuthError = error.message === 'Token is not present' || error.message === 'Invalid token' || error.message === "User Doesn't Exist";
    return NextResponse.json({ error: error.message || "Failed to fetch stats" }, { status: isAuthError ? 401 : 500 });
  }
}

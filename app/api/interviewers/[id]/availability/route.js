import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/db';
import Interviewer from '../../../../../lib/models/Interviewer';
import { Booking, BookingStatus } from '../../../../../lib/models/Booking';

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id)
      return NextResponse.json({ error: "Interviewer ID is required" }, { status: 400 });

    const now = new Date();

    await Interviewer.updateOne(
      { _id: id },
      { $pull: { availableSlots: { endTime: { $lt: now } } } }
    );

    const interviewer = await Interviewer.findById(id).lean();
    if (!interviewer) {
      return NextResponse.json({ error: "Interviewer not found" }, { status: 404 });
    }

    const bookings = await Booking.find({
      interviewerId: id,
      status: BookingStatus.SCHEDULED,
      startTime: { $gte: now },
    }).lean();

    const bookedTimeMap = new Set(
      bookings.map((b) => new Date(b.startTime).toISOString())
    );

    const embeddedSlots = interviewer.availableSlots || [];

    const availableSlots = embeddedSlots
      .filter((slot) => {
        if (slot.isBooked) return false;
        const slotTime = new Date(slot.startTime);
        if (slotTime < now) return false;
        return !bookedTimeMap.has(slotTime.toISOString());
      })
      .map((slot) => ({
        id: slot._id ? slot._id.toString() : slot.id,
        _id: slot._id ? slot._id.toString() : slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isBooked: false,
        status: "AVAILABLE",
      }));

    return NextResponse.json({ slots: availableSlots }, { status: 200 });
  } catch (error) {
    console.error("Error fetching interviewer availability:", error);
    return NextResponse.json({ error: "Failed to fetch interviewer availability" }, { status: 500 });
  }
}

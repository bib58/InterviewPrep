import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import { verifyUser } from '../../../../lib/auth';
import Interviewer from '../../../../lib/models/Interviewer';

export async function GET() {
  try {
    const { user } = await verifyUser();
    await dbConnect();

    const now = new Date();
    await Interviewer.updateOne(
      { _id: user._id },
      { $pull: { availableSlots: { endTime: { $lt: now } } } }
    );

    const interviewer = await Interviewer.findById(user._id).lean();
    if (!interviewer) {
      return NextResponse.json({ error: "Interviewer not found" }, { status: 404 });
    }

    const slots = (interviewer.availableSlots || []).map((slot) => ({
      id: slot._id.toString(),
      _id: slot._id.toString(),
      startTime: slot.startTime,
      endTime: slot.endTime,
      isBooked: slot.isBooked || false,
      status: slot.isBooked ? "BOOKED" : "AVAILABLE",
    }));

    return NextResponse.json({ slots }, { status: 200 });
  } 
  catch (error) {
    console.error("GET /api/interviewer/availability error:", error);
    const isAuthError = error.message === 'Token is not present' || error.message === 'Invalid token' || error.message === "User Doesn't Exist";
    return NextResponse.json({ error: error.message || "Failed to fetch availability" }, { status: isAuthError ? 401 : 500 });
  }
}

export async function POST(req) {
  try {
    const { user } = await verifyUser();
    await dbConnect();

    const body = await req.json();
    const { startTime, endTime } = body || {};

    if (!startTime || !endTime) {
      return NextResponse.json({ error: "Start and end time required" }, { status: 400 });
    }

    if (new Date(startTime) >= new Date(endTime)) {
      return NextResponse.json({ error: "Start time must be before end time" }, { status: 400 });
    }

    const interviewer = await Interviewer.findById(user._id);
    if (!interviewer) {
      return NextResponse.json({ error: "Interviewer not found" }, { status: 404 });
    }

    const now = new Date();
    interviewer.availableSlots = interviewer.availableSlots.filter(
      (slot) => new Date(slot.endTime) >= now
    );

    const newSlot = {
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      isBooked: false,
    };

    interviewer.availableSlots.push(newSlot);
    await interviewer.save();

    const formattedSlots = interviewer.availableSlots.map((slot) => ({
      id: slot._id.toString(),
      _id: slot._id.toString(),
      startTime: slot.startTime,
      endTime: slot.endTime,
      isBooked: slot.isBooked || false,
      status: slot.isBooked ? "BOOKED" : "AVAILABLE",
    }));

    return NextResponse.json({
      success: true,
      message: "Availability slot added successfully",
      slots: formattedSlots,
    }, { status: 201 });
  } 
  catch (error) {
    console.error("POST /api/interviewer/availability error:", error);
    const isAuthError = error.message === 'Token is not present' || error.message === 'Invalid token' || error.message === "User Doesn't Exist";
    return NextResponse.json({ error: error.message || "Failed to add availability slot" }, { status: isAuthError ? 401 : 500 });
  }
}

export async function DELETE(req) {
  try {
    const { user } = await verifyUser();
    await dbConnect();

    const { searchParams } = new URL(req.url);
    let slotId = searchParams.get("slotId");

    if (!slotId) {
      const body = await req.json().catch(() => ({}));
      slotId = body.slotId;
    }

    if (!slotId) {
      return NextResponse.json({ error: "Slot ID is required" }, { status: 400 });
    }

    const interviewer = await Interviewer.findById(user._id);
    if (!interviewer) {
      return NextResponse.json({ error: "Interviewer not found" }, { status: 404 });
    }

    const now = new Date();
    interviewer.availableSlots = interviewer.availableSlots.filter(
      (slot) => slot._id.toString() !== slotId && new Date(slot.endTime) >= now
    );

    await interviewer.save();

    const formattedSlots = interviewer.availableSlots.map((slot) => ({
      id: slot._id.toString(),
      _id: slot._id.toString(),
      startTime: slot.startTime,
      endTime: slot.endTime,
      isBooked: slot.isBooked || false,
      status: slot.isBooked ? "BOOKED" : "AVAILABLE",
    }));

    return NextResponse.json({
      success: true,
      message: "Availability slot deleted successfully",
      slots: formattedSlots,
    }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/interviewer/availability error:", error);
    const isAuthError = error.message === 'Token is not present' || error.message === 'Invalid token' || error.message === "User Doesn't Exist";
    return NextResponse.json({ error: error.message || "Failed to delete availability slot" }, { status: isAuthError ? 401 : 500 });
  }
}
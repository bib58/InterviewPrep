"use server";

import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { WithdrawalRequestEmail } from '../components/WithdrawalRequestEmail';

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_MAIL;


// ─── AVAILABILITY ─────────────────────────────────────────────────────────────

import dbConnect from "@/lib/db";
import { verifyUser } from "@/lib/auth";
import { Availability, AvailabilityStatus } from "@/lib/models/Availability";
import { Booking, BookingStatus } from "@/lib/models/Booking";

export const setAvailability = async ({ startTime, endTime }) => {
  try {
    const { user } = await verifyUser();
    await dbConnect();

    if (!startTime || !endTime) throw new Error("Start and end time required");
    if (new Date(startTime) >= new Date(endTime))
      throw new Error("Start time must be before end time");

    // Check for exact existing slot to prevent duplicates
    const existing = await Availability.findOne({
      interviewerId: user._id,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
    });

    if (!existing) {
      await Availability.create({
        interviewerId: user._id,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: AvailabilityStatus.AVAILABLE,
      });
    }

    revalidatePath("/dashboard/interviewer");
    return { success: true };
  } catch (err) {
    console.error("setAvailability error:", err);
    throw new Error(err.message || "Failed to save availability");
  }
};

export const getAvailability = async () => {
  try {
    const { user } = await verifyUser();
    await dbConnect();

    const slots = await Availability.find({
      interviewerId: user._id,
      startTime: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    })
      .sort({ startTime: 1 })
      .lean();

    return slots.map((s) => ({ ...s, id: s._id.toString() }));
  } catch (err) {
    console.error("getAvailability error:", err);
    return [];
  }
};

export const deleteAvailabilitySlot = async (slotId) => {
  try {
    const { user } = await verifyUser();
    await dbConnect();

    await Availability.deleteOne({
      _id: slotId,
      interviewerId: user._id,
    });

    revalidatePath("/dashboard/interviewer");
    return { success: true };
  } catch (err) {
    console.error("deleteAvailabilitySlot error:", err);
    throw new Error(err.message || "Failed to delete slot");
  }
};


// ─── APPOINTMENTS ─────────────────────────────────────────────────────────────

export const getInterviewerAppointments = async () => {
  try {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const dbUser = await db.user.findUnique({ where: { clerkUserId: user.id } });
    if (!dbUser) throw new Error("User not found");

    return await db.booking.findMany({
      where: { interviewerId: dbUser.id },
      include: {
        interviewee: { select: { name: true, imageUrl: true, email: true } },
        feedback: true,
      },
      orderBy: { startTime: "desc" },
    });
  } catch (err) {
    console.error("getInterviewerAppointments error:", err);
    return [];
  }
};

// ─── EARNINGS / WITHDRAWAL ────────────────────────────────────────────────────

export const getInterviewerStats = async () => {
  try {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const dbUser = await db.user.findUnique({
      where: { clerkUserId: user.id },
      select: {
        creditBalance: true,
        creditRate: true,
        bookingsAsInterviewer: {
          where: { status: "COMPLETED" },
          select: { creditsCharged: true },
        },
      },
    });
    if (!dbUser) throw new Error("User not found");

    const totalEarned = (dbUser.bookingsAsInterviewer || []).reduce(
      (sum, b) => sum + (b.creditsCharged || 0),
      0
    );

    return {
      creditBalance: dbUser.creditBalance || 0,
      creditRate: dbUser.creditRate || 0,
      totalEarned,
      completedSessions: (dbUser.bookingsAsInterviewer || []).length,
    };
  } catch (err) {
    console.error("getInterviewerStats error:", err);
    return {
      creditBalance: 0,
      creditRate: 0,
      totalEarned: 0,
      completedSessions: 0,
    };
  }
};

// Assignment
export const requestWithdrawal = async ({
  credits,
  paymentMethod,
  paymentDetail,
}) => {
  try {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    if (request) {
      const req = await request();
    }

    const dbUser = await db.user.findUnique({ where: { clerkUserId: user.id } });
    if (!dbUser || dbUser.role !== "INTERVIEWER") throw new Error("Forbidden");

    if (!credits || credits <= 0) throw new Error("Invalid credit amount");
    if (credits > dbUser.creditBalance)
      throw new Error("Insufficient credit balance");
    if (!paymentMethod || !paymentDetail)
      throw new Error("Payment details required");

    const PLATFORM_FEE = 0.2;
    const netAmount = credits * (1 - PLATFORM_FEE) * 5;
    const platformFee = credits * PLATFORM_FEE * 5;

    const [payout] = await db.$transaction([
      db.payout.create({
        data: {
          interviewerId: dbUser.id,
          credits,
          platformFee,
          netAmount,
          paymentMethod,
          paymentDetail,
          status: "PROCESSING",
        },
      }),
      db.user.update({
        where: { id: dbUser.id },
        data: { creditBalance: { decrement: credits } },
      }),
    ]);

    // Fire admin email — non-blocking, failure won't affect the user
    try {
      if (WithdrawalRequestEmail) {
        const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payout/${payout.id}`;
        const html = WithdrawalRequestEmail({
          interviewerName: dbUser.name ?? "Unknown",
          interviewerEmail: dbUser.email,
          credits,
          platformFee,
          netAmount,
          paymentMethod,
          paymentDetail,
          reviewUrl,
        });
        await resend.emails.send({
          from: "InterviewPrep<onboarding@resend.dev>",
          to: ADMIN_EMAIL,
          subject: `Withdrawal Request — ${dbUser.name} · ${credits} credits`,
          html,
        });
      }
    } catch (emailErr) {
      console.error("Withdrawal email failed:", emailErr);
    }

    revalidatePath("/dashboard");
    return { success: true, netAmount };
  } catch (err) {
    console.error("requestWithdrawal error:", err);
    throw new Error(err.message || "Withdrawal request failed");
  }
};

export const getWithdrawalHistory = async () => {
  try {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const dbUser = await db.user.findUnique({ where: { clerkUserId: user.id } });
    if (!dbUser) throw new Error("User not found");

    return await db.payout.findMany({
      where: { interviewerId: dbUser.id },
      orderBy: { createdAt: "desc" },
    });
  } catch (err) {
    console.error("getWithdrawalHistory error:", err);
    return [];
  }
};

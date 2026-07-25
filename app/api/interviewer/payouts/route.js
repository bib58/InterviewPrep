import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { verifyUser } from '@/lib/auth';
import Interviewer from '@/lib/models/Interviewer';
import { Payout } from '@/lib/models/Payout';
import { WithdrawalRequestEmail } from '@/components/WithdrawalRequestEmail';
import { Resend } from 'resend';


export async function GET() {
  try {
    const { user } = await verifyUser();
    await dbConnect();

    const payouts = await Payout.find({ interviewerId: user._id })
      .sort({ createdAt: -1 })
      .lean();

    const formatted = payouts.map((p) => ({
      id: p._id.toString(),
      _id: p._id.toString(),
      createdAt: p.createdAt,
      credits: p.credits,
      platformFee: p.platformFee,
      netAmount: p.netAmount,
      paymentMethod: p.paymentMethod,
      paymentDetail: p.paymentDetail,
      status: p.status,
    }));

    return NextResponse.json({ withdrawals: formatted }, { status: 200 });
  } catch (error) {
    console.error("GET /api/interviewer/payouts error:", error);
    const isAuthError = error.message === 'Token is not present' || error.message === 'Invalid token' || error.message === "User Doesn't Exist";
    return NextResponse.json({ error: error.message || "Failed to fetch payouts" }, { status: isAuthError ? 401 : 500 });
  }
}

export async function POST(req) {
  try {
    const { user } = await verifyUser();
    await dbConnect();

    const body = await req.json();
    const { credits, paymentMethod, paymentDetail } = body || {};
    const creditNum = Number(credits);

    if (!creditNum || creditNum <= 0) {
      return NextResponse.json({ error: "Invalid credit amount" }, { status: 400 });
    }

    if (!paymentMethod || !paymentDetail) {
      return NextResponse.json({ error: "Payment method and details required" }, { status: 400 });
    }

    const interviewer = await Interviewer.findById(user._id);
    if (!interviewer) {
      return NextResponse.json({ error: "Interviewer not found" }, { status: 404 });
    }

    const currentBalance = interviewer.creditBalance || interviewer.credits || 0;
    if (creditNum > currentBalance) {
      return NextResponse.json({ error: "Insufficient credit balance" }, { status: 400 });
    }

    const PLATFORM_FEE_RATE = 0.2;
    const netAmount = creditNum * (1 - PLATFORM_FEE_RATE) * 5;
    const platformFee = creditNum * PLATFORM_FEE_RATE * 5;

    // Deduct credit balance
    interviewer.creditBalance = Math.max(0, currentBalance - creditNum);
    if (typeof interviewer.credits === 'number') {
      interviewer.credits = Math.max(0, interviewer.credits - creditNum);
    }
    await interviewer.save();

    const payout = await Payout.create({
      interviewerId: user._id,
      credits: creditNum,
      platformFee,
      netAmount,
      paymentMethod,
      paymentDetail,
      status: 'PROCESSING',
    });

    // Send email to admin
    try {
      if (!process.env.RESEND_API_KEY) {
        throw new Error("RESEND_API_KEY is not defined in the environment variables. Please add it to your Vercel project settings.");
      }
      if (!process.env.ADMIN_MAIL) {
        throw new Error("ADMIN_MAIL is not defined in the environment variables. Please add it to your Vercel project settings.");
      }

      const resend = new Resend(process.env.RESEND_API_KEY);
      const adminEmail = process.env.ADMIN_MAIL;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL;
      const reviewUrl = `${appUrl.replace(/\/$/, '')}/payout/${payout._id}`;

      const html = WithdrawalRequestEmail({
        interviewerName: interviewer.firstName ?? "Interviewer",
        interviewerEmail: interviewer.emailId || interviewer.email || "",
        credits: creditNum,
        platformFee,
        netAmount,
        paymentMethod,
        paymentDetail,
        reviewUrl,
      });

      await resend.emails.send({
        from: "InterviewPrep<onboarding@resend.dev>",
        to: adminEmail,
        subject: `New Payout Request - ${interviewer.firstName} · ${creditNum} credits`,
        html,
      });
      console.log(`[payout-request] Admin notification email sent to ${adminEmail}`);
    } catch (emailErr) {
      console.error("[payout-request] Failed to send email to admin:", emailErr.message || emailErr);
    }

    return NextResponse.json({
      success: true,
      message: "Withdrawal request submitted successfully",
      netAmount,
      withdrawal: {
        id: payout._id.toString(),
        _id: payout._id.toString(),
        createdAt: payout.createdAt,
        credits: creditNum,
        platformFee,
        netAmount,
        paymentMethod,
        paymentDetail,
        status: payout.status,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/interviewer/payouts error:", error);
    const isAuthError = error.message === 'Token is not present' || error.message === 'Invalid token' || error.message === "User Doesn't Exist";
    return NextResponse.json({ error: error.message || "Failed to submit withdrawal request" }, { status: isAuthError ? 401 : 500 });
  }
}

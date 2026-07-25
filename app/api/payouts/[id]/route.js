import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Payout } from '@/lib/models/Payout';
import Interviewer from '@/lib/models/Interviewer';
import User from '@/lib/models/User';

export async function GET(req, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    await dbConnect();

    const payout = await Payout.findById(id).lean();
    if (!payout) {
      return NextResponse.json({ error: 'Payout request not found' }, { status: 404 });
    }

    // Try to find the interviewer details
    let interviewer = await Interviewer.findById(payout.interviewerId).lean();
    if (!interviewer) {
      // Fallback to User collection if not found in Interviewer
      interviewer = await User.findById(payout.interviewerId).lean();
    }

    return NextResponse.json({
      success: true,
      payout,
      interviewer: interviewer ? {
        firstName: interviewer.firstName,
        emailId: interviewer.emailId || interviewer.email || '',
        phoneNumber: interviewer.phoneNumber || '',
        company: interviewer.company || '',
        title: interviewer.title || '',
      } : null
    }, { status: 200 });

  } catch (error) {
    console.error(`GET /api/payouts/[id] error:`, error);
    return NextResponse.json({ error: error.message || 'Failed to fetch payout details' }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    await dbConnect();

    const payout = await Payout.findById(id);
    if (!payout) {
      return NextResponse.json({ error: 'Payout request not found' }, { status: 404 });
    }

    if (payout.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Payout request is already completed' }, { status: 400 });
    }

    payout.status = 'COMPLETED';
    payout.processedAt = new Date();
    await payout.save();

    return NextResponse.json({
      success: true,
      message: 'Payout request successfully marked as completed',
      payout
    }, { status: 200 });

  } catch (error) {
    console.error(`POST /api/payouts/[id]/complete error:`, error);
    return NextResponse.json({ error: error.message || 'Failed to complete payout request' }, { status: 500 });
  }
}

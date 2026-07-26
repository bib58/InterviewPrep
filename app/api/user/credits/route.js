import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { verifyUser } from '@/lib/auth';
import User from '../../../../lib/models/User';
import Interviewer from '../../../../lib/models/Interviewer';
import { CreditTransaction, TransactionType } from '../../../../lib/models/CreditTransaction';

export async function GET() {
  try {
    const { user } = await verifyUser();
    await dbConnect();

    const transactions = await CreditTransaction.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    const currentCredits = typeof user.credits === 'number' ? user.credits : (user.creditBalance || 0);

    return NextResponse.json({
      credits: currentCredits,
      transactions,
    }, { status: 200 });
  } catch (err) {
    console.error("GET /api/user/credits error:", err);
    return NextResponse.json({ error: err.message || 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req) {
  try {
    const { user } = await verifyUser();
    const body = await req.json();
    const amount = Number(body?.amount);

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid credit amount' }, { status: 400 });
    }

    await dbConnect();

    let updatedUser;
    if (user.role === 'user-interviewer') {
      updatedUser = await Interviewer.findByIdAndUpdate(
        user._id,
        { $inc: { creditBalance: amount, credits: amount } },
        { new: true }
      );
    } else {
      updatedUser = await User.findByIdAndUpdate(
        user._id,
        { $inc: { credits: amount } },
        { new: true }
      );
    }

    await CreditTransaction.create({
      userId: user._id,
      amount: amount,
      type: TransactionType.CREDIT_PURCHASE,
    });

    const newBalance = typeof updatedUser.credits === 'number' ? updatedUser.credits : (updatedUser.creditBalance || 0);

    return NextResponse.json({
      success: true,
      message: `Successfully added ${amount} credit(s)`,
      credits: newBalance,
    }, { status: 200 });
  } catch (err) {
    console.error("POST /api/user/credits error:", err);
    return NextResponse.json({ error: err.message || 'Failed to update credits' }, { status: 400 });
  }
}

import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { verifyUser } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import Interviewer from '@/lib/models/Interviewer';
import { CreditTransaction, TransactionType } from '@/lib/models/CreditTransaction';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { user } = await verifyUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    await dbConnect();

    // 1. Check if transaction has already been recorded (idempotency)
    const existingTx = await CreditTransaction.findOne({ stripeSessionId: sessionId });
    if (existingTx) {
      return NextResponse.json({ 
        success: true, 
        message: 'Credits already processed for this session.' 
      }, { status: 200 });
    }

    // 2. Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Stripe session not found' }, { status: 404 });
    }

    // 3. Verify session status and metadata
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment has not been completed' }, { status: 400 });
    }

    const metadata = session.metadata;
    if (!metadata || metadata.appId !== 'ink') {
      return NextResponse.json({ error: 'Invalid app ID in session metadata' }, { status: 400 });
    }

    const { userId, credits } = metadata;
    if (userId !== user._id.toString()) {
      return NextResponse.json({ error: 'User ID mismatch' }, { status: 400 });
    }

    const amount = Number(credits);
    if (!amount || isNaN(amount)) {
      return NextResponse.json({ error: 'Invalid credits amount in session' }, { status: 400 });
    }

    // 4. Update user credits (Standard User or Interviewer)
    let targetUser = await User.findById(userId);
    let newBalance;
    if (targetUser) {
      targetUser.credits = (targetUser.credits || 0) + amount;
      await targetUser.save();
      newBalance = targetUser.credits;
    } else {
      targetUser = await Interviewer.findById(userId);
      if (targetUser) {
        targetUser.credits = (targetUser.credits || 0) + amount;
        targetUser.creditBalance = (targetUser.creditBalance || 0) + amount;
        await targetUser.save();
        newBalance = targetUser.creditBalance;
      } else {
        return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
      }
    }

    // 5. Record transaction
    await CreditTransaction.create({
      userId: userId,
      amount: amount,
      type: TransactionType.CREDIT_PURCHASE,
      stripeSessionId: sessionId,
    });

    console.log(`Successfully verified and credited ${amount} credits to user ID: ${userId} via redirect check`);

    return NextResponse.json({ 
      success: true, 
      message: 'Credits updated successfully', 
      credits: newBalance 
    }, { status: 200 });

  } catch (error) {
    console.error('Error verifying Stripe checkout session:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import Interviewer from '@/lib/models/Interviewer';
import { CreditTransaction, TransactionType } from '@/lib/models/CreditTransaction';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const payload = await req.text();
    const sig = req.headers.get('stripe-signature');
    let event;

    try {
      event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const metadata = session.metadata;

      if (!metadata || metadata.appId !== 'ink') {
        return NextResponse.json({ received: true, message: 'Ignored or invalid app ID' });
      }

      const { userId, credits } = metadata;
      const amount = Number(credits);

      if (!userId || !amount || isNaN(amount)) {
        return NextResponse.json({ received: false, error: 'Invalid session metadata' }, { status: 400 });
      }

      await dbConnect();

      // Check if already processed to prevent duplicate processing (idempotency)
      const existingTx = await CreditTransaction.findOne({ stripeSessionId: session.id });
      if (existingTx) {
        console.log(`Credits already processed for Stripe session: ${session.id}`);
        return NextResponse.json({ received: true, message: 'Already processed' });
      }

      // Find if standard user or interviewer
      let targetUser = await User.findById(userId);
      if (targetUser) {
        targetUser.credits = (targetUser.credits || 0) + amount;
        await targetUser.save();
      } else {
        targetUser = await Interviewer.findById(userId);
        if (targetUser) {
          targetUser.credits = (targetUser.credits || 0) + amount;
          targetUser.creditBalance = (targetUser.creditBalance || 0) + amount;
          await targetUser.save();
        } else {
          console.error(`User or Interviewer with ID ${userId} not found in database.`);
          return NextResponse.json({ received: false, error: 'User not found' }, { status: 404 });
        }
      }

      // Record credit purchase transaction
      await CreditTransaction.create({
        userId: userId,
        amount: amount,
        type: TransactionType.CREDIT_PURCHASE,
        stripeSessionId: session.id,
      });

      console.log(`Successfully credited ${amount} session credits to user ID: ${userId}`);
      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Error handling Stripe webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

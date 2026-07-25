import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { verifyUser } from '@/lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PLAN_PRICES = {
  1: 10,  // 1 Credit = $10
  3: 25,  // 3 Credits = $25
  5: 40   // 5 Credits = $40
};

export async function POST(req) {
  try {
    const { user } = await verifyUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const amount = Number(body?.amount);

    if (!amount || !PLAN_PRICES[amount]) {
      return NextResponse.json({ error: 'Invalid credit package selected' }, { status: 400 });
    }

    const origin = req.headers.get('origin') || `${req.headers.get('x-forwarded-proto') || 'http'}://${req.headers.get('host')}`;
    const priceInCents = PLAN_PRICES[amount] * 100;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${amount} Mock Interview Credit${amount > 1 ? 's' : ''}`,
              description: `Top-up package for ${amount} mock interview session${amount > 1 ? 's' : ''}. Credits do not expire.`,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/dashboard/interviewee?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/interviewee?cancelled=true`,
      metadata: {
        userId: user._id.toString(),
        credits: amount.toString(),
        appId: 'ink',
      },
    });

    return NextResponse.json({ success: true, url: session.url }, { status: 200 });
  } catch (error) {
    console.error('Error creating Stripe Checkout Session:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

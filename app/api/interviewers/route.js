import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/db';
import Interviewer from '../../../lib/models/Interviewer';

export async function GET() {
  try {
    await dbConnect();

    const now = new Date();
    await Interviewer.updateMany(
      {},
      { $pull: { availableSlots: { endTime: { $lt: now } } } }
    );

    const interviewers = await Interviewer.find({}).populate('reviews').lean();

    const enriched = (interviewers || []).map(i => {
      const reviewsList = i.reviews || [];
      const avg = reviewsList.length > 0
        ? (reviewsList.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewsList.length).toFixed(1)
        : 0;
      return {
        ...i,
        averageRating: Number(avg),
        reviewCount: reviewsList.length
      };
    });

    return NextResponse.json({ interviewers: enriched }, { status: 200 });
  }
  catch (error) {
    console.error("Error fetching interviewers:", error);
    return NextResponse.json({ error: "Failed to fetch interviewers" }, { status: 500 });
  }
}

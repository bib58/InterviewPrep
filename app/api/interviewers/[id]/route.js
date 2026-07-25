import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import Interviewer from '../../../../lib/models/Interviewer';
import Review from '../../../../lib/models/Review';
import User from '../../../../lib/models/User';

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    const interviewer = await Interviewer.findById(id)
      .populate({
        path: 'reviews',
        populate: {
          path: 'intervieweeId',
          model: 'User',
          select: 'firstName lastName emailId'
        }
      })
      .lean();
    
    if (!interviewer) {
      return NextResponse.json({ error: "Interviewer not found" }, { status: 404 });
    }

    const reviewsList = interviewer.reviews || [];
    const avg = reviewsList.length > 0
      ? (reviewsList.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewsList.length).toFixed(1)
      : 0;
    interviewer.averageRating = Number(avg);
    interviewer.reviewCount = reviewsList.length;
    
    return NextResponse.json({ interviewer }, { status: 200 });
  } catch (error) {
    console.error("Error fetching interviewer:", error);
    return NextResponse.json(
      { error: "Failed to fetch interviewer" },
      { status: 500 }
    );
  }
}

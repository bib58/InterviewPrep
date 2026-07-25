import { NextResponse } from 'next/server';
import { verifyUser } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

export async function DELETE() {
  try {
    const { user } = await verifyUser();

    await dbConnect();
    await User.findByIdAndDelete(user._id);

    const response = NextResponse.json(
      { message: 'Profile Deleted Successfully' },
      { status: 200 }
    );

    response.cookies.delete('token');

    return response;
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { verifyUser } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

export async function PUT(req) {
  try {
    const { user: authUser } = await verifyUser();
    const body = await req.json();
    
    const { firstName } = body;

    if (!firstName) {
      return NextResponse.json(
        { error: 'First name is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const updatedUser = await User.findByIdAndUpdate(
      authUser._id,
      { firstName },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const reply = {
      firstName: updatedUser.firstName,
      emailId: updatedUser.emailId,
      phoneNumber: updatedUser.phoneNumber,
      _id: updatedUser._id,
      role: updatedUser.role,
    };

    return NextResponse.json(
      { user: reply, message: 'Profile updated successfully' },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Failed to update profile' },
      { status: 400 }
    );
  }
}

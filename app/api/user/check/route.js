import { NextResponse } from 'next/server';
import { verifyUser } from '../../../../lib/auth';

export async function GET() {
  try {
    const { user } = await verifyUser();

    const reply = {
      firstName: user.firstName,
      emailId: user.emailId,
      phoneNumber: user.phoneNumber,
      _id: user._id,
      role: user.role,
      ...(user.role === 'user-interviewer' ? { upiId: user.upiId } : {}),
    };

    return NextResponse.json({ user: reply, message: 'Valid User' }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

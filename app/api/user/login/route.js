import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import Interviewer from '@/lib/models/Interviewer';

export async function POST(req) {
  try {
    const body = await req.json();
    const { emailId, password } = body || {};

    if (!emailId || !password) {
      return NextResponse.json({ error: 'Invalid Credentials' }, { status: 401 });
    }

    await dbConnect();
    let user = await User.findOne({ emailId });
    if (!user) {
      user = await Interviewer.findOne({ emailId });
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid Credentials' }, { status: 401 });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return NextResponse.json({ error: 'Invalid Credentials' }, { status: 401 });
    }

    const token = jwt.sign(
      { _id: user._id, emailId: user.emailId, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: '7d' }
    );

    const reply = {
      firstName: user.firstName,
      emailId: user.emailId,
      phoneNumber: user.phoneNumber,
      _id: user._id,
      role: user.role,
    };

    const response = NextResponse.json(
      { user: reply, token, message: 'Login Successfully' },
      { status: 200 }
    );

    response.cookies.set('token', token, {
      maxAge: 7 * 24 * 60 * 60,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Login failed' }, { status: 401 });
  }
}
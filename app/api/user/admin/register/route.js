import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import validate from '@/lib/validator';
import { verifyAdmin } from '@/lib/auth';

export async function POST(req) {
  try {
    // Require existing admin authentication to register new admin
    await verifyAdmin();

    const body = await req.json();
    validate(body);

    const { firstName, emailId, password } = body;

    await dbConnect();
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName,
      emailId,
      password: hashedPassword,
      role: 'admin',
    });

    const token = jwt.sign(
      { _id: user._id, emailId: user.emailId, role: 'admin' },
      process.env.JWT_KEY,
      { expiresIn: '1d' }
    );

    const response = NextResponse.json(
      { message: 'Admin Registered Successfully' },
      { status: 201 }
    );

    response.cookies.set('token', token, {
      maxAge: 24 * 60 * 60,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
    });

    return response;
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 400 }
    );
  }
}

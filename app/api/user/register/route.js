import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/db';
import User from '../../../../lib/models/User';
import Interviewer from '../../../../lib/models/Interviewer';

import { CreditTransaction, TransactionType } from '../../../../lib/models/CreditTransaction';

export async function POST(req) {
  try {
    const body = await req.json();
    const { firstName, emailId, password, phoneNumber, role, title, company, yearsExp, categories, bio, upiId } = body;

    await dbConnect();

    const existingUser = await User.findOne({ emailId });
    const existingInterviewer = await Interviewer.findOne({ emailId });
    if (existingUser || existingInterviewer) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userRole = (role && ['user-interviewer', 'user-interviewee'].includes(role))
      ? role
      : 'user-interviewee';

    let user;
    if (userRole === 'user-interviewer') {
      user = await Interviewer.create({
        firstName,
        emailId,
        password: hashedPassword,
        phoneNumber,
        role: userRole,
        title,
        company,
        yearsExp,
        categories,
        bio,
        upiId,
      });
    } else {
      user = await User.create({
        firstName,
        emailId,
        password: hashedPassword,
        phoneNumber,
        role: userRole,
        credits: 5,
      });

      await CreditTransaction.create({
        userId: user._id,
        amount: 5,
        type: TransactionType.WELCOME_BONUS,
      });
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
      { user: reply, token, message: 'Registered Successfully' },
      { status: 201 }
    );

    response.cookies.set('token', token, {
      maxAge: 7 * 24 * 60 * 60,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  }
  catch (err) {
    return NextResponse.json({ error: err.message || 'Registration failed' }, { status: 400 });
  }
}

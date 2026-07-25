import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from './db';
import User from './models/User';
import Interviewer from './models/Interviewer';
import { getRedisClient } from './redis';

export async function verifyUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    throw new Error('Token is not present');
  }

  const payload = jwt.verify(token, process.env.JWT_KEY);
  const { _id } = payload;

  if (!_id) {
    throw new Error('Invalid token');
  }

  await dbConnect();
  let user = await User.findById(_id);
  if (!user) {
    user = await Interviewer.findById(_id);
  }

  if (!user) {
    throw new Error("User Doesn't Exist");
  }

  try {
    const redis = await getRedisClient();
    const isBlocked = await redis.exists(`token:${token}`);
    if (isBlocked) {
      throw new Error('Invalid Token');
    }
  } catch (err) {
    if (err.message === 'Invalid Token') throw err;
    console.warn('Redis check warning (non-fatal):', err.message);
  }

  return { user, token, payload };
}

export async function verifyAdmin() {
  const { user, token, payload } = await verifyUser();

  if (payload.role !== 'admin' && user.role !== 'admin') {
    throw new Error('Invalid Token');
  }

  return { user, token, payload };
}

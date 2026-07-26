import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { getRedisClient } from '@/lib/redis';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    const response = NextResponse.json(
      { message: 'Logged Out Successfully' },
      { status: 200 }
    );

    response.cookies.delete('token');

    if (token) {
      const payload = jwt.decode(token);
      if (payload?.exp) {
        const redis = await getRedisClient();
        await redis.set(`token:${token}`, 'Blocked');
        await redis.expireAt(`token:${token}`, payload.exp);
      }
    }

    return response;
  } catch (err) {
    return NextResponse.json({ error: 'Error logging out: ' + err.message }, { status: 503 });
  }
}
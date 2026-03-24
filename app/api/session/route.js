import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies(); // await required in Next.js 15+
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ isAdmin: false });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded && decoded.isAdmin) {
      return NextResponse.json({ isAdmin: true, username: decoded.username });
    } else {
      return NextResponse.json({ isAdmin: false });
    }
  } catch (error) {
    // If token is invalid or expired, it's not an admin session
    return NextResponse.json({ isAdmin: false });
  }
}

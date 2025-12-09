import dbConnect from '../../../../lib/dbConnect';
import Code from '../../../../models/Code';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    // Manual Authentication Check
    const token = request.cookies.get('auth_token')?.value;
    if (!token) throw new Error('Auth token not found');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.isAdmin) throw new Error('User is not an admin');

    // Original Route Logic
    await dbConnect();
    const codes = await Code.find({});
    return NextResponse.json({ success: true, data: codes }, { status: 200 });

  } catch (error) {
    return new NextResponse(
      JSON.stringify({ success: false, message: `Authentication failed: ${error.message}` }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

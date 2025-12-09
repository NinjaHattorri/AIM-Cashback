import dbConnect from '../../../../lib/dbConnect';
import AdminUser from '../../../../models/AdminUser';
import jwt from 'jsonwebtoken';
import { setCookie } from 'cookies-next';
import { NextResponse } from 'next/server';

export async function POST(request) {
  await dbConnect();

  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, message: 'Please provide username and password.' }, { status: 400 });
    }

    const user = await AdminUser.findOne({ username: username.toLowerCase() }).select('+password');

    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid credentials.' }, { status: 401 });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return NextResponse.json({ success: false, message: 'Invalid credentials.' }, { status: 401 });
    }

    // If credentials are correct, create a JWT
    const token = jwt.sign(
      { isAdmin: true, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1d' } // Token expires in 1 day
    );

    const response = NextResponse.json({ success: true, message: 'Login successful.' });

    // Set the JWT in a secure, http-only cookie
    setCookie('auth_token', token, {
      req: request,
      res: response,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Admin Login Error:', error);
    return NextResponse.json({ success: false, message: 'Server error during admin login.' }, { status: 500 });
  }
}

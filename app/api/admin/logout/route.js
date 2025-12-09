import { deleteCookie } from 'cookies-next';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const response = NextResponse.json({ success: true, message: 'Logout successful.' });
    
    // Delete the auth token cookie
    deleteCookie('auth_token', {
      req: request,
      res: response,
    });

    return response;
  } catch (error) {
    console.error('Admin Logout Error:', error);
    return NextResponse.json({ success: false, message: 'Server error during admin logout.' }, { status: 500 });
  }
}

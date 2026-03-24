import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({ success: true, message: 'Logout successful.' });

    // Delete the auth token cookie using native Next.js App Router API
    response.cookies.delete('auth_token');

    return response;
  } catch (error) {
    console.error('Admin Logout Error:', error);
    return NextResponse.json({ success: false, message: 'Server error during admin logout.' }, { status: 500 });
  }
}

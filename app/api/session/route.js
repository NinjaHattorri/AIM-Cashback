import { getIronSession } from 'iron-session';
import { sessionOptions } from '../../../lib/session';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  // Use the headers from the incoming request object
  const header = request.headers.get('X-Internal-Middleware');
  if (header !== 'true') {
    return new NextResponse(JSON.stringify({ message: 'Forbidden' }), { status: 403 });
  }

  try {
    const session = await getIronSession(cookies(), sessionOptions);

    if (session.isAdmin) {
      return NextResponse.json({ isAdmin: true, username: session.username });
    } else {
      return NextResponse.json({ isAdmin: false });
    }
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ isAdmin: false });
  }
}

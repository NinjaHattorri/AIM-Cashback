import dbConnect from '../../../../lib/dbConnect';
import Code from '../../../../models/Code';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    // Manual Authentication Check
    const token = request.cookies.get('auth_token')?.value;
    if (!token) throw new Error('Auth token not found');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.isAdmin) throw new Error('User is not an admin');

    // Original Route Logic
    await dbConnect();
    const { codes, expiresAt } = await request.json();

    if (!codes || !Array.isArray(codes) || codes.length === 0) {
      return NextResponse.json({ success: false, message: 'An array of codes is required.' }, { status: 400 });
    }

    const codeDocuments = codes.map(code => {
        const doc = {
            code: code,
            status: 'generated',
        };
        if (expiresAt) {
            doc.expiresAt = new Date(expiresAt);
        }
        return doc;
    });

    let insertedCount = 0;
    let duplicateCount = 0;

    try {
        const result = await Code.insertMany(codeDocuments, { ordered: false });
        insertedCount = result.length;
    } catch (error) {
        if (error.code === 11000 && error.result) {
            insertedCount = error.result.nInserted;
            duplicateCount = codes.length - insertedCount;
        } else {
            throw error;
        }
    }

    return NextResponse.json({ 
        success: true, 
        message: `Processed codes. Inserted: ${insertedCount}, Duplicates skipped: ${duplicateCount}.`,
        insertedCount,
        duplicateCount,
    }, { status: 201 });

  } catch (error) {
    // Differentiate between auth error and other errors
    if (error.message.includes('Auth token') || error.message.includes('not an admin') || error.name === 'JsonWebTokenError') {
        return new NextResponse(
            JSON.stringify({ success: false, message: `Authentication failed: ${error.message}` }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
    }
    // Handle other potential errors
    console.error('Custom Code Import Error:', error);
    return NextResponse.json({ success: false, message: 'Server error during custom code import.' }, { status: 500 });
  }
}

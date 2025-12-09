import dbConnect from '../../../../lib/dbConnect';
import Code from '../../../../models/Code';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

function generateRandomCode(length = 8) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

export async function POST(request) {
  try {
    // Manual Authentication Check
    const token = request.cookies.get('auth_token')?.value;
    if (!token) throw new Error('Auth token not found');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.isAdmin) throw new Error('User is not an admin');

    // Original Route Logic
    await dbConnect();
    const { count, expiresAt } = await request.json();

    if (!count || count <= 0) {
      return NextResponse.json({ success: false, message: 'A valid code count is required.' }, { status: 400 });
    }

    if (count > 10000) {
        return NextResponse.json({ success: false, message: 'Cannot generate more than 10,000 codes at a time.' }, { status: 400 });
    }

    const newCodes = [];
    const generatedCodes = new Set();

    for (let i = 0; i < count; i++) {
        let newCode;
        do {
            newCode = generateRandomCode();
        } while (generatedCodes.has(newCode));
        
        generatedCodes.add(newCode);

        const codeDocument = {
            code: newCode,
            status: 'generated',
        };

        if (expiresAt) {
            codeDocument.expiresAt = new Date(expiresAt);
        }

        newCodes.push(codeDocument);
    }
    
    await Code.insertMany(newCodes);

    return NextResponse.json({ 
        success: true, 
        message: `Successfully generated and saved ${count} new codes.`,
        count: newCodes.length,
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
    console.error('Bulk Generate Error:', error);
    if (error.code === 11000) {
        return NextResponse.json({ success: false, message: 'A duplicate code was generated. Please try again.' }, { status: 500 });
    }
    return NextResponse.json({ success: false, message: 'Server error during bulk code generation.' }, { status: 500 });
  }
}


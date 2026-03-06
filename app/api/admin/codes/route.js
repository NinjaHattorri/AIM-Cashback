import dbConnect from '../../../../lib/dbConnect';
import Code from '../../../../models/Code';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// GET: Fetch all codes or search for specific ones
export async function GET(request) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) throw new Error('Auth token not found');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.isAdmin) throw new Error('User is not an admin');

    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    let filter = {};
    if (query) {
      filter = { code: { $regex: query, $options: 'i' } };
    }

    const codes = await Code.find(filter).sort({ generatedAt: -1 });
    return NextResponse.json({ success: true, data: codes }, { status: 200 });

  } catch (error) {
    return new NextResponse(
      JSON.stringify({ success: false, message: error.message }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// PATCH: Update a specific code
export async function PATCH(request) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) throw new Error('Auth token not found');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.isAdmin) throw new Error('User is not an admin');

    await dbConnect();
    const { id, status, cashbackAmount, expiresAt } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, message: 'Code ID is required.' }, { status: 400 });
    }

    const updatedCode = await Code.findByIdAndUpdate(
      id,
      { status, cashbackAmount, expiresAt },
      { new: true, runValidators: true }
    );

    if (!updatedCode) {
      return NextResponse.json({ success: false, message: 'Code not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedCode }, { status: 200 });

  } catch (error) {
    console.error('Update Code Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE: Remove a code
export async function DELETE(request) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) throw new Error('Auth token not found');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.isAdmin) throw new Error('User is not an admin');

    await dbConnect();
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, message: 'Code ID is required.' }, { status: 400 });
    }

    const deletedCode = await Code.findByIdAndDelete(id);

    if (!deletedCode) {
      return NextResponse.json({ success: false, message: 'Code not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Code deleted successfully.' }, { status: 200 });

  } catch (error) {
    console.error('Delete Code Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

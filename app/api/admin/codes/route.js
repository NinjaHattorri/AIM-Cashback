import dbConnect from '../../../../lib/dbConnect';
import Code from '../../../../models/Code';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Helper: check if an error is an auth failure
function isAuthError(error) {
  return (
    error.message?.includes('Auth token') ||
    error.message?.includes('not an admin') ||
    error.name === 'JsonWebTokenError' ||
    error.name === 'TokenExpiredError'
  );
}

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
    const status = searchParams.get('status');

    let filter = {};
    if (query) {
      filter.code = { $regex: query, $options: 'i' };
    }
    if (status && status !== 'all') {
      filter.status = status;
    }

    const codes = await Code.find(filter).sort({ generatedAt: -1 });
    return NextResponse.json({ success: true, data: codes }, { status: 200 });

  } catch (error) {
    if (isAuthError(error)) {
      return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    }
    console.error('Fetch Codes Error:', error);
    return NextResponse.json({ success: false, message: 'Server error fetching codes.' }, { status: 500 });
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

    // Build update object dynamically — only include fields that were actually sent
    const updateFields = {};
    if (status !== undefined) updateFields.status = status;
    if (cashbackAmount !== undefined) updateFields.cashbackAmount = cashbackAmount;
    if (expiresAt !== undefined) updateFields.expiresAt = expiresAt;

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ success: false, message: 'No fields provided to update.' }, { status: 400 });
    }

    const updatedCode = await Code.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedCode) {
      return NextResponse.json({ success: false, message: 'Code not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedCode }, { status: 200 });

  } catch (error) {
    if (isAuthError(error)) {
      return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    }
    console.error('Update Code Error:', error);
    return NextResponse.json({ success: false, message: 'Server error updating code.' }, { status: 500 });
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
    if (isAuthError(error)) {
      return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    }
    console.error('Delete Code Error:', error);
    return NextResponse.json({ success: false, message: 'Server error deleting code.' }, { status: 500 });
  }
}

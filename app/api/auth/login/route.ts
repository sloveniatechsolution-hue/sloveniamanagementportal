import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Operator } from '@/lib/models';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { role, email, operatorId, password } = await request.json();

    if (role === 'admin') {
      if (password === 'Slovenia@2026%$') {
        return NextResponse.json({
          success: true,
          user: { role: 'admin', id: 'admin', name: 'System Admin' },
        });
      }
      return NextResponse.json({ success: false, message: 'Invalid admin password' }, { status: 401 });
    }

    // Operator login
    const loginIdentifier = email || operatorId;
    if (!loginIdentifier) {
      return NextResponse.json({ success: false, message: 'Email address or Operator ID is required' }, { status: 400 });
    }

    // Attempt to search by email (case-insensitive) if it looks like an email, otherwise search by operator ID
    const isEmailFormat = loginIdentifier.includes('@');
    const query = isEmailFormat 
      ? { email: { $regex: new RegExp(`^${loginIdentifier.trim()}$`, 'i') } }
      : { id: loginIdentifier.trim() };

    const operator = await Operator.findOne(query);
    if (!operator) {
      return NextResponse.json({ 
        success: false, 
        message: isEmailFormat ? 'Invalid Email Address' : 'Invalid Operator ID' 
      }, { status: 404 });
    }

    if (operator.password !== password) {
      return NextResponse.json({ success: false, message: 'Invalid password' }, { status: 401 });
    }

    if (operator.status !== 'Active') {
      return NextResponse.json({ success: false, message: 'Your account is currently inactive.' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      user: { role: 'operator', id: operator.id, name: operator.name },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

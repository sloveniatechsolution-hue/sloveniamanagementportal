import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Operator } from '@/lib/models';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { role, operatorId, password } = await request.json();

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
    const operator = await Operator.findOne({ id: operatorId });
    if (!operator) {
      return NextResponse.json({ success: false, message: 'Invalid Operator ID' }, { status: 404 });
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

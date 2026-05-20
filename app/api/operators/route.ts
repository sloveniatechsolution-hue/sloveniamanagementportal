import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Operator } from '@/lib/models';

export async function GET() {
  try {
    await connectToDatabase();
    const operators = await Operator.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, operators });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const data = await request.json();

    // Check if operator with email already exists
    const existing = await Operator.findOne({ email: data.email });
    if (existing) {
      return NextResponse.json({ success: false, message: 'Email already registered' }, { status: 400 });
    }

    let generatedId = '';
    let isUnique = false;
    while (!isUnique) {
      generatedId = 'OP' + Math.floor(100 + Math.random() * 900); // 3 digit for admin manual add or math random
      const duplicate = await Operator.findOne({ id: generatedId });
      if (!duplicate) {
        isUnique = true;
      }
    }

    const newOperator = new Operator({
      id: generatedId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      joinDate: data.joinDate || new Date().toISOString().split('T')[0],
      status: data.status || 'Active',
      password: data.password || 'password123',
      agreementAccepted: false,
    });

    await newOperator.save();

    return NextResponse.json({ success: true, operator: newOperator });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

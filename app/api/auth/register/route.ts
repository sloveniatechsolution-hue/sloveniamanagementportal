import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Operator } from '@/lib/models';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { name, email, phone, password } = await request.json();

    // Check if operator with email already exists
    const existing = await Operator.findOne({ email });
    if (existing) {
      return NextResponse.json({ success: false, message: 'Email already registered' }, { status: 400 });
    }

    // Generate unique OP ID (OPxxxx)
    let generatedId = '';
    let isUnique = false;
    while (!isUnique) {
      generatedId = 'OP' + Math.floor(1000 + Math.random() * 9000);
      const duplicate = await Operator.findOne({ id: generatedId });
      if (!duplicate) {
        isUnique = true;
      }
    }

    const newOperator = new Operator({
      id: generatedId,
      name,
      email,
      phone,
      joinDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      password,
      agreementAccepted: false,
    });

    await newOperator.save();

    return NextResponse.json({
      success: true,
      operator: {
        id: newOperator.id,
        name: newOperator.name,
        email: newOperator.email,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

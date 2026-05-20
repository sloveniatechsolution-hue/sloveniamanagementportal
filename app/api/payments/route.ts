import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Payment } from '@/lib/models';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const operatorId = searchParams.get('operatorId');

    const filter: any = {};
    if (operatorId) {
      filter.operatorId = operatorId;
    }

    const list = await Payment.find(filter).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, payments: list });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { operatorId, weekStartDate, weekEndDate, amount, metersAssembled, status, receiptName, receiptData } = body;

    if (!operatorId || !weekStartDate || !weekEndDate || amount === undefined) {
      return NextResponse.json({ success: false, message: 'Missing required payment fields' }, { status: 400 });
    }

    const newPayment = await Payment.create({
      operatorId,
      weekStartDate,
      weekEndDate,
      amount,
      metersAssembled: metersAssembled || 0,
      status: status || 'Paid',
      receiptName,
      receiptData,
    });

    return NextResponse.json({ success: true, payment: newPayment });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

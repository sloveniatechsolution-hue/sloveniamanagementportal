import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Payment } from '@/lib/models';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Payment ID is required' }, { status: 400 });
    }

    const deleted = await Payment.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Payment deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

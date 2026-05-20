import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Operator } from '@/lib/models';

type RouteParams = {
  params: Promise<{ id: string }>
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await request.json();

    const updated = await Operator.findOneAndUpdate(
      { id: id },
      { $set: body },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, message: 'Operator not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, operator: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const deleted = await Operator.findOneAndDelete({ id: id });
    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Operator not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Operator deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

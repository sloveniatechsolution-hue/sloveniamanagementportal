import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Operator } from '@/lib/models';

export async function PUT(request: Request) {
  try {
    await connectToDatabase();
    const { operatorId, bankDetails, slovenianId, agreementAccepted } = await request.json();

    if (!operatorId) {
      return NextResponse.json({ success: false, message: 'Operator ID is required' }, { status: 400 });
    }

    const updateFields: any = {};
    if (bankDetails) updateFields.bankDetails = bankDetails;
    if (slovenianId) updateFields.slovenianId = slovenianId;
    if (agreementAccepted !== undefined) {
      updateFields.agreementAccepted = agreementAccepted;
      if (agreementAccepted) {
        updateFields.agreementAcceptedAt = new Date();
      }
    }

    const updated = await Operator.findOneAndUpdate(
      { id: operatorId },
      { $set: updateFields },
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

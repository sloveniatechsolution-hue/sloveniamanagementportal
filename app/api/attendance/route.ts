import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Attendance } from '@/lib/models';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const operatorId = searchParams.get('operatorId');

    const filter: any = {};
    if (date) {
      filter.date = date;
    } else if (startDate && endDate) {
      filter.date = { $gte: startDate, $lte: endDate };
    }
    
    if (operatorId) {
      filter.operatorId = operatorId;
    }

    const records = await Attendance.find(filter);
    return NextResponse.json({ success: true, attendance: records });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { records } = await request.json(); // Array of { date, operatorId, status, metersAssembled }

    if (!records || !Array.isArray(records)) {
      return NextResponse.json({ success: false, message: 'Invalid records array' }, { status: 400 });
    }

    const savedRecords = [];
    for (const record of records) {
      const filter = { date: record.date, operatorId: record.operatorId };
      const update = {
        status: record.status,
        metersAssembled: record.metersAssembled,
      };

      const doc = await Attendance.findOneAndUpdate(
        filter,
        { $set: update },
        { upsert: true, new: true }
      );
      savedRecords.push(doc);
    }

    return NextResponse.json({ success: true, attendance: savedRecords });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

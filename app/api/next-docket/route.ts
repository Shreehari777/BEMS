import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import BatchReport from '@/lib/models/BatchReport';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id') || '';
    const query = userId ? { createdBy: userId } : {};
    const lastReport = await BatchReport.findOne(query).sort({ docketNumber: -1 }).lean();
    const nextDocketNumber = lastReport
      ? parseInt(String(lastReport.docketNumber), 10) + 1 || 1
      : 1;
    return NextResponse.json({ nextDocketNumber });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import BatchReport from '@/lib/models/BatchReport';
import { requireAuth } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth.authorized) return auth.response;
    const userId = auth.session.userId;

    await dbConnect();
    const query = auth.session.role === 'admin' ? {} : { createdBy: userId };
    const lastReport = await BatchReport.findOne(query).sort({ docketNumber: -1 }).lean();
    const nextDocketNumber = lastReport
      ? parseInt(String(lastReport.docketNumber), 10) + 1 || 1
      : 1;
    return NextResponse.json({ nextDocketNumber });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


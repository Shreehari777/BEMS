import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import BatchReport from '@/lib/models/BatchReport';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const { rate } = await request.json();
    
    const report = await BatchReport.findByIdAndUpdate(
      id,
      { rate: Number(rate) },
      { new: true }
    );
    
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    
    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update rate' }, { status: 500 });
  }
}

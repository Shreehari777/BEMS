import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import BatchReport from '@/lib/models/BatchReport';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    await dbConnect();
    
    const report = await BatchReport.findById(id);
    if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    await dbConnect();
    
    const report = await BatchReport.findByIdAndUpdate(id, body, { new: true });
    if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    await dbConnect();
    
    const report = await BatchReport.findByIdAndDelete(id);
    if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

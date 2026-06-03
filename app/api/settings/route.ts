import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Setting from '@/lib/models/Setting';
import { requireAuth, requireAdmin } from '@/lib/session';

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth.authorized) return auth.response;

    await dbConnect();
    const settings = await Setting.find({});
    const result: any = {};
    settings.forEach(s => {
      result[s.key] = s.value;
    });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const { key, value } = body;

    await dbConnect();
    
    const setting = await Setting.findOneAndUpdate(
      { key },
      { value },
      { upsert: true, new: true }
    );
    
    return NextResponse.json(setting);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}


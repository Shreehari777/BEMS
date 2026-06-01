import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Recipe from '@/lib/models/Recipe';
import { requireAuth } from '@/lib/session';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req);
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const body = await req.json();

    await dbConnect();
    
    const recipe = await Recipe.findByIdAndUpdate(id, body, { new: true });
    if (!recipe) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(recipe);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req);
    if (!auth.authorized) return auth.response;

    const { id } = await params;

    await dbConnect();
    
    const recipe = await Recipe.findByIdAndDelete(id);
    if (!recipe) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}


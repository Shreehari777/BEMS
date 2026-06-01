import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Recipe from '@/lib/models/Recipe';
import { requireAuth } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function DELETE(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(req.url);
    const grade = searchParams.get('grade');

    await dbConnect();
    
    if (grade) {
      await Recipe.deleteOne({ grade });
    } else {
      await Recipe.deleteMany({});
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth.authorized) return auth.response;

    await dbConnect();
    const recipes = await Recipe.find({}).sort({ createdAt: -1 });
    return NextResponse.json(recipes);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth.authorized) return auth.response;

    const data = await req.json();
    await dbConnect();
    if (Array.isArray(data)) {
      const ops = data.map((r: any) => ({
        updateOne: {
          filter: { grade: r.grade },
          update: { $set: r },
          upsert: true
        }
      }));
      await Recipe.bulkWrite(ops);
      return NextResponse.json({ success: true });
    }
    const recipe = await Recipe.create(data);
    return NextResponse.json(recipe);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}


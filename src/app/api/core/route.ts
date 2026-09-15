import { NextResponse } from 'next/server';
import { approveCoreAction } from '@/actions/core-actions';

export async function POST(request: Request) {
  const { ideaId, targetPublishDate, publishMetadata } = await request.json();
  try {
    const result = await approveCoreAction(ideaId, targetPublishDate, publishMetadata);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

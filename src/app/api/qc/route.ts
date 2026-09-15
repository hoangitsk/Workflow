import { NextResponse } from 'next/server';
import { submitQcAction } from '@/actions/qc-actions';

export async function POST(request: Request) {
  const { ideaId, qcChecklist } = await request.json();
  try {
    const result = await submitQcAction(ideaId, qcChecklist);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

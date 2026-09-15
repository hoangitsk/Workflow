import { NextResponse } from 'next/server';
import { submitProductionAction } from '@/actions/production-actions';

export async function POST(request: Request) {
  const { ideaId, masterVideoLink, productionChecklist, assetFolderLink } = await request.json();
  try {
    const result = await submitProductionAction(ideaId, masterVideoLink, productionChecklist, assetFolderLink);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

import { NextResponse } from 'next/server';
import { loginWithCredentialsAction } from '../../../actions/auth-actions';

export async function GET() {
  try {
    await loginWithCredentialsAction('admin@ynda.vn', '123');
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, stack: err.stack });
  }
}

import { NextResponse } from 'next/server';
import { AYRSHARE_DASHBOARD_URL } from '@/lib/ayrshare';

export async function GET() {
  return NextResponse.json({ url: AYRSHARE_DASHBOARD_URL });
}

import { NextResponse } from 'next/server';
import { seedFinanceCatalog } from '@/lib/catalog';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST() {
  try {
    const result = await seedFinanceCatalog();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}

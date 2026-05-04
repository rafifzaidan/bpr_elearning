import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE public.modules DROP CONSTRAINT IF EXISTS modules_division_id_fkey;');
    await prisma.$executeRawUnsafe('ALTER TABLE public.modules DROP COLUMN IF EXISTS division_id;');
    return NextResponse.json({ success: true, message: 'Column added' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}

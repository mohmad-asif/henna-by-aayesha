export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAdminAuth } from '@/lib/auth/admin-api';
import { getFaqs, saveFaq, deleteFaq } from '@/lib/supabase/extended-settings';

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
  }

  try {
    const faqs = await getFaqs(true);
    return NextResponse.json({ faqs });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch FAQs';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body.question || !body.question.trim()) {
      return NextResponse.json({ error: 'Question is required.' }, { status: 400 });
    }
    if (!body.answer || !body.answer.trim()) {
      return NextResponse.json({ error: 'Answer is required.' }, { status: 400 });
    }

    const saved = await saveFaq(
      {
        id: body.id,
        question: body.question.trim(),
        answer: body.answer.trim(),
        category: (body.category || 'general').trim(),
        displayOrder: typeof body.displayOrder === 'number' ? body.displayOrder : 1,
        published: typeof body.published === 'boolean' ? body.published : true,
      },
      auth.client
    );

    try {
      revalidatePath('/', 'layout');
      revalidatePath('/');
      revalidatePath('/about');
      revalidatePath('/services');
    } catch {}

    return NextResponse.json({ success: true, faq: saved });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'FAQ ID is required.' }, { status: 400 });
    }

    await deleteFaq(id, auth.client);

    try {
      revalidatePath('/', 'layout');
      revalidatePath('/');
      revalidatePath('/about');
      revalidatePath('/services');
    } catch {}

    return NextResponse.json({ success: true, message: 'FAQ deleted.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

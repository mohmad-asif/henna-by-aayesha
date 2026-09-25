export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAdminAuth } from '@/lib/auth/admin-api';
import { getWhyChooseUs, saveWhyChooseUs, deleteWhyChooseUs } from '@/lib/supabase/extended-settings';

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
  }

  try {
    const items = await getWhyChooseUs(true);
    return NextResponse.json({ items });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch items';
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

    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
    }
    if (!body.description || !body.description.trim()) {
      return NextResponse.json({ error: 'Description is required.' }, { status: 400 });
    }

    const saved = await saveWhyChooseUs(
      {
        id: body.id,
        icon: (body.icon || '🌿').trim(),
        title: body.title.trim(),
        description: body.description.trim(),
        displayOrder: typeof body.displayOrder === 'number' ? body.displayOrder : 1,
        published: typeof body.published === 'boolean' ? body.published : true,
      },
      auth.client
    );

    try {
      revalidatePath('/', 'layout');
      revalidatePath('/');
      revalidatePath('/about');
    } catch {}

    return NextResponse.json({ success: true, item: saved });
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
      return NextResponse.json({ error: 'Item ID is required.' }, { status: 400 });
    }

    await deleteWhyChooseUs(id, auth.client);

    try {
      revalidatePath('/', 'layout');
      revalidatePath('/');
      revalidatePath('/about');
    } catch {}

    return NextResponse.json({ success: true, message: 'Item deleted.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

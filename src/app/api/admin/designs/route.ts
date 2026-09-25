export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAdminAuth } from '@/lib/auth/admin-api';

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
  }

  try {
    const { data, error } = await auth.client
      .from('mehndi_designs')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ designs: data || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch designs';
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
      return NextResponse.json({ error: 'Design title is required.' }, { status: 400 });
    }

    const title = body.title.trim();
    const slug = (
      body.slug ||
      title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    ).trim();

    const allowedCategories = ['Bridal', 'Arabic', 'Traditional', 'Minimal', 'Modern', 'Custom'];
    const category = allowedCategories.includes(body.category) ? body.category : 'Bridal';

    const payload = {
      ...(body.id ? { id: body.id } : {}),
      title,
      slug,
      category,
      description: (body.description || '').trim(),
      image: (body.image || '/images/hero-bride.jpg').trim(),
      alt_text: (body.alt_text || `${title} Mehndi Design`).trim(),
      featured: typeof body.featured === 'boolean' ? body.featured : false,
      active: typeof body.active === 'boolean' ? body.active : true,
      display_order: typeof body.display_order === 'number' ? body.display_order : 1,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await auth.client
      .from('mehndi_designs')
      .upsert(payload)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    try {
      revalidatePath('/', 'layout');
      revalidatePath('/mehndi-designs');
      revalidatePath(`/mehndi-designs/${slug}`);
      revalidatePath('/gallery');
      revalidatePath('/');
    } catch {}

    return NextResponse.json({ success: true, design: data });
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
      return NextResponse.json({ error: 'Design ID is required.' }, { status: 400 });
    }

    const { error } = await auth.client
      .from('mehndi_designs')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    try {
      revalidatePath('/', 'layout');
      revalidatePath('/mehndi-designs');
      revalidatePath('/gallery');
      revalidatePath('/');
    } catch {}

    return NextResponse.json({ success: true, message: 'Design deleted.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

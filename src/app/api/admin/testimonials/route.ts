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
      .from('testimonials')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ testimonials: data || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch testimonials';
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

    if (!body.customer_name || !body.customer_name.trim()) {
      return NextResponse.json({ error: 'Customer name is required.' }, { status: 400 });
    }
    if (!body.review || !body.review.trim()) {
      return NextResponse.json({ error: 'Review text is required.' }, { status: 400 });
    }

    const payload = {
      ...(body.id ? { id: body.id } : {}),
      customer_name: body.customer_name.trim(),
      review: body.review.trim(),
      rating: typeof body.rating === 'number' && body.rating >= 1 && body.rating <= 5 ? body.rating : 5,
      image: (body.image || '').trim(),
      featured: typeof body.featured === 'boolean' ? body.featured : false,
      active: typeof body.active === 'boolean' ? body.active : true,
      display_order: typeof body.display_order === 'number' ? body.display_order : 1,
    };

    const { data, error } = await auth.client
      .from('testimonials')
      .upsert(payload)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    try {
      revalidatePath('/', 'layout');
      revalidatePath('/testimonials');
      revalidatePath('/');
    } catch {}

    return NextResponse.json({ success: true, testimonial: data });
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
      return NextResponse.json({ error: 'Testimonial ID is required.' }, { status: 400 });
    }

    const { error } = await auth.client
      .from('testimonials')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    try {
      revalidatePath('/', 'layout');
      revalidatePath('/testimonials');
      revalidatePath('/');
    } catch {}

    return NextResponse.json({ success: true, message: 'Testimonial deleted.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

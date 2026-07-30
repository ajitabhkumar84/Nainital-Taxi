import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabaseClient } from '@/lib/supabase/admin';

interface OrderUpdate {
  id: string;
  display_order: number;
}

// POST: Bulk update display_order for packages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orders } = body as { orders: OrderUpdate[] };

    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json(
        { error: 'orders array is required' },
        { status: 400 }
      );
    }

    const supabase = getAdminSupabaseClient();

    // Update each package's display_order
    const updatePromises = orders.map(({ id, display_order }) =>
      supabase
        .from('packages')
        .update({ display_order, updated_at: new Date().toISOString() })
        .eq('id', id)
    );

    const results = await Promise.all(updatePromises);

    // Check for any errors
    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      console.error('Errors updating package orders:', errors);
      return NextResponse.json(
        { error: 'Some updates failed', details: errors.map((e) => e.error) },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in packages reorder POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

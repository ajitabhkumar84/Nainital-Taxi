import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = serviceRoleKey && serviceRoleKey !== 'your-service-role-key-here'
    ? serviceRoleKey
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

function isAuthorized(request: NextRequest): boolean {
  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'nainital2024';
  const authHeader = request.headers.get('x-admin-auth');
  return authHeader === adminPassword;
}

interface OrderUpdate {
  id: string;
  display_order: number;
}

// POST: Bulk update display_order for packages
export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orders } = body as { orders: OrderUpdate[] };

    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json(
        { error: 'orders array is required' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

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

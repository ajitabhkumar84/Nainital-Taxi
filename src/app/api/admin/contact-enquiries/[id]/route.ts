import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabaseClient } from '@/lib/supabase/admin';

// Hard delete — unlike destinations' soft-delete, there's no downstream content
// integrity to protect here; this is purely spam/test cleanup. No manual session
// check needed: middleware.ts already gates every /api/admin/* path via
// verifyAdminSessionFromRequest before this handler runs.
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = getAdminSupabaseClient();

    const { error } = await supabase.from('contact_enquiries').delete().eq('id', id);

    if (error) {
      console.error('Error deleting contact enquiry:', error);
      return NextResponse.json({ error: 'Failed to delete enquiry' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/contact-enquiries/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

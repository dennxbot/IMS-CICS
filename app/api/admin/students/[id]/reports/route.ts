import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/utils/supabase/service-role';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and admin access
    const supabaseAuth = createClient();
    const { data: { user: authUser }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !authUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user data
    const { data: userData, error: userError } = await supabaseAuth
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (userError || !userData || userData.user_type !== 1) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createServiceRoleClient();
    const studentId = params.id;

    // Fetch student reports
    const { data: reports, error } = await supabase
      .from('weekly_reports')
      .select('*')
      .eq('student_id', studentId)
      .order('week_starting', { ascending: false });

    if (error) {
      console.error('Error fetching student reports:', error);
      return NextResponse.json(
        { error: "Failed to fetch reports" },
        { status: 500 }
      );
    }

    return NextResponse.json({ reports });

  } catch (error) {
    console.error('Error fetching student reports:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
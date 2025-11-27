import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';

// Force dynamic rendering for this API route due to cookie usage
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient();
    const user = await requireAuth();
    
    // Check if user is admin
    if (user.user_type !== 1) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Total reports
    const { count: totalReports } = await supabase
      .from('weekly_reports')
      .select('*', { count: 'exact', head: true });

    // Reports by status
    const { count: pendingReports } = await supabase
      .from('weekly_reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: approvedReports } = await supabase
      .from('weekly_reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');

    const { count: rejectedReports } = await supabase
      .from('weekly_reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rejected');

    // Recent reports (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: recentReports } = await supabase
      .from('weekly_reports')
      .select('*', { count: 'exact', head: true })
      .gte('submitted_at', thirtyDaysAgo.toISOString());

    return NextResponse.json({
      totalReports: totalReports || 0,
      pendingReports: pendingReports || 0,
      approvedReports: approvedReports || 0,
      rejectedReports: rejectedReports || 0,
      recentReports: recentReports || 0
    });

  } catch (error) {
    console.error('Error fetching report stats:', error);
    return NextResponse.json({ error: 'Failed to fetch report statistics' }, { status: 500 });
  }
}
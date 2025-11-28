import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/utils/supabase/service-role';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

// Force dynamic rendering for this API route due to cookie usage
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createServiceRoleClient();

    // Try to get system settings with all columns
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching system settings:', error);

      // If columns don't exist, try with basic columns only
      const { data: basicSettings, error: basicError } = await supabase
        .from('system_settings')
        .select('id, name, logo_url, primary_color, secondary_color, email_notifications, attendance_verification_required, min_weekly_hours, max_daily_hours, created_at, updated_at')
        .single();

      if (basicError) {
        return NextResponse.json(
          { error: 'Failed to fetch system settings' },
          { status: 500 }
        );
      }

      // Add default values for missing columns
      const settingsWithDefaults = {
        ...basicSettings,
        restrict_report_submission: false,
        report_submission_days: '6',
        morning_checkin_time: '07:45',
        morning_checkout_time: '11:45',
        morning_duration: 4.0,
        afternoon_checkin_time: '12:45',
        afternoon_checkout_time: '16:45',
        afternoon_duration: 4.0
      };

      return NextResponse.json({ settings: settingsWithDefaults });
    }

    // Process settings data

    // Check if the new columns exist in the response
    if (!settings.hasOwnProperty('restrict_report_submission') || !settings.hasOwnProperty('report_submission_days')) {
      const settingsWithDefaults = {
        ...settings,
        restrict_report_submission: settings.restrict_report_submission ?? false,
        report_submission_days: settings.report_submission_days ?? '6',
        morning_checkin_time: settings.morning_checkin_time ?? '07:45',
        morning_checkout_time: settings.morning_checkout_time ?? '11:45',
        morning_duration: settings.morning_duration ?? 4.0,
        afternoon_checkin_time: settings.afternoon_checkin_time ?? '12:45',
        afternoon_checkout_time: settings.afternoon_checkout_time ?? '16:45',
        afternoon_duration: settings.afternoon_duration ?? 4.0
      };
      return NextResponse.json({ settings: settingsWithDefaults });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Unexpected error fetching system settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // For admin routes, we should check user type 1 (admin)
    const supabaseAuth = createClient();
    const { data: { user: authUser }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabaseAuth
      .from('users')
      .select('user_type')
      .eq('id', authUser.id)
      .single();

    if (userError || !userData || userData.user_type !== 1) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const supabase = createServiceRoleClient();
    const body = await request.json();

    // Validate the input
    const {
      restrict_report_submission,
      report_submission_days,
      name,
      logo_url,
      primary_color,
      secondary_color,
      email_notifications,
      attendance_verification_required,
      min_weekly_hours,
      max_daily_hours,
      morning_checkin_time,
      morning_checkout_time,
      morning_duration,
      afternoon_checkin_time,
      afternoon_checkout_time,
      afternoon_duration
    } = body;

    // Validate report submission days if provided
    if (report_submission_days !== undefined) {
      const days = report_submission_days.split(',').map((day: string) => parseInt(day.trim()));
      const validDays = days.every((day: number) => day >= 1 && day <= 7);
      if (!validDays) {
        return NextResponse.json(
          { error: 'Invalid report submission days. Days must be between 1 (Monday) and 7 (Sunday).' },
          { status: 400 }
        );
      }
    }

    // Build update payload with all columns including new ones
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    // Update all fields including the new report submission controls
    if (name !== undefined) updatePayload.name = name;
    if (logo_url !== undefined) updatePayload.logo_url = logo_url;
    if (primary_color !== undefined) updatePayload.primary_color = primary_color;
    if (secondary_color !== undefined) updatePayload.secondary_color = secondary_color;
    if (email_notifications !== undefined) updatePayload.email_notifications = email_notifications;
    if (attendance_verification_required !== undefined) updatePayload.attendance_verification_required = attendance_verification_required;
    if (min_weekly_hours !== undefined) updatePayload.min_weekly_hours = min_weekly_hours;
    if (max_daily_hours !== undefined) updatePayload.max_daily_hours = max_daily_hours;
    if (restrict_report_submission !== undefined) updatePayload.restrict_report_submission = restrict_report_submission;
    if (report_submission_days !== undefined) updatePayload.report_submission_days = report_submission_days;
    if (morning_checkin_time !== undefined) updatePayload.morning_checkin_time = morning_checkin_time;
    if (morning_checkout_time !== undefined) updatePayload.morning_checkout_time = morning_checkout_time;
    if (morning_duration !== undefined) updatePayload.morning_duration = morning_duration;
    if (afternoon_checkin_time !== undefined) updatePayload.afternoon_checkin_time = afternoon_checkin_time;
    if (afternoon_checkout_time !== undefined) updatePayload.afternoon_checkout_time = afternoon_checkout_time;
    if (afternoon_duration !== undefined) updatePayload.afternoon_duration = afternoon_duration;

    // Update the system settings (there should only be one record)
    const { data: settings, error } = await supabase
      .from('system_settings')
      .update(updatePayload)
      .eq('id', 1) // Assuming there's only one system settings record
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update system settings' },
        { status: 500 }
      );
    }

    // Return the actual database values (not the request parameters)

    // Revalidate the layout to reflect changes immediately
    revalidatePath('/', 'layout');

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Unexpected error updating system settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
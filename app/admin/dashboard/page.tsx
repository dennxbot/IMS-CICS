import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

// Force dynamic rendering for this page due to cookie usage
export const dynamic = 'force-dynamic';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  FileText,
  Building,
  GraduationCap,
  AlertTriangle,
  TrendingUp
} from "lucide-react";
import Link from "next/link";
import RefreshButton from "./refresh-button";

async function getAdminStats() {
  const supabase = createClient();

  try {
    // Total students (excluding test accounts)
    const { count: totalStudents } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('user_type', 2)
      .not('id', 'eq', '00000000-0000-0000-0000-000000000000'); // Exclude test accounts

    // Active students (with attendance in last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: activeStudentIds } = await supabase
      .from('timesheets')
      .select('student_id')
      .gte('date', weekAgo.toISOString().split('T')[0])
      .eq('timer_status', 0); // Completed sessions only

    const activeStudents = new Set(activeStudentIds?.map(s => s.student_id) || []).size;
    const inactiveStudents = (totalStudents || 0) - activeStudents;

    // Total hours from approved reports this week (based on week_starting)
    const { data: weeklyHoursData } = await supabase
      .from('weekly_reports')
      .select('total_hours_worked')
      .gte('week_starting', weekAgo.toISOString().split('T')[0])
      .eq('status', 'approved');

    const weeklyHours = weeklyHoursData?.reduce((sum, record) => sum + (record.total_hours_worked || 0), 0) || 0;

    // Students nearing completion (within 50 hours) - now using company-level hours
    const { data: allStudents } = await supabase
      .from('users')
      .select('id, full_name, company_id, companies!inner(total_required_hours)')
      .eq('user_type', 2);

    const nearingCompletion = [];

    for (const student of allStudents || []) {
      const { data: studentReports } = await supabase
        .from('weekly_reports')
        .select('total_hours_worked')
        .eq('student_id', student.id)
        .eq('status', 'approved');

      const totalRendered = studentReports?.reduce((sum, record) => sum + (record.total_hours_worked || 0), 0) || 0;
      const requiredHours = (student.companies as { total_required_hours?: number })?.total_required_hours || 500;
      const remaining = requiredHours - totalRendered;

      if (remaining > 0 && remaining <= 50) {
        nearingCompletion.push({
          ...student,
          rendered_hours: totalRendered,
          remaining_hours: remaining
        });
      }
    }

    // Recent attendance issues (no attendance in 3+ days)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const { data: recentAttendance } = await supabase
      .from('timesheets')
      .select('student_id')
      .gte('date', threeDaysAgo.toISOString().split('T')[0]);

    const studentsWithRecentAttendance = new Set(recentAttendance?.map(s => s.student_id) || []);
    const studentsWithoutRecentAttendance = (allStudents || [])
      .filter(student => !studentsWithRecentAttendance.has(student.id))
      .slice(0, 5); // Top 5

    // Report statistics
    const { count: totalReports } = await supabase
      .from('weekly_reports')
      .select('*', { count: 'exact', head: true });

    const { count: pendingReports } = await supabase
      .from('weekly_reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    return {
      totalStudents: totalStudents || 0,
      activeStudents,
      inactiveStudents,
      weeklyHours: Math.round(weeklyHours * 100) / 100,
      nearingCompletion,
      studentsWithoutRecentAttendance,
      totalReports: totalReports || 0,
      pendingReports: pendingReports || 0
    };
  } catch (error) {
    console.error('Error in getAdminStats:', error);
    // Return default values if there's an error
    return {
      totalStudents: 0,
      activeStudents: 0,
      inactiveStudents: 0,
      weeklyHours: 0,
      nearingCompletion: [],
      studentsWithoutRecentAttendance: [],
      totalReports: 0,
      pendingReports: 0
    };
  }
}

export default async function AdminDashboard() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      redirect('/login');
    }

    if (user.user_type !== 1) {
      // Redirect to appropriate dashboard based on user type
      switch (user.user_type) {
        case 2:
          redirect('/student/dashboard');
          break;
        default:
          redirect('/login');
      }
    }

    const stats = await getAdminStats();

    return (
      <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-600">System administration and oversight</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Students</CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Active students in system</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Students</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeStudents}</div>
              <p className="text-xs text-muted-foreground">With recent attendance</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive Students</CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inactiveStudents}</div>
              <p className="text-xs text-muted-foreground">No recent activity</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.weeklyHours}</div>
              <p className="text-xs text-muted-foreground">Total hours this week</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/admin/students" className="block">
                <Button className="w-full" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Students
                </Button>
              </Link>
              <Link href="/admin/reports" className="block">
                <Button className="w-full" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Review Reports
                </Button>
              </Link>
              <Link href="/admin/companies" className="block">
                <Button className="w-full" variant="outline">
                  <Building className="h-4 w-4 mr-2" />
                  Companies
                </Button>
              </Link>
              <Link href="/admin/courses" className="block">
                <Button className="w-full" variant="outline">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Courses
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Students Nearing Completion */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Students Nearing Completion
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.nearingCompletion.length > 0 ? (
                <div className="space-y-3">
                  {stats.nearingCompletion.map((student) => (
                    <div key={student.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg gap-2">
                      <div>
                        <p className="font-medium text-sm sm:text-base">{student.full_name}</p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {student.rendered_hours.toFixed(1)} / {((student.companies as { total_required_hours?: number })?.total_required_hours || 500)} hours
                        </p>
                      </div>
                      <Badge variant="outline" className="self-start sm:self-center">
                        {student.remaining_hours.toFixed(0)}h remaining
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <TrendingUp className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-2 sm:mb-3" />
                  <p className="text-sm sm:text-base text-gray-600">No students nearing completion</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Attendance Issues */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Recent Attendance Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.studentsWithoutRecentAttendance.length > 0 ? (
                <div className="space-y-3">
                  {stats.studentsWithoutRecentAttendance.map((student) => (
                    <div key={student.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg gap-2">
                      <div>
                        <p className="font-medium text-sm sm:text-base">{student.full_name}</p>
                        <p className="text-xs sm:text-sm text-gray-600">No attendance in 3+ days</p>
                      </div>
                      <Badge variant="destructive" className="self-start sm:self-center">Inactive</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No recent attendance issues</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Report Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Weekly Report Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{stats.totalReports}</div>
                <p className="text-sm text-gray-600">Total Reports</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-3xl font-bold text-orange-600">{stats.pendingReports}</div>
                <p className="text-sm text-gray-600">Pending Review</p>
              </div>
              <Link href="/admin/reports" className="block">
                <Button className="w-full h-full min-h-[100px]" variant="outline">
                  <FileText className="h-5 w-5 mr-2" />
                  Review All Reports
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    console.error('Error loading admin dashboard:', error);

    // Return an error page instead of throwing
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h1 className="text-xl font-bold text-red-800 mb-2">Dashboard Error</h1>
          <p className="text-red-700 mb-4">
            Unable to load dashboard data. Please try refreshing the page.
          </p>
          <RefreshButton />
        </div>
      </div>
    );
  }
}
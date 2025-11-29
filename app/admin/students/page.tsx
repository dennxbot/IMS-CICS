import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StudentActions } from "./student-actions";
// Avatar component not available – fallback to plain initials
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  UserPlus,
  Building2,
  Clock,
  BookOpen,
  CheckCircle,
  XCircle
} from "lucide-react";

export const metadata: Metadata = {
  title: "Student Management - Admin",
  description: "Manage students in the internship management system",
};

interface Student {
  id: string;
  email: string;
  full_name: string;
  student_id: string;
  course: string;
  year_level: number;
  company_id: number;

  contact_number: string;
  address: string;
  profile_image_url?: string;
  is_active: boolean;
  created_at: string;
  companies?: {
    name: string;
    total_required_hours?: number;
  };

  weekly_reports?: {
    total_hours_worked: number;
    status: string;
  }[];
}

async function getStudents(): Promise<Student[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      companies!inner(name, total_required_hours),
      weekly_reports:weekly_reports!weekly_reports_student_id_fkey(total_hours_worked, status)
    `)
    .eq('user_type', 2) // Student user type
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('Error fetching students:', error);
    return [];
  }

  return data as Student[];
}

// async function getCompanies() {
//   const supabase = createClient();
//   
//   const { data, error } = await supabase
//     .from('companies')
//     .select('id, name')
//     .eq('is_active', true)
//     .order('name', { ascending: true });

//   if (error || !data) {
//     return [];
//   }

//   return data;
// }

// function calculateTotalHours(timesheets: Timesheet[] = []): number {
//   return timesheets?.reduce((sum, record) => sum + (record.total_hours || 0), 0) || 0;
// }

function getProgressPercentage(renderedHours: number, requiredDuration: number): number {
  if (!requiredDuration || requiredDuration === 0) return 0;
  return Math.min(Math.round((renderedHours / requiredDuration) * 100), 100);
}

function getProgressColor(percentage: number): string {
  if (percentage >= 90) return "bg-green-500";
  if (percentage >= 70) return "bg-blue-500";
  if (percentage >= 50) return "bg-yellow-500";
  if (percentage >= 30) return "bg-orange-500";
  return "bg-red-500";
}

export default async function AdminStudentsPage() {
  // Check authentication and admin access
  const user = await requireAuth();
  if (!user || user.user_type !== 1) {
    redirect("/login");
  }

  const students = await getStudents();
  // const companies = await getCompanies();


  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.is_active).length;
  const inactiveStudents = students.filter(s => !s.is_active).length;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Management</h1>
          <p className="text-muted-foreground">
            Manage student accounts, track progress, and oversee internship assignments
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/students/new">
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add New Student
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              All registered students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeStudents}</div>
            <p className="text-xs text-muted-foreground">
              Currently active accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Students</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inactiveStudents}</div>
            <p className="text-xs text-muted-foreground">
              Deactivated accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Students</CardTitle>
          <CardDescription>
            A list of all students in the system with their internship progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>ID No.</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No students found. Add your first student to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => {
                    const totalHours = student.weekly_reports
                      ?.filter(r => r.status === 'approved')
                      .reduce((sum, r) => sum + (r.total_hours_worked || 0), 0) || 0;
                    const requiredHours = student.companies?.total_required_hours || 500;
                    const progressPercentage = getProgressPercentage(totalHours, requiredHours);
                    const companyName = student.companies?.name || "Not Assigned";


                    return (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="font-medium">{student.full_name}</div>
                        </TableCell>
                        <TableCell>{student.student_id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            <span>{student.course || "Not Set"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            <span>{companyName}</span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-3 w-3" />
                              <span>{totalHours}h / {requiredHours}h</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${getProgressColor(progressPercentage)}`}
                                style={{ width: `${progressPercentage}%` }}
                              />
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {progressPercentage}% complete
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={student.is_active ? "default" : "secondary"}>
                            {student.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <StudentActions studentId={student.id} studentName={student.full_name} />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
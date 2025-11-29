import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, User, Mail, Phone, MapPin, Building2, BookOpen, Clock, Calendar, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Student {
  id: string;
  email: string;
  full_name: string;
  student_id: string;
  course: string;
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
}

async function getStudent(id: string): Promise<Student | null> {
  const supabase = createClient();

  const { data: student, error } = await supabase
    .from('users')
    .select(`
      *,
      companies!inner(name, total_required_hours)
    `)
    .eq('id', id)
    .eq('user_type', 2) // Ensure it's a student
    .single();

  if (error || !student) {
    return null;
  }

  return student;
}

async function getProgressHours(studentId: string): Promise<number> {
  const supabase = createClient();

  const { data: reports, error } = await supabase
    .from('weekly_reports')
    .select('total_hours_worked')
    .eq('student_id', studentId)
    .eq('status', 'approved');

  if (error || !reports) {
    return 0;
  }

  const totalHours = reports.reduce((sum, report) => {
    return sum + (report.total_hours_worked || 0);
  }, 0);

  return totalHours;
}

export default async function StudentDetailPage({
  params
}: {
  params: { id: string }
}) {
  await requireAuth();

  const student = await getStudent(params.id);
  const progressHours = await getProgressHours(params.id);

  if (!student) {
    notFound();
  }

  // Calculate progress percentage
  const requiredHours = student.companies?.total_required_hours || 500;
  const progressPercentage = Math.min((progressHours / requiredHours) * 100, 100);
  const progressColor = progressPercentage >= 100 ? 'bg-green-500' : progressPercentage >= 75 ? 'bg-blue-500' : progressPercentage >= 50 ? 'bg-yellow-500' : 'bg-orange-500';

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/students">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Students
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Student Details</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Student Information Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
            <CardDescription>
              Personal and academic details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              {student.profile_image_url ? (
                <Image
                  src={student.profile_image_url}
                  alt={student.full_name}
                  width={64}
                  height={64}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-lg font-medium">
                  {student.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-xl font-semibold">{student.full_name}</h2>
                <Badge variant={student.is_active ? "default" : "secondary"}>
                  {student.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Student ID:</span>
                <span>{student.student_id}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Email:</span>
                <span>{student.email}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Contact:</span>
                <span>{student.contact_number}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Address:</span>
                <span>{student.address}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Course:</span>
                <span>{student.course || "Not Set"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Internship Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Internship Details</CardTitle>
            <CardDescription>
              Company and duration information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Company:</span>
              <span>{student.companies?.name || "Not Assigned"}</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Progress Hours:</span>
                </div>
                <span className="font-semibold">{progressHours.toFixed(1)} / {requiredHours} hours</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${progressColor}`}
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>

              <div className="text-right text-xs text-muted-foreground">
                {progressPercentage.toFixed(1)}% Complete
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Required Hours:</span>
              <span>{student.companies?.total_required_hours || 500} hours</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Registered:</span>
              <span>{new Date(student.created_at).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-6">
        <Link href={`/admin/students/${student.id}/edit`}>
          <Button>
            <Pencil className="h-4 w-4 mr-2" />
            Edit Student
          </Button>
        </Link>
        <Link href="/admin/students">
          <Button variant="outline">
            Back to List
          </Button>
        </Link>
      </div>
    </div>
  );
}
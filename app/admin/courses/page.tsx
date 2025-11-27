import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus } from "lucide-react";
import Link from "next/link";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import CoursesListClient from "@/components/admin/CoursesListClient";

interface Course {
  id: number;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  student_count: number;
}

async function getCourses(): Promise<Course[]> {
  const supabase = createServiceRoleClient();
  
  const { data: courses, error } = await supabase
    .from('courses')
    .select(`
      *,
      users!course_id(count)
    `)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching courses:', error);
    return [];
  }

  return courses.map(course => ({
    ...course,
    student_count: course.users?.[0]?.count || 0
  })) || [];
}

export default async function CoursesPage() {
  const courses = await getCourses();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Course Management</h1>
          <p className="text-muted-foreground">
            Manage courses available for student registration
          </p>
        </div>
        <Link href="/admin/courses/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Course
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Courses</CardTitle>
          <CardDescription>
            View and manage all available courses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CoursesListClient initialCourses={courses} />
        </CardContent>
      </Card>
    </div>
  );
}
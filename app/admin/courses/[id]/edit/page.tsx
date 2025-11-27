import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import CourseEditForm from "@/components/admin/CourseEditForm";

interface Course {
  id: number;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
}

async function getCourse(id: number): Promise<Course | null> {
  const supabase = createServiceRoleClient();
  
  const { data: course, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching course:', error);
    return null;
  }

  return course;
}

export default async function EditCoursePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const courseId = parseInt(id);
  
  if (isNaN(courseId)) {
    notFound();
  }

  const course = await getCourse(courseId);
  
  if (!course) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/admin/courses">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
        </Link>
      </div>

      <CourseEditForm course={course} />
    </div>
  );
}
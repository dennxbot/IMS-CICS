'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Edit } from "lucide-react";
import Link from "next/link";
import DeleteCourseDialog from "@/components/admin/DeleteCourseDialog";

interface Course {
  id: number;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
  student_count: number;
}

interface CoursesListClientProps {
  initialCourses: Course[];
}

export default function CoursesListClient({ initialCourses }: CoursesListClientProps) {
  const [courses, setCourses] = useState<Course[]>(initialCourses);

  const handleDeleteCourse = async (courseId: number) => {
    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete course');
      }

      // Remove the deleted course from the state
      setCourses(prevCourses => prevCourses.filter(course => course.id !== courseId));
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Failed to delete course. Please try again.');
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead>Course Name</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Students</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {courses.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground">
              No courses found
            </TableCell>
          </TableRow>
        ) : (
          courses.map((course) => (
            <TableRow key={course.id}>
              <TableCell className="font-medium">{course.code}</TableCell>
              <TableCell>{course.name}</TableCell>
              <TableCell>
                {course.description ? (
                  <span className="line-clamp-2 max-w-xs">
                    {course.description}
                  </span>
                ) : (
                  <span className="text-muted-foreground">No description</span>
                )}
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    course.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {course.is_active ? "Active" : "Inactive"}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {course.student_count} students
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Link href={`/admin/courses/${course.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/admin/courses/${course.id}/edit`}>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <DeleteCourseDialog
                    courseId={course.id}
                    courseName={course.name}
                    courseCode={course.code}
                    onDelete={handleDeleteCourse}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
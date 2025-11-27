"use client"

import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import { StudentDeleteDialog } from "./student-delete-dialog";
import { deleteStudent } from "./actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface StudentActionsProps {
  studentId: string;
  studentName: string;
}

export function StudentActions({ studentId, studentName }: StudentActionsProps) {
  const router = useRouter();

  const handleDelete = async (studentId: string) => {
    try {
      await deleteStudent(studentId);
      // Show success toast
      toast.success('Student deleted successfully', {
        description: `${studentName} has been permanently removed from the system.`,
      });
      // Refresh the page to update the student list
      router.refresh();
    } catch (error) {
      console.error('Failed to delete student:', error);
      // Show error toast
      toast.error('Failed to delete student', {
        description: 'Please try again or contact support if the problem persists.',
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href={`/admin/students/${studentId}`}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/admin/students/${studentId}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Student
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <StudentDeleteDialog
            studentId={studentId}
            studentName={studentName}
            onDelete={handleDelete}
            trigger={
              <div className="flex items-center text-red-600 hover:text-red-700 cursor-pointer">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Student
              </div>
            }
          />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
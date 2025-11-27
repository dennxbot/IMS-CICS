'use client';

import { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface DeleteCourseDialogProps {
  courseId: number;
  courseName: string;
  courseCode: string;
  onDelete: (courseId: number) => Promise<void>;
}

export default function DeleteCourseDialog({ courseId, courseName, courseCode, onDelete }: DeleteCourseDialogProps) {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!isConfirmed) return;
    setIsDeleting(true);
    try {
      await onDelete(courseId);
    } catch (error) {
      console.error('Error deleting course:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader className="items-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
            <AlertTriangle className="size-6 text-red-600 dark:text-red-400" />
          </div>
          <AlertDialogTitle>Delete Course Permanently</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            This will permanently delete <strong>{courseName} ({courseCode})</strong> and all associated data. 
            This action cannot be undone and will affect all students enrolled in this course.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex items-center space-x-2 rounded-md border p-4">
          <Checkbox 
            id="confirm-delete" 
            checked={isConfirmed}
            onCheckedChange={(checked) => setIsConfirmed(checked as boolean)}
          />
          <Label className="font-normal text-sm" htmlFor="confirm-delete">
            I understand this action is permanent and cannot be undone
          </Label>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            disabled={!isConfirmed || isDeleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete Course'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
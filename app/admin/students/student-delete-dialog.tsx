"use client"

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface StudentDeleteDialogProps {
  studentId: string;
  studentName: string;
  onDelete: (studentId: string) => Promise<void>;
  trigger?: React.ReactNode;
}

export function StudentDeleteDialog({ 
  studentId, 
  studentName, 
  onDelete,
  trigger
}: StudentDeleteDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [checkboxChecked, setCheckboxChecked] = useState(false);

  const handleDelete = async () => {
    if (!checkboxChecked) return;
    
    setIsDeleting(true);
    // Show loading toast
    const loadingToast = toast.loading('Deleting student...', {
      description: 'Please wait while we remove the student from the system.',
    });
    
    try {
      await onDelete(studentId);
      // Dismiss loading toast and show success will be handled by parent
    } catch (error) {
      console.error('Error deleting student:', error);
      // Dismiss loading toast and show error
      toast.dismiss(loadingToast);
      toast.error('Deletion failed', {
        description: 'Unable to delete student. Please try again.',
      });
    } finally {
      setIsDeleting(false);
      setIsConfirming(false);
      setCheckboxChecked(false);
      // Dismiss loading toast
      toast.dismiss(loadingToast);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsConfirming(open);
    if (!open) {
      setCheckboxChecked(false);
    }
  };

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
      <Trash2 className="h-4 w-4 mr-2" />
      Delete
    </Button>
  );

  return (
    <AlertDialog open={isConfirming} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        {trigger || defaultTrigger}
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Delete Student
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              Are you sure you want to delete <strong>{studentName}</strong>? This action cannot be undone.
            </p>
            <p className="text-sm text-muted-foreground">
              This will permanently remove the student account and all associated data including:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Student profile information</li>
              <li>Internship records</li>
              <li>Timesheet entries</li>
              <li>Attendance records</li>
            </ul>
            <div className="flex items-center space-x-2 pt-4 border-t">
              <Checkbox
                id="confirm-delete"
                checked={checkboxChecked}
                onCheckedChange={(checked) => setCheckboxChecked(checked as boolean)}
              />
              <Label
                htmlFor="confirm-delete"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I understand this action is permanent and cannot be undone
              </Label>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={!checkboxChecked || isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Student
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
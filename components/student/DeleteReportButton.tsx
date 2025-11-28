"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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

interface DeleteReportButtonProps {
  reportId: number;
  weekStarting: string;
}

export function DeleteReportButton({ reportId, weekStarting }: DeleteReportButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('weekly_reports')
        .delete()
        .eq('id', reportId);

      if (error) {
        console.error('Error deleting report:', error);
        toast.error('Failed to delete report. Please try again.');
        return;
      }

      // Refresh the page to show updated reports
      router.refresh();
      toast.success('Report deleted successfully.');
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('An error occurred while deleting the report.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="destructive" 
          size="sm" 
          className="flex-1"
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : (
            <>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader className="items-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
            <AlertTriangle className="size-6 text-red-600 dark:text-red-400" />
          </div>
          <AlertDialogTitle>Delete Weekly Report</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Are you sure you want to delete the weekly report for week starting{' '}
            <strong>{new Date(weekStarting).toLocaleDateString()}</strong>? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete Report'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
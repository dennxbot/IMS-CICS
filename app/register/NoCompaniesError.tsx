"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";

export default function NoCompaniesError() {
  useEffect(() => {
    toast.error("Registration Unavailable", {
      description: "Student registration is currently unavailable because no companies have been set up by the administrator.",
      duration: 10000,
    });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md space-y-6 p-6">
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-red-600 mb-4">Registration Unavailable</h1>
          <p className="text-muted-foreground mb-4 text-sm sm:text-base">
            Student registration is currently unavailable because no companies have been set up by the administrator.
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Please contact the system administrator to set up companies before students can register.
          </p>
          <div className="mt-6">
            <Link 
              href="/login" 
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
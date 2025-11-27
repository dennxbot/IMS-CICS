"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, UserPlus } from "lucide-react";

interface Company {
  id: number;
  name: string;
}

interface Course {
  id: number;
  name: string;
  code: string;
}

interface StudentFormProps {
  companies: Company[];
  courses: Course[];
}

export function StudentForm({ companies, courses }: StudentFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordMatch, setPasswordMatch] = useState<boolean | null>(null);

  // Debug logging
  console.log('StudentForm received props:', { companiesCount: companies.length, coursesCount: courses.length, companies, courses });

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = (document.getElementById('password') as HTMLInputElement)?.value;
    const confirmPassword = e.target.value;
    
    if (confirmPassword === '') {
      setPasswordMatch(null);
    } else if (password === confirmPassword) {
      setPasswordMatch(true);
    } else {
      setPasswordMatch(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    // Validate password match
    if (data.password !== data.confirm_password) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create student');
      }

      // Success - redirect to students list
      router.push('/admin/students');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Student Information Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Student Information</h2>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="student_id">Student ID No. <span className="text-red-500">*</span></Label>
            <Input
              id="student_id"
              name="student_id"
              placeholder="Enter student ID"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name <span className="text-red-500">*</span></Label>
            <Input
              id="full_name"
              name="full_name"
              placeholder="Enter student name"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter email address"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_number">Contact Number <span className="text-red-500">*</span></Label>
            <Input
              id="contact_number"
              name="contact_number"
              placeholder="Enter contact number"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address <span className="text-red-500">*</span></Label>
            <Textarea
              id="address"
              name="address"
              placeholder="Enter address"
              rows={3}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
          <Label htmlFor="course_id">Course <span className="text-red-500">*</span></Label>
            <select
              id="course_id"
              name="course_id"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
              disabled={isLoading}
            >
              <option value="">Select course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name} ({course.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Internship Details Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-5 w-5 rounded bg-blue-100" />
            <h2 className="text-lg font-semibold">Internship Details</h2>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="company_id">Company <span className="text-red-500">*</span></Label>
            <select
              id="company_id"
              name="company_id"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
              disabled={isLoading}
            >
              <option value="">Select company</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter password"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm Password <span className="text-red-500">*</span></Label>
            <Input
              id="confirm_password"
              name="confirm_password"
              type="password"
              placeholder="Confirm password"
              required
              disabled={isLoading}
              onChange={handlePasswordChange}
            />
          </div>

          {passwordMatch !== null && (
            <div className={`text-xs ${passwordMatch ? 'text-green-600' : 'text-red-600'}`}>
              {passwordMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => window.history.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            "Creating..."
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Add Student
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
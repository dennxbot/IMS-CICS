"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { passwordMatchSchema } from "@/validation/passwordMatchSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { registerUser } from "./action";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const formSchema = z.object({
  student_id: z.string().min(3, "Student ID must be at least 3 characters"),
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  contact: z.string().min(6, "Contact number must be at least 6 digits"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  course_id: z.string().min(1, "Course is required"),
  company_id: z.string().min(1, "Company is required"),
}).and(passwordMatchSchema);

interface RegisterClientProps {
  companies: { id: number; name: string }[];
  courses: { id: number; name: string; code: string }[];
}

export default function RegisterClient({ companies, courses }: RegisterClientProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      student_id: "",
      full_name: "",
      email: "",
      contact: "",
      address: "",
      course_id: "",
      company_id: "",
      password: "",
      passwordConfirm: "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      const response = await registerUser({
        student_id: data.student_id,
        full_name: data.full_name,
        email: data.email,
        contact: data.contact,
        address: data.address,
        course_id: data.course_id,
        company_id: data.company_id,
        password: data.password,
        passwordConfirm: data.passwordConfirm,
      });

      if (response.error) {
        toast.error(response.message);
        return;
      }

      // Show success toast
      toast.success("Registration successful! Please check your email for verification.");

      // Redirect to OTP verification page on success
      if (response.email) {
        router.push(`/auth/verify-email?email=${encodeURIComponent(response.email)}`);
      } else {
        // Fallback to login if email is not available
        router.push('/login');
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-4 sm:py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-6 sm:space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-2xl sm:text-3xl font-extrabold text-gray-900">
            Student Registration
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Create your account to get started
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 sm:mt-8 space-y-4 sm:space-y-6">
            <div className="space-y-3 sm:space-y-4">

              <FormField
                control={form.control}
                name="student_id"
                render={({ field }) => (
                  <FormItem className="space-y-1 sm:space-y-2">
                    <FormLabel className="text-sm sm:text-base font-medium">Student ID</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-11 text-base" placeholder="Enter your student ID" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem className="space-y-1 sm:space-y-2">
                    <FormLabel className="text-sm sm:text-base font-medium">Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-11 text-base" placeholder="Enter your full name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1 sm:space-y-2">
                    <FormLabel className="text-sm sm:text-base font-medium">Email Address</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" className="h-11 text-base" placeholder="Enter your email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact"
                render={({ field }) => (
                  <FormItem className="space-y-1 sm:space-y-2">
                    <FormLabel className="text-sm sm:text-base font-medium">Contact Number</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-11 text-base" placeholder="Enter your contact number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="space-y-1 sm:space-y-2">
                    <FormLabel className="text-sm sm:text-base font-medium">Address</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-11 text-base" placeholder="Enter your address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="course_id"
                render={({ field }) => (
                  <FormItem className="space-y-1 sm:space-y-2">
                    <FormLabel className="text-sm sm:text-base font-medium">Course</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11 text-base">
                          <SelectValue placeholder="Select your course" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id.toString()} className="text-sm sm:text-base">
                            {course.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company_id"
                render={({ field }) => (
                  <FormItem className="space-y-1 sm:space-y-2">
                    <FormLabel className="text-sm sm:text-base font-medium">Company</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11 text-base">
                          <SelectValue placeholder="Select your company" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id.toString()} className="text-sm sm:text-base">
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-1 sm:space-y-2">
                    <FormLabel className="text-sm sm:text-base font-medium">Password</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" className="h-11 text-base" placeholder="Enter your password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="passwordConfirm"
                render={({ field }) => (
                  <FormItem className="space-y-1 sm:space-y-2">
                    <FormLabel className="text-sm sm:text-base font-medium">Confirm Password</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" className="h-11 text-base" placeholder="Confirm your password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full h-11 text-base" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>

            <div className="text-center">
              <p className="text-sm sm:text-base text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
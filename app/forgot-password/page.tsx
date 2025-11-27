"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { forgotPassword } from "./action";

const formSchema = z.object({
  email: z.string().email(),
});

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Add loading state
  const [prefilledEmail, setPrefilledEmail] = useState('');

  // Safely get email from search params after component mounts
  useEffect(() => {
    if (typeof window !== 'undefined' && searchParams) {
      const emailParam = searchParams.get("email") ?? "";
      setPrefilledEmail(decodeURIComponent(emailParam));
    }
  }, [searchParams]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: prefilledEmail,
    },
  });

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    setServerError(null);
    setIsLoading(true); // Set loading to true when submission starts

    try {
      const response = await forgotPassword({
        email: data.email,
      });

      if (response.error) {
        setServerError(response.message);
        // }
      } else {
        // Redirect to OTP verification page
        router.push(`/forgot-password/verify-otp?email=${encodeURIComponent(data.email)}`);
      }
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false); // Set loading to false when submission ends
    }
  };
  return (
    <main className="flex justify-center items-center min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl sm:text-3xl font-bold">Password Reset</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Enter your email address to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="flex flex-col gap-4 sm:gap-6"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm sm:text-base">Email</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-11 text-base" placeholder="Enter your email address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {serverError && (
                <p className="text-red-500 text-sm mt-2 text-center">{serverError}</p>
              )}
              <Button type="submit" disabled={isLoading} className="h-11 text-base font-medium">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Please wait
                  </>
                ) : (
                  "Send reset link"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 sm:gap-4">
          <div className="text-muted-foreground text-sm text-center">
            Remember your password?{" "}
            <Link href="/login" className="underline font-medium">
              Login
            </Link>
          </div>
          <div className="text-muted-foreground text-sm text-center">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="underline font-medium">
              Register
            </Link>
          </div>
        </CardFooter>
      </Card>
    </main>
  );
}

export default function ForgotPassword() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
      <ForgotPasswordContent />
    </Suspense>
  );
}

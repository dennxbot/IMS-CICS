"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { resetPasswordFunc } from "./action";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { PasswordInput } from "@/components/ui/password-input";

const formSchema = z.object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    passwordConfirm: z.string().min(6, "Password confirmation must be at least 6 characters"),
  }).refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords don't match",
    path: ["passwordConfirm"],
  });

function ResetPasswordContent() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Add loading state
  const [isVerifyingSession, setIsVerifyingSession] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get email and verification token from URL parameters
  const [email, setEmail] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [otp, setOtp] = useState(''); // Fallback for backward compatibility

  // Safely get URL parameters after component mounts
  useEffect(() => {
    if (typeof window !== 'undefined' && searchParams) {
      setEmail(searchParams.get('email') || '');
      setVerificationToken(searchParams.get('token') || '');
      setOtp(searchParams.get('otp') || '');
    }
  }, [searchParams]);

  // Verify session on component mount
  useEffect(() => {
    if (!email || (!verificationToken && !otp)) {
      setIsVerifyingSession(false);
      return;
    }

    // If we have a verification token, we can trust the session (it means OTP was already verified)
    if (verificationToken) {
      console.log('Verification token present, skipping session verification');
      setIsVerifyingSession(false);
      return;
    }

    // Fallback: Verify the OTP session is still valid (for backward compatibility)
    const verifySession = async () => {
      try {
        const supabaseResponse = await fetch('/api/verify-reset-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            otp,
          }),
        });

        const sessionData = await supabaseResponse.json();
        
        if (!sessionData.valid) {
          if (sessionData.expired) {
            toast.error(sessionData.error || "Your reset session has expired. Please request a new password reset.");
          } else {
            toast.error("Invalid verification code. Please try again.");
          }
          router.push('/forgot-password');
        }
      } catch (error) {
        console.error('Session verification failed:', error);
        toast.error("Failed to verify reset session. Please try again.");
        router.push('/forgot-password');
      } finally {
        setIsVerifyingSession(false);
      }
    };

    verifySession();
  }, [email, verificationToken, otp, router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      passwordConfirm: "",
    },
  });

  // Validate that we have email and either verification token or OTP
  if (!email || (!verificationToken && !otp)) {
    return (
      <main className="flex justify-center items-center min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl sm:text-3xl font-bold text-red-600">Invalid Access</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Invalid or expired password reset link. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/forgot-password">
              <Button className="w-full h-11 text-base font-medium">
                Request New Reset
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Show loading state while verifying session
  if (isVerifyingSession) {
    return (
      <main className="flex justify-center items-center min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl sm:text-3xl font-bold">Verifying Session</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Please wait while we verify your reset session...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </main>
    );
  }

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    setServerError(null);
    setIsLoading(true); // Set loading to true when submission starts

    try {

      const response = await resetPasswordFunc({
        password: data.password,
        passwordConfirm: data.passwordConfirm,
      });

      if (response.error) {
        setServerError(response.message);
      } else {
        console.log("ddd: ", response);
        // Redirect to login page after successful password reset
        router.push("/login?reset=success");
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
          <CardTitle className="text-2xl sm:text-3xl font-bold">Reset Password</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Enter your new password to update your account
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
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm sm:text-base">New password</FormLabel>
                    <FormControl>
                      <PasswordInput {...field} className="h-11 text-base" placeholder="Enter new password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="passwordConfirm"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm sm:text-base">Confirm password</FormLabel>
                    <FormControl>
                      <PasswordInput {...field} className="h-11 text-base" placeholder="Confirm new password" />
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
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}

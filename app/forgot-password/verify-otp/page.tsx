"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Loader2 } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyPasswordResetOTP, resendPasswordResetOTP } from "@/app/forgot-password/verify-otp/action";

const formSchema = z.object({
  code: z.string().min(8, {
    message: "Verification code must be 8 characters.",
  }),
});

function ForgotPasswordVerifyOTPContent() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
    },
  });

  // Safely get email from search params after component mounts
  useEffect(() => {
    if (typeof window !== 'undefined' && searchParams) {
      const emailParam = searchParams.get('email') || '';
      setEmail(emailParam);
    }
  }, [searchParams]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsVerifying(true);
    
    try {
      await toast.promise(verifyPasswordResetOTP(email, values.code), {
        loading: "Verifying your code...",
        success: (result: { error: boolean; message: string; verificationToken?: string }) => {
          if (result.error) {
            throw new Error(result.message);
          }
          // Redirect to password reset form after successful OTP verification
          // Use verification token instead of raw OTP to avoid double verification issues
          router.push(`/forgot-password/reset-password?email=${encodeURIComponent(email)}&token=${result.verificationToken}`);
          return "Code verified successfully!";
        },
        error: (error: { message?: string }) => error.message || "Verification failed. Please try again.",
      });
    } catch {
      // Error is already handled by toast.promise
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResendCode() {
    if (!email) {
        toast.error("Email not found. Please try again.");
      return;
    }

    setIsResending(true);
    
    try {
      await toast.promise(resendPasswordResetOTP(email), {
        loading: "Sending new code...",
        success: (result: { error: boolean; message: string }) => {
          if (result.error) {
            throw new Error(result.message);
          }
          return "Verification code sent!";
        },
        error: (error: { message?: string }) => error.message || "Failed to send code. Please try again.",
      });
    } catch {
      // Error is already handled by toast.promise
    } finally {
      setIsResending(false);
    }
  }

  if (!email) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="mx-auto max-w-md space-y-6 p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Access</h1>
            <p className="text-muted-foreground">
              Please request a password reset first.
            </p>
            <Button 
              className="mt-4" 
              onClick={() => router.push('/forgot-password')}
            >
              Go to Password Reset
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mx-auto max-w-sm space-y-6 p-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h2 className="font-semibold text-2xl">Check your email</h2>
          <p className="text-muted-foreground text-sm">
            We sent a password reset verification code to{" "}
            <span className="font-medium">{email}</span>
          </p>
        </div>
        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem className="flex flex-col items-center">
                  <FormControl>
                    <InputOTP maxLength={8} {...field}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                        <InputOTPSlot index={6} />
                        <InputOTPSlot index={7} />
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className="w-full" disabled={isVerifying} type="submit">
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Code"
              )}
            </Button>
          </form>
        </Form>
        <div className="text-center text-muted-foreground text-sm">
          Didn&apos;t receive the email?{" "}
          <Button 
            className="h-auto p-0 font-normal" 
            type="button" 
            variant="link"
            onClick={handleResendCode}
            disabled={isResending}
          >
            {isResending ? "Resending..." : "Resend code"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordVerifyOTP() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
      <ForgotPasswordVerifyOTPContent />
    </Suspense>
  );
}
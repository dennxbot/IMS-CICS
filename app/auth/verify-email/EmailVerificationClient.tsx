"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Loader2 } from "lucide-react";
import { useState } from "react";
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
import { verifyEmailOTP, resendVerificationOTP } from "./action";

const formSchema = z.object({
  code: z.string().min(8, {
    message: "Verification code must be 8 characters.",
  }),
});

export default function EmailVerificationClient() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsVerifying(true);
    
    try {
      await toast.promise(verifyEmailOTP(email, values.code), {
        loading: "Verifying your code...",
        success: (result) => {
          if (result.error) {
            throw new Error(result.message);
          }
          router.push('/register/confirmation?token=registration_success');
          return "Email verified successfully!";
        },
        error: (error) => error.message || "Verification failed. Please try again.",
      });
    } catch {
      // Error is already handled by toast.promise
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResendCode() {
    if (!email) {
        toast.error("Email not found. Please register again.");
      return;
    }

    setIsResending(true);
    
    try {
      await toast.promise(resendVerificationOTP(email), {
        loading: "Sending verification code...",
        success: (result) => {
          if (result.error) {
            throw new Error(result.message);
          }
          return "Verification code sent! Check your email.";
        },
        error: (error) => error.message || "Failed to resend code. Please try again.",
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
              Please register first to verify your email.
            </p>
            <Button 
              className="mt-4" 
              onClick={() => router.push('/register')}
            >
              Go to Registration
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
            We sent a verification code to{" "}
            <span className="font-medium">{email}</span>
          </p>
        </div>
        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex justify-center">
                      <InputOTP maxLength={8} {...field}>
                        <InputOTPGroup>
                          <InputOTPSlot className="bg-background" index={0} />
                          <InputOTPSlot className="bg-background" index={1} />
                          <InputOTPSlot className="bg-background" index={2} />
                          <InputOTPSlot className="bg-background" index={3} />
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup>
                          <InputOTPSlot className="bg-background" index={4} />
                          <InputOTPSlot className="bg-background" index={5} />
                          <InputOTPSlot className="bg-background" index={6} />
                          <InputOTPSlot className="bg-background" index={7} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
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
                "Verify Email"
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
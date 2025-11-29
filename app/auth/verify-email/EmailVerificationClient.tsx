"use client";

import { Mail, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { resendConfirmationLink } from "./action";
import Link from "next/link";

export default function EmailVerificationClient() {
  const [isResending, setIsResending] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  async function handleResendLink() {
    if (!email) {
      toast.error("Email not found. Please register again.");
      return;
    }

    setIsResending(true);

    try {
      await toast.promise(resendConfirmationLink(email), {
        loading: "Sending confirmation link...",
        success: (result) => {
          if (result.error) {
            throw new Error(result.message);
          }
          return "Confirmation link sent! Check your email.";
        },
        error: (error) => error.message || "Failed to resend link. Please try again.",
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
            We sent a confirmation link to{" "}
            <span className="font-medium">{email}</span>
          </p>
          <p className="text-muted-foreground text-sm mt-2">
            Click the link in the email to verify your account.
          </p>
        </div>

        <div className="space-y-4">
          <Button
            className="w-full"
            variant="outline"
            onClick={handleResendLink}
            disabled={isResending}
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resending...
              </>
            ) : (
              "Resend Confirmation Link"
            )}
          </Button>

          <div className="text-center">
            <Link href="/login" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
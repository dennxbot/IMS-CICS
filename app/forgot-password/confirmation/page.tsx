import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Password Reset Confirmation",
  description: "Check your email for password reset instructions",
};

export default function ForgotPasswordConfirmation({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  // Check if the token parameter exists and is valid
  if (!searchParams.token || searchParams.token !== "reset_email_sent") {
    redirect("/forgot-password");
  }
  return (
    <main className="flex justify-center items-center min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <Card className="w-full max-w-lg mx-auto text-center">
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl sm:text-3xl font-bold">Check Your Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center mb-4">
            <Mail className="h-12 w-12 sm:h-16 sm:w-16 text-blue-500" />
          </div>
          <p className="text-gray-600 text-sm sm:text-base mb-4">
             We&apos;ve sent a password reset link to your email address. Please check
             your inbox and click the link to reset your password.
           </p>
          <p className="text-xs sm:text-sm text-gray-500">
            If you don&apos;t see the email, please check your spam folder.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 sm:gap-4 mt-6">
          <div className="text-muted-foreground text-sm text-center">
            Remember your password?{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium underline">
              Login here
            </Link>
          </div>
          <div className="text-muted-foreground text-sm text-center">
            Didn&apos;t receive the email?{" "}
            <Link href="/forgot-password" className="text-blue-600 hover:text-blue-800 font-medium underline">
              Try again
            </Link>
          </div>
        </CardFooter>
      </Card>
    </main>
  );
}

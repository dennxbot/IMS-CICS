import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function RegistrationConfirmation({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  // Check if the token parameter exists and is valid
  if (!searchParams.token || searchParams.token !== "registration_success") {
    redirect("/register");
  }

  // Additional security check: verify user has a valid session or has completed registration
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  // If no session exists, redirect to login (user needs to verify email first)
  if (!session) {
    redirect("/auth/verify-email");
  }
  return (
    <main className="flex justify-center items-center min-h-screen bg-gray-100 px-4 py-8 sm:px-6 lg:px-8">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl font-bold">Registration Successful!</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center mb-4 sm:mb-6">
            <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-green-500" />
          </div>
          <p className="text-gray-600 mb-4 text-sm sm:text-base">
            Your account has been created and verified successfully. You can now log in to your account.
          </p>
          <div className="mt-4 sm:mt-6">
            <Link href="/login">
              <Button className="w-full h-11 text-base">
                Go to Login
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

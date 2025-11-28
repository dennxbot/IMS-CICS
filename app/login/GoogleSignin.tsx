"use client";

import { useSearchParams } from "next/navigation";

import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

export default function GoogleSignin() {
  const supabase = createClient();

  const searchParams = useSearchParams();

  const next = searchParams.get("next");

  async function signInWithGoogle() {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback${
            next ? `?next=${encodeURIComponent(next)}` : ""
          }`,
        },
      });

      if (error) {
        throw error;
      }
    } catch {
      toast({
        title: "Please try again.",
        description: "There was an error logging in with Google.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="relative inline-block w-full">
      <Button
        type="button"
        variant="outline"
        onClick={signInWithGoogle}
        disabled={true} // Disabled for "Coming Soon"
        className="h-11 text-base font-medium w-full opacity-60 cursor-not-allowed"
      >
        <Image
          src="https://authjs.dev/img/providers/google.svg"
          alt="Google logo"
          width={20}
          height={20}
          className="mr-2 size-5 opacity-70"
        />
        Sign in with Google
      </Button>
      <Badge 
        variant="secondary" 
        className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full border-2 border-white shadow-sm"
      >
        Coming Soon
      </Badge>
    </div>
  );
}

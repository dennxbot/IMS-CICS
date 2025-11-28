"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LogoutButtonProps {
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export function LogoutButton({ className, variant = "outline", size = "sm" }: LogoutButtonProps) {
  const router = useRouter();

  async function handleLogout() {
    try {
      const response = await fetch('/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success("Logged out successfully");
        router.push('/login');
        router.refresh();
      } else {
        toast.error("Failed to logout. Please try again.");
      }
    } catch {
      toast.error("An error occurred during logout");
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      className={cn("flex items-center gap-2", className)}
    >
      <LogOut className="h-4 w-4" />
      Logout
    </Button>
  );
}
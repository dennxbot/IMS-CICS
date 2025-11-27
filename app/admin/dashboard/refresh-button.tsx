"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function RefreshButton() {
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <Button
      onClick={handleRefresh}
      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
    >
      Refresh Page
    </Button>
  );
}
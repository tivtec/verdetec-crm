"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/services/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
      <LogOut className="h-4 w-4" />
      Sair
    </Button>
  );
}

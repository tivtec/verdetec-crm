"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/services/supabase/client";
import { cn } from "@/utils/cn";

type LogoutButtonProps = {
  className?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  label?: string;
};

export function LogoutButton({
  className,
  variant = "ghost",
  size = "sm",
  label = "Sair",
}: LogoutButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleLogout() {
    if (isPending) {
      return;
    }

    setIsPending(true);

    try {
      const supabase = createBrowserSupabaseClient();
      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Erro ao sair da sessao:", error);
      setIsPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleLogout}
      disabled={isPending}
      className={cn("gap-2", className)}
    >
      <LogOut className="h-4 w-4" />
      {isPending ? "Saindo..." : label}
    </Button>
  );
}

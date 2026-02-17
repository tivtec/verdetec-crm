import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/services/supabase/server";

function isAclFunctionMissing(details: string) {
  const normalized = details.toLowerCase();
  return (
    normalized.includes("crm_can_access_path") ||
    normalized.includes("does not exist") ||
    normalized.includes("42883")
  );
}

export async function guardApiRouteAccess(pagePath: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "Nao autenticado." }, { status: 401 });
    }

    const { data, error } = await supabase.rpc("crm_can_access_path", {
      p_path: pagePath,
    });

    if (error) {
      if (isAclFunctionMissing(error.message)) {
        return null;
      }

      return null;
    }

    if (data === false) {
      return NextResponse.json({ ok: false, error: "Acesso negado para este recurso." }, { status: 403 });
    }

    return null;
  } catch {
    return null;
  }
}

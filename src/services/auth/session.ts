import { redirect } from "next/navigation";

import {
  assertPermission,
  parseAuthClaims,
  type PermissionContext,
  type PermissionKey,
} from "@/services/auth/permissions";
import { createServerSupabaseClient } from "@/services/supabase/server";

export async function getCurrentClaims() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return parseAuthClaims({
    sub: user.id,
    ...user.app_metadata,
    ...user.user_metadata,
  });
}

export async function requirePermission(
  permission: PermissionKey,
  context?: PermissionContext,
) {
  const claims = await getCurrentClaims();

  if (!claims) {
    redirect("/login");
  }

  assertPermission(claims, permission, {
    ...context,
    userId: claims.sub,
  });

  return claims;
}

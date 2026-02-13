"use client";

import { useMemo } from "react";

import {
  type AuthClaims,
  type PermissionContext,
  type PermissionKey,
  hasPermission,
  parseAuthClaims,
} from "@/services/auth/permissions";

type SessionLike = {
  user?: {
    id?: string;
    app_metadata?: Record<string, unknown>;
    user_metadata?: Record<string, unknown>;
  } | null;
};

export function usePermissions(session: SessionLike | null | undefined) {
  const claims = useMemo<AuthClaims>(() => {
    const appMetadata = session?.user?.app_metadata ?? {};
    const userMetadata = session?.user?.user_metadata ?? {};

    return parseAuthClaims({
      ...appMetadata,
      ...userMetadata,
      sub: session?.user?.id,
    });
  }, [session]);

  return {
    claims,
    can(permission: PermissionKey, context?: PermissionContext) {
      return hasPermission(claims, permission, {
        ...context,
        userId: claims.sub,
      });
    },
  };
}

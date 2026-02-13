import { z } from "zod";

export const scopeTypeSchema = z.enum(["org", "unit", "self"]);
export type ScopeType = z.infer<typeof scopeTypeSchema>;

export const permissionKeySchema = z.enum([
  "dashboard:read",
  "clientes:read",
  "clientes:write",
  "empresas:read",
  "empresas:write",
  "pedidos:read",
  "pedidos:write",
  "usuarios:read",
  "usuarios:write",
  "agenda:read",
  "agenda:write",
  "invoice:read",
  "portal:submit",
]);
export type PermissionKey = z.infer<typeof permissionKeySchema>;

export const permissionClaimSchema = z.object({
  key: permissionKeySchema,
  scope: scopeTypeSchema.default("org"),
  company_id: z.string().uuid().optional(),
  unit_id: z.string().uuid().optional(),
});
export type PermissionClaim = z.infer<typeof permissionClaimSchema>;

export const authClaimsSchema = z.object({
  sub: z.string().optional(),
  role_id: z.string().uuid().optional(),
  company_id: z.string().uuid().optional(),
  unit_id: z.string().uuid().optional(),
  permissions: z
    .array(z.union([permissionClaimSchema, permissionKeySchema]))
    .default([]),
});
export type AuthClaims = z.infer<typeof authClaimsSchema>;

export type PermissionContext = {
  unitId?: string;
  ownerId?: string;
  userId?: string;
};

function normalizePermissionClaims(claims: AuthClaims): PermissionClaim[] {
  return claims.permissions.map((permission) => {
    if (typeof permission === "string") {
      return {
        key: permission,
        scope: "org",
      };
    }

    return permission;
  });
}

export function parseAuthClaims(raw: unknown): AuthClaims {
  const parsed = authClaimsSchema.safeParse(raw);

  if (parsed.success) {
    return parsed.data;
  }

  return {
    permissions: [],
  };
}

export function hasPermission(
  claims: AuthClaims,
  permissionKey: PermissionKey,
  context?: PermissionContext,
) {
  const normalizedPermissions = normalizePermissionClaims(claims);
  const permission = normalizedPermissions.find((item) => item.key === permissionKey);

  if (!permission) {
    return false;
  }

  if (permission.scope === "org") {
    return true;
  }

  if (permission.scope === "unit") {
    if (!context?.unitId || !claims.unit_id) {
      return false;
    }

    return context.unitId === claims.unit_id;
  }

  if (permission.scope === "self") {
    if (!context?.ownerId || !context?.userId) {
      return false;
    }

    return context.ownerId === context.userId;
  }

  return false;
}

export function assertPermission(
  claims: AuthClaims,
  permissionKey: PermissionKey,
  context?: PermissionContext,
) {
  const allowed = hasPermission(claims, permissionKey, context);

  if (!allowed) {
    throw new Error(`Permission denied for ${permissionKey}`);
  }
}

import { CRM_SIDEBAR_PAGES, GESTAO_ACESSOS_PAGE_KEY } from "@/services/access-control/constants";
import type { AccessMatrixRow, CrmPage, UserPageAccess } from "@/services/access-control/types";
import { createAdminSupabaseClient } from "@/services/supabase/admin";
import { createServerSupabaseClient } from "@/services/supabase/server";

type LegacyUserContext = {
  id: number;
  organizacaoId: string;
  tipoAcesso: string;
  tipoAcesso2: string;
  ativo: boolean;
};

type AccessControlError = {
  ok: false;
  status: number;
  error: string;
};

type AccessControlSuccess<T> = {
  ok: true;
  value: T;
};

type AccessControlResult<T> = AccessControlSuccess<T> | AccessControlError;

export type AccessMatrixSnapshot = {
  pages: CrmPage[];
  rows: AccessMatrixRow[];
  currentPage: number;
  hasNextPage: boolean;
  totalRows: number;
};

function asString(value: unknown, fallback = "") {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return fallback;
}

function asNullableString(value: unknown) {
  const normalized = asString(value).trim();
  return normalized.length > 0 ? normalized : null;
}

function asPositiveInt(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    const intValue = Math.trunc(value);
    return intValue > 0 ? intValue : null;
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) {
      const intValue = Math.trunc(parsed);
      return intValue > 0 ? intValue : null;
    }
  }

  return null;
}

function normalizeRole(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function isManagerRole(tipoAcesso: string | null | undefined) {
  const normalized = normalizeRole(asString(tipoAcesso));
  return (
    normalized === "gestor" ||
    normalized === "superadm" ||
    normalized === "superadmin" ||
    normalized === "admin"
  );
}

function hasManagerProfile(tipoAcesso: string | null | undefined, tipoAcesso2: string | null | undefined) {
  return isManagerRole(tipoAcesso) || isManagerRole(tipoAcesso2);
}

function isAclObjectMissing(details: string) {
  const normalized = details.toLowerCase();
  return (
    normalized.includes("crm_pages") ||
    normalized.includes("crm_user_page_access") ||
    normalized.includes("crm_can_access_path") ||
    normalized.includes("does not exist") ||
    normalized.includes("42p01") ||
    normalized.includes("42883")
  );
}

async function resolveCurrentLegacyUserContext(): Promise<LegacyUserContext | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const admin = createAdminSupabaseClient();
    const query = admin
      .from("usuarios")
      .select("id,id_organizacao,tipo_acesso,tipo_acesso_2,usuario_ativo")
      .eq("uuid_user", user.id)
      .order("id", { ascending: false })
      .limit(1);

    let { data, error } = await query;

    if ((!data || data.length === 0) && user.email) {
      const byEmail = await admin
        .from("usuarios")
        .select("id,id_organizacao,tipo_acesso,tipo_acesso_2,usuario_ativo")
        .eq("email", user.email)
        .order("id", { ascending: false })
        .limit(1);

      data = byEmail.data;
      error = byEmail.error;
    }

    if (error || !data || data.length === 0) {
      return null;
    }

    const row = data[0] as Record<string, unknown>;
    const id = asPositiveInt(row.id);
    const organizacaoId = asNullableString(row.id_organizacao);

    if (!id || !organizacaoId) {
      return null;
    }

    return {
      id,
      organizacaoId,
      tipoAcesso: asString(row.tipo_acesso),
      tipoAcesso2: asString(row.tipo_acesso_2),
      ativo:
        typeof row.usuario_ativo === "boolean"
          ? row.usuario_ativo
          : asString(row.usuario_ativo).toLowerCase() === "true",
    };
  } catch {
    return null;
  }
}

function getFallbackPages(): CrmPage[] {
  return CRM_SIDEBAR_PAGES.map((item) => ({
    key: item.key,
    path: item.path,
    label: item.label,
    sortOrder: item.sortOrder,
    isActive: true,
  }));
}

async function getCrmPages(): Promise<CrmPage[]> {
  try {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from("crm_pages")
      .select("key,path,label,sort_order,is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("key", { ascending: true });

    if (error) {
      if (isAclObjectMissing(error.message)) {
        return getFallbackPages();
      }
      return getFallbackPages();
    }

    if (!data || data.length === 0) {
      return getFallbackPages();
    }

    return (data as Array<Record<string, unknown>>).map((row, index) => ({
      key: asString(row.key),
      path: asString(row.path),
      label: asString(row.label, asString(row.key)),
      sortOrder: asPositiveInt(row.sort_order) ?? index + 1,
      isActive: Boolean(row.is_active),
    }));
  } catch {
    return getFallbackPages();
  }
}

export async function getCurrentAllowedSidebarPaths(): Promise<string[] | null> {
  try {
    const context = await resolveCurrentLegacyUserContext();
    if (!context || !context.ativo) {
      return null;
    }

    const pages = await getCrmPages();
    if (!pages.length) {
      return null;
    }

    const defaultAccess = new Map<string, boolean>();
    for (const page of pages) {
      if (!hasManagerProfile(context.tipoAcesso, context.tipoAcesso2) && page.key === GESTAO_ACESSOS_PAGE_KEY) {
        defaultAccess.set(page.key, false);
      } else {
        defaultAccess.set(page.key, true);
      }
    }

    try {
      const admin = createAdminSupabaseClient();
      const pageKeys = pages.map((item) => item.key);
      const { data, error } = await admin
        .from("crm_user_page_access")
        .select("page_key,allow")
        .eq("id_usuario", context.id)
        .eq("id_organizacao", context.organizacaoId)
        .in("page_key", pageKeys);

      if (!error && data && data.length > 0) {
        for (const row of data as Array<Record<string, unknown>>) {
          const pageKey = asString(row.page_key);
          const allow = Boolean(row.allow);
          if (
            pageKey === GESTAO_ACESSOS_PAGE_KEY &&
            !hasManagerProfile(context.tipoAcesso, context.tipoAcesso2)
          ) {
            defaultAccess.set(pageKey, false);
            continue;
          }
          defaultAccess.set(pageKey, allow);
        }
      }
    } catch {
      // fallback para permissao default caso tabela ainda nao exista
    }

    return pages
      .filter((page) => defaultAccess.get(page.key) !== false)
      .map((page) => page.path);
  } catch {
    return null;
  }
}

export async function getCurrentUserPathAccess(pathname: string): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    const { data, error } = await supabase.rpc("crm_can_access_path", {
      p_path: pathname,
    });

    if (error) {
      return true;
    }

    return data !== false;
  } catch {
    return true;
  }
}

async function requireManagerContext(): Promise<AccessControlResult<LegacyUserContext>> {
  const context = await resolveCurrentLegacyUserContext();
  if (!context) {
    return {
      ok: false,
      status: 401,
      error: "Nao autenticado.",
    };
  }

  if (!context.ativo) {
    return {
      ok: false,
      status: 403,
      error: "Usuario inativo.",
    };
  }

  if (!hasManagerProfile(context.tipoAcesso, context.tipoAcesso2)) {
    return {
      ok: false,
      status: 403,
      error: "Acesso restrito a Gestor/SuperAdm.",
    };
  }

  return {
    ok: true,
    value: context,
  };
}

function buildUserDisplayRole(row: Record<string, unknown>) {
  const tipo = asNullableString(row.tipo_acesso);
  if (tipo) {
    return tipo;
  }
  return asNullableString(row.tipo_acesso_2);
}

function isRowManager(row: Record<string, unknown>) {
  return hasManagerProfile(asNullableString(row.tipo_acesso), asNullableString(row.tipo_acesso_2));
}

function escapeSearchTerm(search: string) {
  return search.replace(/,/g, " ").trim();
}

export async function getAccessMatrixSnapshot(args: {
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<AccessControlResult<AccessMatrixSnapshot>> {
  const manager = await requireManagerContext();
  if (!manager.ok) {
    return manager;
  }

  const currentPage = Math.max(1, Math.trunc(args.page ?? 1));
  const pageSize = Math.max(1, Math.min(100, Math.trunc(args.pageSize ?? 10)));
  const offset = (currentPage - 1) * pageSize;
  const search = asString(args.search).trim();

  const pages = await getCrmPages();
  const pageKeys = pages.map((page) => page.key);

  try {
    const admin = createAdminSupabaseClient();
    let query = admin
      .from("usuarios")
      .select("id,nome,email,tipo_acesso,tipo_acesso_2,usuario_ativo,id_organizacao", {
        count: "exact",
      })
      .eq("id_organizacao", manager.value.organizacaoId)
      .eq("usuario_ativo", true)
      .order("nome", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (search) {
      const escaped = escapeSearchTerm(search);
      query = query.or(`nome.ilike.%${escaped}%,email.ilike.%${escaped}%`);
    }

    const { data, error, count } = await query;
    if (error) {
      return {
        ok: false,
        status: 502,
        error: `Falha ao listar usuarios para matriz: ${error.message}`,
      };
    }

    const userRows = (data as Array<Record<string, unknown>> | null) ?? [];
    const userIds = userRows
      .map((row) => asPositiveInt(row.id))
      .filter((value): value is number => Boolean(value));

    const accessByUserPage = new Map<string, boolean>();
    if (userIds.length > 0 && pageKeys.length > 0) {
      const { data: accessRows, error: accessError } = await admin
        .from("crm_user_page_access")
        .select("id_usuario,page_key,allow")
        .eq("id_organizacao", manager.value.organizacaoId)
        .in("id_usuario", userIds)
        .in("page_key", pageKeys);

      if (accessError && !isAclObjectMissing(accessError.message)) {
        return {
          ok: false,
          status: 502,
          error: `Falha ao listar overrides de acesso: ${accessError.message}`,
        };
      }

      for (const row of (accessRows as Array<Record<string, unknown>> | null) ?? []) {
        const idUsuario = asPositiveInt(row.id_usuario);
        const pageKey = asString(row.page_key);
        if (!idUsuario || !pageKey) {
          continue;
        }
        accessByUserPage.set(`${idUsuario}:${pageKey}`, Boolean(row.allow));
      }
    }

    const rows: AccessMatrixRow[] = userRows
      .map((row) => {
        const idUsuario = asPositiveInt(row.id);
        if (!idUsuario) {
          return null;
        }

        const role = buildUserDisplayRole(row);
        const acessos: Record<string, boolean> = {};

        for (const page of pages) {
          const mapKey = `${idUsuario}:${page.key}`;
          const override = accessByUserPage.get(mapKey);
          const isTargetManager = isRowManager(row);

          if (page.key === GESTAO_ACESSOS_PAGE_KEY && !isTargetManager) {
            acessos[page.key] = false;
            continue;
          }

          acessos[page.key] = override ?? true;
        }

        return {
          idUsuario,
          nome: asString(row.nome, `Usuario ${idUsuario}`),
          email: asNullableString(row.email),
          tipoAcesso: role,
          acessos,
        } satisfies AccessMatrixRow;
      })
      .filter((value): value is AccessMatrixRow => Boolean(value));

    const totalRows = typeof count === "number" ? count : rows.length;
    const hasNextPage = offset + rows.length < totalRows;

    return {
      ok: true,
      value: {
        pages,
        rows,
        currentPage,
        hasNextPage,
        totalRows,
      },
    };
  } catch (error) {
    return {
      ok: false,
      status: 500,
      error:
        error instanceof Error
          ? `Erro interno ao montar matriz de acessos: ${error.message}`
          : "Erro interno ao montar matriz de acessos.",
    };
  }
}

export async function toggleUserPageAccess(args: {
  idUsuario: number;
  pageKey: string;
  allow: boolean;
}): Promise<AccessControlResult<UserPageAccess>> {
  const manager = await requireManagerContext();
  if (!manager.ok) {
    return manager;
  }

  const idUsuario = Math.trunc(args.idUsuario);
  const pageKey = asString(args.pageKey).trim();

  if (idUsuario <= 0) {
    return {
      ok: false,
      status: 400,
      error: "id_usuario invalido.",
    };
  }

  if (!pageKey) {
    return {
      ok: false,
      status: 400,
      error: "page_key obrigatorio.",
    };
  }

  try {
    const admin = createAdminSupabaseClient();

    const { data: pageData, error: pageError } = await admin
      .from("crm_pages")
      .select("key")
      .eq("key", pageKey)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (pageError && !isAclObjectMissing(pageError.message)) {
      return {
        ok: false,
        status: 502,
        error: `Falha ao validar pagina de acesso: ${pageError.message}`,
      };
    }

    const pageExists =
      Boolean(pageData) || CRM_SIDEBAR_PAGES.some((page) => page.key === pageKey);
    if (!pageExists) {
      return {
        ok: false,
        status: 404,
        error: "Pagina nao encontrada para ACL.",
      };
    }

    const { data: targetUserRow, error: targetUserError } = await admin
      .from("usuarios")
      .select("id,id_organizacao,tipo_acesso,tipo_acesso_2")
      .eq("id", idUsuario)
      .eq("id_organizacao", manager.value.organizacaoId)
      .limit(1)
      .maybeSingle();

    if (targetUserError) {
      return {
        ok: false,
        status: 502,
        error: `Falha ao validar usuario alvo: ${targetUserError.message}`,
      };
    }

    if (!targetUserRow) {
      return {
        ok: false,
        status: 404,
        error: "Usuario alvo nao encontrado na organizacao.",
      };
    }

    const targetUser = targetUserRow as Record<string, unknown>;
    if (pageKey === GESTAO_ACESSOS_PAGE_KEY && !isRowManager(targetUser) && args.allow) {
      return {
        ok: false,
        status: 400,
        error: "Somente Gestor/SuperAdm pode receber acesso a Gestao de acessos.",
      };
    }

    const { data, error } = await admin
      .from("crm_user_page_access")
      .upsert(
        {
          id_usuario: idUsuario,
          id_organizacao: manager.value.organizacaoId,
          page_key: pageKey,
          allow: args.allow,
          created_by: manager.value.id,
          updated_by: manager.value.id,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id_usuario,page_key",
        },
      )
      .select("id_usuario,id_organizacao,page_key,allow")
      .maybeSingle();

    if (error) {
      return {
        ok: false,
        status: 502,
        error: `Falha ao salvar override de acesso: ${error.message}`,
      };
    }

    if (!data) {
      return {
        ok: false,
        status: 502,
        error: "Override de acesso nao retornou dados apos salvar.",
      };
    }

    const row = data as Record<string, unknown>;
    return {
      ok: true,
      value: {
        idUsuario: asPositiveInt(row.id_usuario) ?? idUsuario,
        idOrganizacao: asString(row.id_organizacao, manager.value.organizacaoId),
        pageKey: asString(row.page_key, pageKey),
        allow: Boolean(row.allow),
      },
    };
  } catch (error) {
    return {
      ok: false,
      status: 500,
      error:
        error instanceof Error
          ? `Erro interno ao atualizar override de acesso: ${error.message}`
          : "Erro interno ao atualizar override de acesso.",
    };
  }
}

import { type NextRequest, NextResponse } from "next/server";

import { guardApiRouteAccess } from "@/services/access-control/api-guard";
import { createAdminSupabaseClient } from "@/services/supabase/admin";

import { asNullableString, resolveCampanhasRequestContext } from "../_shared";

type CampanhaListRow = {
  id: string;
  nomeCampanha: string;
  apelido: string;
  textoChave: string;
  ativo: boolean;
};

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(1, Math.trunc(parsed));
}

export async function GET(request: NextRequest) {
  const guardResponse = await guardApiRouteAccess("/campanhas");
  if (guardResponse) {
    return guardResponse;
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const ativoParam = request.nextUrl.searchParams.get("ativo")?.trim().toLowerCase() ?? "todos";
  const ativoFilter = ativoParam === "ativo" ? true : ativoParam === "inativo" ? false : null;
  const page = parsePositiveInt(request.nextUrl.searchParams.get("page"), 1);
  const pageSize = Math.min(50, parsePositiveInt(request.nextUrl.searchParams.get("page_size"), 10));
  const rangeFrom = (page - 1) * pageSize;
  const rangeTo = rangeFrom + pageSize - 1;
  const context = await resolveCampanhasRequestContext();
  const admin = createAdminSupabaseClient();

  let queryBuilder = admin
    .from("campanhas")
    .select("id,nome_campanha,apelido,texto_chave,ativo,created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(rangeFrom, rangeTo);

  const organizacaoId = asNullableString(context.organizacaoId);
  if (organizacaoId) {
    queryBuilder = queryBuilder.eq("id_organizacao", organizacaoId);
  }

  if (ativoFilter !== null) {
    queryBuilder = queryBuilder.eq("ativo", ativoFilter);
  }

  if (q.length > 0) {
    const escaped = q.replace(/[%_,]/g, " ");
    queryBuilder = queryBuilder.or(
      `nome_campanha.ilike.%${escaped}%,apelido.ilike.%${escaped}%,texto_chave.ilike.%${escaped}%`,
    );
  }

  const { data, error, count } = await queryBuilder;
  if (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message || "Falha ao listar campanhas.",
      },
      { status: 502 },
    );
  }

  const rows: CampanhaListRow[] = Array.isArray(data)
    ? data
        .map((item) => {
          const row = item as Record<string, unknown>;
          const idRaw = row.id;
          if (typeof idRaw !== "number" && typeof idRaw !== "string") {
            return null;
          }

          return {
            id: String(idRaw),
            nomeCampanha: asNullableString(row.nome_campanha) ?? "",
            apelido: asNullableString(row.apelido) ?? "",
            textoChave: asNullableString(row.texto_chave) ?? "",
            ativo: Boolean(row.ativo ?? true),
          } satisfies CampanhaListRow;
        })
        .filter((item): item is CampanhaListRow => item !== null)
    : [];

  return NextResponse.json({
    ok: true,
    rows,
    currentPage: page,
    pageSize,
    totalCount: typeof count === "number" ? count : null,
    hasNextPage: typeof count === "number" ? rangeTo + 1 < count : rows.length === pageSize,
  });
}

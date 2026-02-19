import { NextResponse, type NextRequest } from "next/server";

import { getAccessMatrixSnapshot } from "@/services/access-control/server";

function getSearchValue(value: string | null) {
  return (value ?? "").trim();
}

function parsePositiveInt(value: string, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(1, Math.trunc(parsed));
}

export async function GET(request: NextRequest) {
  const search = getSearchValue(request.nextUrl.searchParams.get("search"));
  const page = parsePositiveInt(getSearchValue(request.nextUrl.searchParams.get("page")), 1);
  const pageSize = parsePositiveInt(getSearchValue(request.nextUrl.searchParams.get("page_size")), 10);
  const organizationId = getSearchValue(request.nextUrl.searchParams.get("org_id"));

  const result = await getAccessMatrixSnapshot({
    search,
    page,
    pageSize,
    organizationId,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  const accessMap = Object.fromEntries(
    result.value.rows.map((row) => [String(row.idUsuario), row.acessos]),
  );

  return NextResponse.json({
    ok: true,
    ...result.value,
    users: result.value.rows,
    accessMap,
  });
}

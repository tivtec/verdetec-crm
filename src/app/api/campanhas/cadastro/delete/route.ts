import { type NextRequest, NextResponse } from "next/server";

import { guardApiRouteAccess } from "@/services/access-control/api-guard";
import { createAdminSupabaseClient } from "@/services/supabase/admin";

import { asNullableString, resolveCampanhasRequestContext } from "../_shared";

type DeleteCampanhaPayload = {
  id?: unknown;
};

export async function DELETE(request: NextRequest) {
  const guardResponse = await guardApiRouteAccess("/campanhas");
  if (guardResponse) {
    return guardResponse;
  }

  const payload = (await request.json().catch(() => null)) as DeleteCampanhaPayload | null;
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ ok: false, error: "Payload invalido." }, { status: 400 });
  }

  const id = asNullableString(payload.id);
  if (!id) {
    return NextResponse.json({ ok: false, error: "id obrigatorio." }, { status: 400 });
  }

  const context = await resolveCampanhasRequestContext();
  const admin = createAdminSupabaseClient();

  let query = admin.from("campanhas").delete().eq("id", Number(id));
  const organizacaoId = asNullableString(context.organizacaoId);
  if (organizacaoId) {
    query = query.eq("id_organizacao", organizacaoId);
  }

  const { data, error } = await query.select("id").maybeSingle();
  if (error || !data) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message ?? "Falha ao excluir campanha.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    id: String((data as Record<string, unknown>).id ?? id),
  });
}

import { NextResponse, type NextRequest } from "next/server";

import { setCurrentActiveModule } from "@/services/access-control/server";

type SetModuloAtivoPayload = {
  module_id?: string | null;
};

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as SetModuloAtivoPayload | null;
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ ok: false, error: "Payload invalido." }, { status: 400 });
  }

  const moduleId = typeof payload.module_id === "string" ? payload.module_id.trim() : "";
  if (!moduleId) {
    return NextResponse.json({ ok: false, error: "module_id obrigatorio." }, { status: 400 });
  }

  const result = await setCurrentActiveModule(moduleId);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    selected_module_id: result.value.selectedModuleId,
    redirect_path: result.value.redirectPath,
  });
}


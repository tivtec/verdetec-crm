import { NextResponse, type NextRequest } from "next/server";

import { toggleUserModuleAccess } from "@/services/access-control/server";

type ToggleModuloPayload = {
  id_usuario?: number | string | null;
  module_id?: string | null;
  allow?: boolean | string | number | null;
  org_id?: string | null;
};

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

function asBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (value === 1) {
      return true;
    }
    if (value === 0) {
      return false;
    }
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1") {
      return true;
    }
    if (normalized === "false" || normalized === "0") {
      return false;
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as ToggleModuloPayload | null;
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ ok: false, error: "Payload invalido." }, { status: 400 });
  }

  const idUsuario = asPositiveInt(payload.id_usuario);
  const moduleId = typeof payload.module_id === "string" ? payload.module_id.trim() : "";
  const allow = asBoolean(payload.allow);
  const organizationId = typeof payload.org_id === "string" ? payload.org_id.trim() : "";

  if (!idUsuario) {
    return NextResponse.json({ ok: false, error: "id_usuario obrigatorio." }, { status: 400 });
  }

  if (!moduleId) {
    return NextResponse.json({ ok: false, error: "module_id obrigatorio." }, { status: 400 });
  }

  if (allow === null) {
    return NextResponse.json({ ok: false, error: "allow obrigatorio." }, { status: 400 });
  }

  if (!organizationId) {
    return NextResponse.json({ ok: false, error: "org_id obrigatorio." }, { status: 400 });
  }

  const result = await toggleUserModuleAccess({
    idUsuario,
    moduleId,
    allow,
    organizationId,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    access: result.value,
  });
}


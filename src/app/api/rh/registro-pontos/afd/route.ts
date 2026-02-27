import { NextRequest, NextResponse } from "next/server";

import { guardApiRouteAccess } from "@/services/access-control/api-guard";
import { generateRhAfdByDirectQuery, generateRhAfdByEdgeFunction } from "@/services/rh/api";

function asSafePositiveInt(value: string | null) {
  const parsed = Number(value ?? "");
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, Math.trunc(parsed));
}

function asNullableString(value: string | null) {
  const parsed = (value ?? "").trim();
  return parsed.length > 0 ? parsed : null;
}

function isSimpleDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function toIsoStart(value: string) {
  if (isSimpleDate(value)) {
    return `${value}T00:00:00.000Z`;
  }
  return value;
}

function toIsoEnd(value: string) {
  if (isSimpleDate(value)) {
    return `${value}T23:59:59.999Z`;
  }
  return value;
}

function resolveDefaultDateRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

function buildDownloadResponse(fileName: string, contentType: string, content: string) {
  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: NextRequest) {
  const guardResponse = await guardApiRouteAccess("/rh");
  if (guardResponse) {
    return guardResponse;
  }

  const usuarioId = asSafePositiveInt(request.nextUrl.searchParams.get("id_usuario"));
  const idOrganizacao = asNullableString(request.nextUrl.searchParams.get("id_organizacao"));
  if (usuarioId <= 0 || !idOrganizacao) {
    return NextResponse.json(
      { ok: false, error: "Informe id_usuario e id_organizacao validos para baixar o AFD." },
      { status: 400 },
    );
  }

  const dataInicioRaw = asNullableString(request.nextUrl.searchParams.get("data_inicio"));
  const dataFimRaw = asNullableString(request.nextUrl.searchParams.get("data_fim"));
  const defaults = resolveDefaultDateRange();

  const startDate = dataInicioRaw ? toIsoStart(dataInicioRaw) : defaults.startDate;
  const endDate = dataFimRaw ? toIsoEnd(dataFimRaw) : defaults.endDate;

  const afdGenerate = await generateRhAfdByEdgeFunction({
    idUsuario: usuarioId,
    idOrganizacao,
    startDate,
    endDate,
  });

  if (!afdGenerate.ok) {
    const directFallback = await generateRhAfdByDirectQuery({
      idUsuario: usuarioId,
      idOrganizacao,
      startDate,
      endDate,
    });

    if (directFallback.ok) {
      return buildDownloadResponse(
        directFallback.fileName,
        directFallback.contentType,
        directFallback.content,
      );
    }

    return NextResponse.json(
      { ok: false, error: `${afdGenerate.error} | fallback: ${directFallback.error}` },
      { status: 502 },
    );
  }

  const fileResponse = await fetch(afdGenerate.url, { cache: "no-store" });
  if (!fileResponse.ok) {
    const directFallback = await generateRhAfdByDirectQuery({
      idUsuario: usuarioId,
      idOrganizacao,
      startDate,
      endDate,
    });

    if (directFallback.ok) {
      return buildDownloadResponse(
        directFallback.fileName,
        directFallback.contentType,
        directFallback.content,
      );
    }

    return NextResponse.json(
      { ok: false, error: "Arquivo AFD foi gerado, mas nao foi possivel fazer o download." },
      { status: 502 },
    );
  }

  const fileBuffer = await fileResponse.arrayBuffer();
  const contentType = fileResponse.headers.get("Content-Type") || "text/plain; charset=utf-8";

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${afdGenerate.fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}

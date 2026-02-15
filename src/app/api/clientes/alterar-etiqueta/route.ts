import { NextResponse, type NextRequest } from "next/server";

import { createAdminSupabaseClient } from "@/services/supabase/admin";
import { createServerSupabaseClient } from "@/services/supabase/server";

const UPDATE_ETIQUETA_ENDPOINT =
  process.env.CLIENTES_ALTERAR_ETIQUETA_ENDPOINT ??
  "https://whvtec2.verdetec.dev.br/webhook/fd0c5d02-f1d6-459e-88d2-e280bf6d956a";
const UPDATE_ETIQUETA_61_ENDPOINT =
  process.env.CLIENTES_ALTERAR_ETIQUETA_61_ENDPOINT ??
  "https://whvtec4.verdetec.dev.br/webhook/e78cecf5-62f6-4766-95da-dc9b1d289ec1";

type UpdateEtiquetaPayload = {
  id_user?: number | string | null;
  id_usuario?: number | string | null;
  id_usuario_param?: number | string | null;
  id_agregacao?: number | string | null;
  id_pessoa?: number | string | null;
  label?: string | null;
  etiqueta_drop?: number | string | null;
  metragem?: string | number | null;
  cep?: string | number | null;
  nome?: string | number | null;
  fone?: string | number | null;
};

function asPositiveInt(value: unknown) {
  if (typeof value === "number") {
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

function asLabel(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(Math.trunc(value));
  }

  if (typeof value === "string") {
    return value.trim();
  }

  return "";
}

function normalizeEtiquetaCode(value: unknown) {
  const label = asLabel(value);
  if (!label) {
    return "";
  }

  const digits = label.match(/\d{1,2}/)?.[0];
  if (!digits) {
    return "";
  }

  return digits.padStart(2, "0");
}

function toEtiquetaCode(label: string) {
  const digits = label.replace(/\D/g, "").slice(0, 2);
  if (!digits) {
    return "";
  }

  return `#${digits.padStart(2, "0")}`;
}

function toNumberValue(value: string) {
  const cleaned = value.replace(/[^\d,.-]/g, "").trim();
  if (!cleaned) {
    return null;
  }

  const normalized =
    cleaned.includes(",") && !cleaned.includes(".")
      ? cleaned.replace(",", ".")
      : cleaned.replace(/,/g, "");

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

async function parseResponseBody(response: Response) {
  const responseText = await response.text();
  if (!responseText.trim()) {
    return null;
  }

  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    return responseText;
  }
}

async function resolvePessoaIdByAgregacao(idAgregacao: number) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("agregacao")
    .select("id_pessoa")
    .eq("id", idAgregacao)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return asPositiveInt((data as Record<string, unknown>).id_pessoa);
}

async function resolvePessoaContato(idPessoa: number | null, idAgregacao: number | null) {
  const resolvedPessoaId = idPessoa ?? (idAgregacao ? await resolvePessoaIdByAgregacao(idAgregacao) : null);
  if (!resolvedPessoaId) {
    return {
      pessoaId: null,
      nome: "",
      fone: "",
    };
  }

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("pessoa")
    .select("id,nome,telefone")
    .eq("id", resolvedPessoaId)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return {
      pessoaId: resolvedPessoaId,
      nome: "",
      fone: "",
    };
  }

  return {
    pessoaId: resolvedPessoaId,
    nome: asLabel((data as Record<string, unknown>).nome),
    fone: asLabel((data as Record<string, unknown>).telefone),
  };
}

async function getAgregacaoEtiquetaCode(idAgregacao: number) {
  const admin = createAdminSupabaseClient();
  const { data: agregacaoRow, error: agregacaoError } = await admin
    .from("agregacao")
    .select("id_etiqueta")
    .eq("id", idAgregacao)
    .limit(1)
    .maybeSingle();

  if (agregacaoError || !agregacaoRow) {
    return "";
  }

  const idEtiqueta = asPositiveInt((agregacaoRow as Record<string, unknown>).id_etiqueta);
  if (!idEtiqueta) {
    return "";
  }

  const { data: etiquetaRow, error: etiquetaError } = await admin
    .from("etiqueta")
    .select("etiqueta")
    .eq("id", idEtiqueta)
    .limit(1)
    .maybeSingle();

  if (etiquetaError || !etiquetaRow) {
    return "";
  }

  return asLabel((etiquetaRow as Record<string, unknown>).etiqueta).toUpperCase();
}

async function delay(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function resolveCurrentUsuarioId() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("usuarios")
    .select("id")
    .eq("uuid_user", user.id)
    .order("id", { ascending: false })
    .limit(1);

  if (error || !data?.length) {
    return null;
  }

  return asPositiveInt((data[0] as Record<string, unknown>).id);
}

async function resolveAgregacaoIdByPessoa(pessoaId: number, usuarioId: number | null) {
  const admin = createAdminSupabaseClient();

  if (usuarioId) {
    const { data, error } = await admin
      .from("agregacao")
      .select("id")
      .eq("id_pessoa", pessoaId)
      .eq("id_usuario", usuarioId)
      .order("id", { ascending: false })
      .limit(1);

    if (!error && data?.length) {
      return asPositiveInt((data[0] as Record<string, unknown>).id);
    }
  }

  const { data, error } = await admin
    .from("agregacao")
    .select("id")
    .eq("id_pessoa", pessoaId)
    .order("id", { ascending: false })
    .limit(1);

  if (error || !data?.length) {
    return null;
  }

  return asPositiveInt((data[0] as Record<string, unknown>).id);
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as UpdateEtiquetaPayload | null;
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ ok: false, error: "Payload invalido." }, { status: 400 });
  }

  const etiquetaCode = normalizeEtiquetaCode(payload.label ?? payload.etiqueta_drop);
  if (!etiquetaCode) {
    return NextResponse.json({ ok: false, error: "Label obrigatoria." }, { status: 400 });
  }

  if (etiquetaCode === "61") {
    const metragem = asLabel(payload.metragem);
    const cep = asLabel(payload.cep);

    if (!metragem) {
      return NextResponse.json({ ok: false, error: "Metragem obrigatoria para etiqueta 61." }, { status: 400 });
    }

    if (!cep) {
      return NextResponse.json({ ok: false, error: "CEP obrigatorio para etiqueta 61." }, { status: 400 });
    }

    const pessoaId = asPositiveInt(payload.id_pessoa);
    const idAgregacao = asPositiveInt(payload.id_agregacao);
    const pessoaContato = await resolvePessoaContato(pessoaId, idAgregacao);
    const nome = asLabel(payload.nome) || pessoaContato.nome;
    const fone = asLabel(payload.fone) || pessoaContato.fone;
    const sqm = toNumberValue(metragem);

    if (!nome || !fone) {
      return NextResponse.json(
        { ok: false, error: "Nao foi possivel resolver nome e telefone do cliente para etiqueta 61." },
        { status: 400 },
      );
    }

    const webhookPayload = {
      metragem,
      sqm: sqm ?? metragem,
      fone,
      phone: fone,
      telefone: fone,
      whatsapp: fone,
      email: "crm@verdetec.com",
      nome,
      name: nome,
      cep,
      umbler: true,
    };

    try {
      const response = await fetch(UPDATE_ETIQUETA_61_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(webhookPayload),
        cache: "no-store",
      });

      const parsedBody = await parseResponseBody(response);
      if (!response.ok) {
        return NextResponse.json(
          {
            ok: false,
            error: "Webhook da etiqueta 61 retornou erro.",
            status: response.status,
            details: parsedBody,
            sent: webhookPayload,
          },
          { status: 502 },
        );
      }

      return NextResponse.json({
        ok: true,
        flow: "61",
        confirmed: false,
        result: parsedBody,
        sent: webhookPayload,
        pessoa_id: pessoaContato.pessoaId,
      });
    } catch {
      return NextResponse.json(
        { ok: false, error: "Falha de rede ao chamar webhook da etiqueta 61." },
        { status: 502 },
      );
    }
  }

  let idUser =
    asPositiveInt(payload.id_user) ??
    asPositiveInt(payload.id_usuario_param) ??
    asPositiveInt(payload.id_usuario);
  if (!idUser) {
    idUser = await resolveCurrentUsuarioId();
  }

  if (!idUser) {
    return NextResponse.json({ ok: false, error: "Nao foi possivel resolver id_user." }, { status: 400 });
  }

  let idAgregacao = asPositiveInt(payload.id_agregacao);
  if (!idAgregacao) {
    const pessoaId = asPositiveInt(payload.id_pessoa);
    if (!pessoaId) {
      return NextResponse.json(
        { ok: false, error: "Nao foi possivel resolver id_agregacao sem id_pessoa." },
        { status: 400 },
      );
    }

    idAgregacao = await resolveAgregacaoIdByPessoa(pessoaId, idUser);
  }

  if (!idAgregacao) {
    return NextResponse.json({ ok: false, error: "Nao foi possivel resolver id_agregacao." }, { status: 400 });
  }

  const webhookPayload = {
    id_user: idUser,
    id_usuario: idUser,
    id_usuario_param: idUser,
    id_agregacao: idAgregacao,
    label: etiquetaCode,
    etiqueta_drop: Number(etiquetaCode),
  };
  const expectedEtiqueta = toEtiquetaCode(etiquetaCode);
  const beforeEtiqueta = await getAgregacaoEtiquetaCode(idAgregacao);

  try {
    const response = await fetch(UPDATE_ETIQUETA_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookPayload),
      cache: "no-store",
    });

    const parsedBody = await parseResponseBody(response);

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "Webhook de alteracao de etiqueta retornou erro.",
          status: response.status,
          details: parsedBody,
        },
        { status: 502 },
      );
    }

    let afterEtiqueta = "";
    for (let attempt = 0; attempt < 4; attempt += 1) {
      afterEtiqueta = await getAgregacaoEtiquetaCode(idAgregacao);
      if (expectedEtiqueta && afterEtiqueta === expectedEtiqueta) {
        return NextResponse.json({
          ok: true,
          confirmed: true,
          result: parsedBody,
          sent: webhookPayload,
          etiqueta_before: beforeEtiqueta,
          etiqueta_after: afterEtiqueta,
        });
      }
      await delay(1200);
    }

    return NextResponse.json({
      ok: true,
      confirmed: false,
      message:
        "Etiqueta enviada com sucesso. A confirmacao da atualizacao pode ocorrer com atraso.",
      sent: webhookPayload,
      etiqueta_before: beforeEtiqueta,
      etiqueta_after: afterEtiqueta,
      expected: expectedEtiqueta,
      webhook_result: parsedBody,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Falha de rede ao chamar webhook de alteracao de etiqueta." },
      { status: 502 },
    );
  }
}

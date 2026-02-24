import { randomUUID } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { createAdminSupabaseClient } from "@/services/supabase/admin";
import { createServerSupabaseClient } from "@/services/supabase/server";

const CADASTRAR_CONTRATO_ENDPOINT =
  "https://whvtec2.verdetec.dev.br/webhook/15af86ec-056e-4a6a-b564-f225134717a8";
const ENVIAR_ARQUIVO_CONTRATO_ENDPOINT =
  "https://whvtec2.verdetec.dev.br/webhook/29cf27a9-a47a-45f7-8f98-302b66912455";

type CadastrarContratoPayload = {
  id_pessoa?: number | string | null;
  id_agregacao?: number | string | null;
  telefone_proposta?: string;
  telefone_cobranca?: string;
  email_nota_fiscal?: string;
  email_responsavel?: string;
  numero_identificacao?: string;
};

type DebugEntry = {
  at: string;
  step: string;
  data?: unknown;
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

function isDebugEnabled(request: NextRequest) {
  if (process.env.CRM_DEBUG_LOGS === "true") {
    return true;
  }

  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  return request.headers.get("x-debug") === "1";
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

async function resolveAgregacaoData(idAgregacao: number) {
  const admin = createAdminSupabaseClient();

  const { data, error } = await admin
    .from("agregacao")
    .select("id_proposta_valor, id_pessoa, id_usuario")
    .eq("id", idAgregacao)
    .order("id", { ascending: false })
    .limit(1);

  if (error || !data?.length) {
    return null;
  }

  const row = data[0] as Record<string, unknown>;
  return {
    idPropostaValor: asPositiveInt(row.id_proposta_valor),
    idPessoa: asPositiveInt(row.id_pessoa),
    idUsuario: asPositiveInt(row.id_usuario),
  };
}

async function uploadFileToSupabase(file: File, bucketName: string, fileName: string) {
  const admin = createAdminSupabaseClient();
  
  const arrayBuffer = await file.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);

  const { data, error } = await admin.storage
    .from(bucketName)
    .upload(fileName, fileBuffer, {
      contentType: file.type,
      duplex: "half",
      upsert: false,
    });

  if (error) {
    throw error;
  }

  const { data: urlData } = admin.storage
    .from(bucketName)
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

export async function POST(request: NextRequest) {
  const debugId = randomUUID();
  const startedAt = Date.now();
  const debugEnabled = isDebugEnabled(request);
  const debugEntries: DebugEntry[] = [];
  const pushDebug = (step: string, data?: unknown) => {
    if (!debugEnabled) {
      return;
    }

    debugEntries.push({
      at: new Date().toISOString(),
      step,
      data,
    });
    console.log(`[clientes/cadastrar-contrato][${debugId}] ${step}`, data ?? "");
  };

  pushDebug("request.received");

  try {
    const formData = await request.formData();
    pushDebug("request.parsed_formdata");

    const idPessoa = asPositiveInt(formData.get("id_pessoa"));
    const idAgregacao = asPositiveInt(formData.get("id_agregacao"));
    const telefoneProposta = formData.get("telefone_proposta")?.toString() ?? "";
    const telefoneCobranca = formData.get("telefone_cobranca")?.toString() ?? "";
    const emailNotaFiscal = formData.get("email_nota_fiscal")?.toString() ?? "";
    const emailResponsavel = formData.get("email_responsavel")?.toString() ?? "";
    const numeroIdentificacao = formData.get("numero_identificacao")?.toString() ?? "";
    const arquivoContrato = formData.get("arquivo_contrato") as File | null;

    pushDebug("request.parsed_fields", {
      id_pessoa: idPessoa,
      id_agregacao: idAgregacao,
      telefone_proposta: telefoneProposta,
      telefone_cobranca: telefoneCobranca,
      email_nota_fiscal: emailNotaFiscal,
      email_responsavel: emailResponsavel,
      numero_identificacao: numeroIdentificacao,
      has_arquivo: !!arquivoContrato,
    });

    if (!idAgregacao && !idPessoa) {
      return NextResponse.json(
        {
          ok: false,
          error: "id_agregacao ou id_pessoa obrigatorios.",
          debug_id: debugId,
          debug: debugEnabled ? debugEntries : undefined,
        },
        { status: 400 },
      );
    }

    let agregacaoData = idAgregacao ? await resolveAgregacaoData(idAgregacao) : null;
    pushDebug("resolve.agregacao_data", { value: agregacaoData });

    if (!agregacaoData) {
      if (!idPessoa) {
        return NextResponse.json(
          {
            ok: false,
            error: "Nao foi possivel resolver dados da agregacao.",
            debug_id: debugId,
            debug: debugEnabled ? debugEntries : undefined,
          },
          { status: 400 },
        );
      }

      agregacaoData = {
        idPropostaValor: null,
        idPessoa,
        idUsuario: null,
      };
    }

    if (!telefoneProposta) {
      return NextResponse.json(
        {
          ok: false,
          error: "telefone_proposta obrigatorio.",
          debug_id: debugId,
          debug: debugEnabled ? debugEntries : undefined,
        },
        { status: 400 },
      );
    }

    if (!telefoneCobranca) {
      return NextResponse.json(
        {
          ok: false,
          error: "telefone_cobranca obrigatorio.",
          debug_id: debugId,
          debug: debugEnabled ? debugEntries : undefined,
        },
        { status: 400 },
      );
    }

    if (!emailNotaFiscal) {
      return NextResponse.json(
        {
          ok: false,
          error: "email_nota_fiscal obrigatorio.",
          debug_id: debugId,
          debug: debugEnabled ? debugEntries : undefined,
        },
        { status: 400 },
      );
    }

    if (!emailResponsavel) {
      return NextResponse.json(
        {
          ok: false,
          error: "email_responsavel obrigatorio.",
          debug_id: debugId,
          debug: debugEnabled ? debugEntries : undefined,
        },
        { status: 400 },
      );
    }

    if (!numeroIdentificacao) {
      return NextResponse.json(
        {
          ok: false,
          error: "numero_identificacao obrigatorio.",
          debug_id: debugId,
          debug: debugEnabled ? debugEntries : undefined,
        },
        { status: 400 },
      );
    }

    const idProposta = agregacaoData.idPropostaValor;
    const finalIdPessoa = idPessoa || agregacaoData.idPessoa;
    const finalIdAgregacao = idAgregacao;

    let idUsuario = await resolveCurrentUsuarioId();
    pushDebug("resolve.usuario_id", { value: idUsuario });

    if (!idUsuario && agregacaoData.idUsuario) {
      idUsuario = agregacaoData.idUsuario;
    }

    let linkDownload = "";

    if (arquivoContrato && arquivoContrato.size > 0) {
      pushDebug("upload.file.start", {
        name: arquivoContrato.name,
        size: arquivoContrato.size,
        type: arquivoContrato.type,
      });

      try {
        const fileName = `contratos/${Date.now()}-${randomUUID()}-${arquivoContrato.name}`;
        linkDownload = await uploadFileToSupabase(arquivoContrato, "contratos", fileName);
        pushDebug("upload.file.success", { public_url: linkDownload });
      } catch (uploadError) {
        pushDebug("upload.file.error", {
          message: uploadError instanceof Error ? uploadError.message : "unknown",
        });
        return NextResponse.json(
          {
            ok: false,
            error: "Falha ao fazer upload do arquivo.",
            debug_id: debugId,
            debug: debugEnabled ? debugEntries : undefined,
          },
          { status: 500 },
        );
      }
    }

    const webhookPayload = {
      p_empresa_email: emailResponsavel,
      p_agregacao: finalIdAgregacao ?? undefined,
      p_id_user: idUsuario ?? undefined,
      p_nota_email: emailNotaFiscal,
      p_fone_cobranca: telefoneCobranca,
      p_link_download: linkDownload,
      p_id_pessoa: finalIdPessoa ?? undefined,
      p_id_proposta: idProposta ?? undefined,
    };

    pushDebug("webhook.cadastrar_contrato.request", {
      endpoint: CADASTRAR_CONTRATO_ENDPOINT,
      payload: webhookPayload,
    });

    try {
      const response = await fetch(CADASTRAR_CONTRATO_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(webhookPayload),
        cache: "no-store",
      });

      const result = await parseResponseBody(response);
      pushDebug("webhook.cadastrar_contrato.response", {
        status: response.status,
        ok: response.ok,
        body: result,
      });

      if (!response.ok) {
        return NextResponse.json(
          {
            ok: false,
            error: "Webhook de cadastrar contrato retornou erro.",
            status: response.status,
            details: result,
            sent: webhookPayload,
            debug_id: debugId,
            debug: debugEnabled ? debugEntries : undefined,
          },
          { status: 502 },
        );
      }

      const contratoData = result as Record<string, unknown> | null;
      const idContrato = asPositiveInt(contratoData?.id_contrato ?? contratoData?.id);

      pushDebug("webhook.cadastrar_contrato.parsed", {
        id_contrato: idContrato,
        full_result: contratoData,
      });

      if (arquivoContrato && arquivoContrato.size > 0 && linkDownload && idContrato) {
        const enviarArquivoPayload = {
          file: linkDownload,
          id_contrato: idContrato,
        };

        pushDebug("webhook.enviar_arquivo.request", {
          endpoint: ENVIAR_ARQUIVO_CONTRATO_ENDPOINT,
          payload: enviarArquivoPayload,
        });

        try {
          const responseArquivo = await fetch(ENVIAR_ARQUIVO_CONTRATO_ENDPOINT, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(enviarArquivoPayload),
            cache: "no-store",
          });

          const resultArquivo = await parseResponseBody(responseArquivo);
          pushDebug("webhook.enviar_arquivo.response", {
            status: responseArquivo.status,
            ok: responseArquivo.ok,
            body: resultArquivo,
          });

          if (!responseArquivo.ok) {
            console.warn(
              `[clientes/cadastrar-contrato][${debugId}] Aviso: arquivo nao enviado ao webhook secundario`,
              { status: responseArquivo.status, body: resultArquivo },
            );
          }
        } catch (arquivoError) {
          pushDebug("webhook.enviar_arquivo.error", {
            message: arquivoError instanceof Error ? arquivoError.message : "unknown",
          });
          console.warn(
            `[clientes/cadastrar-contrato][${debugId}] Aviso: erro ao enviar arquivo ao webhook secundario`,
            arquivoError,
          );
        }
      }

      const durationMs = Date.now() - startedAt;
      pushDebug("request.success", { duration_ms: durationMs, id_contrato: idContrato });

      return NextResponse.json({
        ok: true,
        duration_ms: durationMs,
        id_contrato: idContrato,
        result: contratoData,
        sent: webhookPayload,
        debug_id: debugId,
        debug: debugEnabled ? debugEntries : undefined,
      });
    } catch (webhookError) {
      pushDebug("webhook.cadastrar_contrato.network_error", {
        message: webhookError instanceof Error ? webhookError.message : "unknown",
      });
      return NextResponse.json(
        {
          ok: false,
          error: "Falha de rede ao chamar webhook de cadastrar contrato.",
          debug_id: debugId,
          debug: debugEnabled ? debugEntries : undefined,
        },
        { status: 502 },
      );
    }
  } catch (error) {
    pushDebug("request.parse_error", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      {
        ok: false,
        error: "Falha ao processar requisicao.",
        debug_id: debugId,
        debug: debugEnabled ? debugEntries : undefined,
      },
      { status: 400 },
    );
  }
}

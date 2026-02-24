import { randomUUID } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { createAdminSupabaseClient } from "@/services/supabase/admin";
import { createServerSupabaseClient } from "@/services/supabase/server";

const CADASTRAR_CONTRATO_ENDPOINT =
  "https://whvtec2.verdetec.dev.br/webhook/15af86ec-056e-4a6a-b564-f225134717a8";
const ENVIAR_ARQUIVO_CONTRATO_ENDPOINT =
  "https://whvtec2.verdetec.dev.br/webhook/29cf27a9-a47a-45f7-8f98-302b66912455";

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

function asNonEmptyText(value: unknown) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(Math.trunc(value));
  }

  return null;
}

function resolvePropostaIdFromRow(row: Record<string, unknown>) {
  const candidates = [
    row.id_proposta_valor,
    row.id_proposta,
    row.proposta_id,
    row.idproposta,
    row.proposta,
  ];

  for (const candidate of candidates) {
    const asInt = asPositiveInt(candidate);
    if (asInt) {
      return asInt;
    }

    const asText = asNonEmptyText(candidate);
    if (asText) {
      return asText;
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
    .select("*")
    .eq("id", idAgregacao)
    .order("id", { ascending: false })
    .limit(1);

  if (error || !data?.length) {
    return null;
  }

  const row = data[0] as Record<string, unknown>;
  return {
    idPropostaValor: resolvePropostaIdFromRow(row),
    idPessoa: asPositiveInt(row.id_pessoa),
    idUsuario: asPositiveInt(row.id_usuario),
  };
}

async function resolveIdPropostaValorByIdPessoa(idPessoa: number) {
  const admin = createAdminSupabaseClient();

  const { data, error } = await admin
    .from("agregacao")
    .select("*")
    .eq("id_pessoa", idPessoa)
    .order("id", { ascending: false })
    .limit(50);

  if (error || !data?.length) {
    return null;
  }

  for (const row of data as Record<string, unknown>[]) {
    const resolved = resolvePropostaIdFromRow(row);
    if (resolved) {
      return resolved;
    }
  }

  return null;
}

async function resolveIdPropostaValorById(idProposta: number | string) {
  const admin = createAdminSupabaseClient();

  const { data, error } = await admin
    .from("proposta_valor")
    .select("id")
    .eq("id", idProposta)
    .limit(1);

  if (error || !data?.length) {
    return null;
  }

  const row = data[0] as Record<string, unknown>;
  return asPositiveInt(row.id) ?? asNonEmptyText(row.id);
}

async function resolveIdUsuarioByIdPessoa(idPessoa: number) {
  const admin = createAdminSupabaseClient();

  const { data, error } = await admin
    .from("agregacao")
    .select("id_usuario")
    .eq("id_pessoa", idPessoa)
    .not("id_usuario", "is", null)
    .order("id", { ascending: false })
    .limit(1);

  if (error || !data?.length) {
    return null;
  }

  const row = data[0] as Record<string, unknown>;
  return asPositiveInt(row.id_usuario);
}

async function resolveIdAgregacaoByIdPessoa(idPessoa: number) {
  const admin = createAdminSupabaseClient();

  const { data, error } = await admin
    .from("agregacao")
    .select("id")
    .eq("id_pessoa", idPessoa)
    .order("id", { ascending: false })
    .limit(1);

  if (error || !data?.length) {
    return null;
  }

  const row = data[0] as Record<string, unknown>;
  return asPositiveInt(row.id);
}

async function uploadFileToSupabase(file: File, bucketName: string, fileName: string) {
  const admin = createAdminSupabaseClient();

  const arrayBuffer = await file.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);

  const { error } = await admin.storage
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
    const idUsuarioFromPayload = asPositiveInt(formData.get("id_usuario"));
    const telefoneProposta = formData.get("telefone_proposta")?.toString() ?? "";
    const telefoneCobranca = formData.get("telefone_cobranca")?.toString() ?? "";
    const emailNotaFiscal = formData.get("email_nota_fiscal")?.toString() ?? "";
    const emailResponsavel = formData.get("email_responsavel")?.toString() ?? "";
    const numeroIdentificacao = formData.get("numero_identificacao")?.toString() ?? "";
    
    // Suporte a múltiplos arquivos
    const arquivosContrato = formData.getAll("arquivo_contrato") as File[];
    const arquivosValidos = arquivosContrato.filter((file) => file && file.size > 0);

    pushDebug("request.parsed_fields", {
      id_pessoa: idPessoa,
      id_agregacao: idAgregacao,
      id_usuario: idUsuarioFromPayload,
      telefone_proposta: telefoneProposta,
      telefone_cobranca: telefoneCobranca,
      email_nota_fiscal: emailNotaFiscal,
      email_responsavel: emailResponsavel,
      numero_identificacao: numeroIdentificacao,
      arquivos_count: arquivosValidos.length,
      arquivos_names: arquivosValidos.map((f) => f.name),
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

    let resolvedIdAgregacao = idAgregacao;
    if (!resolvedIdAgregacao && idPessoa) {
      pushDebug("resolve.id_agregacao.by_id_pessoa.start", { id_pessoa: idPessoa });
      resolvedIdAgregacao = await resolveIdAgregacaoByIdPessoa(idPessoa);
      pushDebug("resolve.id_agregacao.by_id_pessoa.end", { value: resolvedIdAgregacao });
    }

    if (!resolvedIdAgregacao) {
      return NextResponse.json(
        {
          ok: false,
          error: "Nao foi possivel resolver p_agregacao pela tabela agregacao.",
          debug_id: debugId,
          debug: debugEnabled ? debugEntries : undefined,
        },
        { status: 400 },
      );
    }

    let agregacaoData = await resolveAgregacaoData(resolvedIdAgregacao);
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

    // Resolve id_proposta_valor se ainda não tiver
    const finalIdPessoa = idPessoa || agregacaoData.idPessoa;
    const finalIdAgregacao = resolvedIdAgregacao;

    let idProposta: number | string | null = agregacaoData.idPropostaValor;
    if (!idProposta && finalIdPessoa) {
      pushDebug("resolve.id_proposta_valor.by_id_pessoa.start", { id_pessoa: finalIdPessoa });
      idProposta = await resolveIdPropostaValorByIdPessoa(finalIdPessoa);
      pushDebug("resolve.id_proposta_valor.by_id_pessoa.end", { value: idProposta });
    }

    if (!idProposta) {
      const numeroIdentificacaoDigits = numeroIdentificacao.replace(/\D/g, "");
      const idPropostaByNumeroIdentificacao =
        asPositiveInt(numeroIdentificacao) ?? asPositiveInt(numeroIdentificacaoDigits);
      pushDebug("resolve.id_proposta_valor.by_numero_identificacao.start", {
        numero_identificacao: numeroIdentificacao,
        numero_identificacao_digits: numeroIdentificacaoDigits,
        parsed: idPropostaByNumeroIdentificacao,
      });

      if (idPropostaByNumeroIdentificacao) {
        idProposta = await resolveIdPropostaValorById(idPropostaByNumeroIdentificacao);
      } else {
        const numeroIdentificacaoTexto = asNonEmptyText(numeroIdentificacao);
        if (numeroIdentificacaoTexto) {
          idProposta = await resolveIdPropostaValorById(numeroIdentificacaoTexto);
        }
      }

      pushDebug("resolve.id_proposta_valor.by_numero_identificacao.end", {
        value: idProposta,
      });
    }

    if (!idProposta) {
      const numeroIdentificacaoFallback =
        asNonEmptyText(numeroIdentificacao.replace(/\D/g, "")) ?? asNonEmptyText(numeroIdentificacao);
      if (numeroIdentificacaoFallback) {
        idProposta = numeroIdentificacaoFallback;
        pushDebug("resolve.id_proposta_valor.fallback_numero_identificacao", {
          value: idProposta,
        });
      }
    }

    if (!idProposta) {
      return NextResponse.json(
        {
          ok: false,
          error: "Nao foi possivel resolver p_id_proposta.",
          context: {
            id_pessoa: finalIdPessoa ?? null,
            id_agregacao: finalIdAgregacao ?? null,
            numero_identificacao: numeroIdentificacao || null,
          },
          debug_id: debugId,
          debug: debugEnabled ? debugEntries : undefined,
        },
        { status: 400 },
      );
    }

    let idUsuario = idUsuarioFromPayload ?? (await resolveCurrentUsuarioId());
    pushDebug("resolve.usuario_id", { value: idUsuario });

    if (!idUsuario && agregacaoData.idUsuario) {
      idUsuario = agregacaoData.idUsuario;
    }

    if (!idUsuario && finalIdPessoa) {
      pushDebug("resolve.id_usuario.by_id_pessoa.start", { id_pessoa: finalIdPessoa });
      idUsuario = await resolveIdUsuarioByIdPessoa(finalIdPessoa);
      pushDebug("resolve.id_usuario.by_id_pessoa.end", { value: idUsuario });
    }

    if (!idUsuario) {
      return NextResponse.json(
        {
          ok: false,
          error: "Nao foi possivel resolver p_id_user para o payload.",
          debug_id: debugId,
          debug: debugEnabled ? debugEntries : undefined,
        },
        { status: 400 },
      );
    }

    // Upload de múltiplos arquivos
    const linksDownload: string[] = [];

    if (arquivosValidos.length > 0) {
      pushDebug("upload.files.start", {
        count: arquivosValidos.length,
        files: arquivosValidos.map((f) => ({ name: f.name, size: f.size, type: f.type })),
      });

      for (const arquivo of arquivosValidos) {
        try {
          const fileName = `contratos/${Date.now()}-${randomUUID()}-${arquivo.name}`;
          const publicUrl = await uploadFileToSupabase(arquivo, "contratos", fileName);
          linksDownload.push(publicUrl);
          pushDebug("upload.file.success", { file: arquivo.name, public_url: publicUrl });
        } catch (uploadError) {
          pushDebug("upload.file.error", {
            file: arquivo.name,
            message: uploadError instanceof Error ? uploadError.message : "unknown",
          });
          return NextResponse.json(
            {
              ok: false,
              error: `Falha ao fazer upload do arquivo: ${arquivo.name}`,
              debug_id: debugId,
              debug: debugEnabled ? debugEntries : undefined,
            },
            { status: 500 },
          );
        }
      }

      pushDebug("upload.files.completed", { count: linksDownload.length, urls: linksDownload });
    }

    // Concatena as URLs separadas por vírgula para o webhook
    const linkDownloadString = linksDownload.join(",");

    const webhookPayload = {
      p_empresa_email: emailResponsavel,
      p_agregacao: finalIdAgregacao ?? undefined,
      p_id_user: idUsuario,
      p_nota_email: emailNotaFiscal,
      p_fone_cobranca: telefoneCobranca,
      p_link_download: linkDownloadString,
      p_id_pessoa: finalIdPessoa ?? undefined,
      p_id_proposta: idProposta,
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

      // Envia links para o segundo webhook (somente apos receber id_contrato)
      if (linksDownload.length > 0 && idContrato) {
        const enviarArquivoPayload = {
          file: linkDownloadString,
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
              `[clientes/cadastrar-contrato][${debugId}] Aviso: erro ao enviar arquivos ao webhook secundario`,
              { status: responseArquivo.status, body: resultArquivo },
            );
          }
        } catch (arquivoError) {
          pushDebug("webhook.enviar_arquivo.error", {
            message: arquivoError instanceof Error ? arquivoError.message : "unknown",
          });
          console.warn(
            `[clientes/cadastrar-contrato][${debugId}] Aviso: falha de rede ao enviar arquivos ao webhook secundario`,
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
        files_uploaded: linksDownload.length,
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

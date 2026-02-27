import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * ============================
 * CORS
 * ============================
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * ============================
 * Utils
 * ============================
 */
function sanitizeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

function isValidDate(value: string) {
  const t = Date.parse(value);
  return Number.isFinite(t);
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

/**
 * Formato do AFD compacto (igual ao exemplo):
 * DDMMAAAA + HHMM (12 chars)
 *
 * Usa timezone America/Sao_Paulo.
 */
function formatDateTimeAFDCompact(value: string) {
  const d = new Date(value);

  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";

  const dd = get("day");
  const mm = get("month");
  const yyyy = get("year");
  const hh = get("hour");
  const mi = get("minute");

  return `${dd}${mm}${yyyy}${hh}${mi}`;
}

/**
 * CRC-16/Kermit sobre ASCII do registro (sem o próprio CRC).
 * (Se a Consistem validar com outra variante, é aqui que ajusta.)
 */
function crc16KermitAscii(str: string): number {
  let crc = 0x0000;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) & 0xff;
    for (let b = 0; b < 8; b++) {
      crc = (crc & 1) ? ((crc >>> 1) ^ 0x8408) : (crc >>> 1);
    }
  }
  return crc & 0xffff;
}

function toHex4Lower(n: number) {
  return n.toString(16).padStart(4, "0");
}

/**
 * ============================
 * Edge Function
 * ============================
 * Gera NSR sequencial NO ARQUIVO (não usa nsr do banco):
 * NSR(9) + "3" + DDMMAAAAHHMM(12) + PIS(12) + CRC(4hex) + CRLF
 */
Deno.serve(async (req) => {
  try {
    // PRE-FLIGHT
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // BODY
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const startDate = body.startDate;
    const endDate = body.endDate;
    const idOrganizacao = body.idOrganizacao;

    // idUsuario opcional
    let idUsuario: number | undefined = undefined;
    const idUsuarioRaw = body.idUsuario;
    if (
      idUsuarioRaw !== undefined &&
      idUsuarioRaw !== null &&
      idUsuarioRaw !== "" &&
      idUsuarioRaw !== "null"
    ) {
      const parsed = Number(idUsuarioRaw);
      if (!Number.isNaN(parsed) && parsed > 0) idUsuario = parsed;
    }

    if (
      typeof startDate !== "string" ||
      typeof endDate !== "string" ||
      typeof idOrganizacao !== "string"
    ) {
      return new Response(
        JSON.stringify({ fileName: null, url: null, message: "Parâmetros obrigatórios ausentes" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      return new Response(
        JSON.stringify({ fileName: null, url: null, message: "startDate/endDate inválidos (use ISO 8601)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SUPABASE
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceKey) {
      return new Response(
        JSON.stringify({ fileName: null, url: null, message: "Variáveis de ambiente do Supabase ausentes" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: `Bearer ${serviceKey}` } },
    });

    // QUERY (não seleciona nsr)
    let query = supabase
      .from("registro_ponto")
      .select(
        `
        created_at,
        id_usuario,
        usuarios!pontos_id_usuario_fkey (
          pis,
          nome
        )
      `
      )
      .eq("id_organizacao", idOrganizacao)
      .gte("created_at", startDate)
      .lte("created_at", endDate)
      .order("created_at", { ascending: true });

    if (idUsuario !== undefined) query = query.eq("id_usuario", idUsuario);

    const { data, error } = await query;

    if (error) {
      return new Response(
        JSON.stringify({ fileName: null, url: null, message: "Erro ao consultar registros", detail: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({ fileName: null, url: null, message: "Sem dados no período" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // CONTEÚDO DO ARQUIVO
    let content = "";
    let skippedWithoutPis = 0;

    // NSR sequencial no arquivo
    let seqNsr = 0;

    for (const r of data as any[]) {
      const pisRaw = r.usuarios?.pis ?? "";
      const pisDigits = onlyDigits(String(pisRaw));

      if (!pisDigits) {
        skippedWithoutPis++;
        continue;
      }

      seqNsr += 1;

      const nsr9 = String(seqNsr).padStart(9, "0");
      const tipo = "3";
      const dt12 = formatDateTimeAFDCompact(r.created_at);
      const pis12 = pisDigits.padStart(12, "0");

      const base = `${nsr9}${tipo}${dt12}${pis12}`;
      const crc = toHex4Lower(crc16KermitAscii(base));

      content += `${base}${crc}\r\n`;
    }

    if (!content) {
      return new Response(
        JSON.stringify({
          fileName: null,
          url: null,
          message: "Nenhum registro pôde ser exportado (PIS ausente nos usuários)",
          skippedWithoutPis,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // NOME DO ARQUIVO (sempre único pra evitar cache)
    let nomeUsuario = "TODOS";
    if (idUsuario !== undefined && data.length > 0) {
      nomeUsuario = (data as any[])[0].usuarios?.nome ?? "USUARIO";
    }

    const dataInicio = startDate.substring(0, 10);
    const dataFim = endDate.substring(0, 10);
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");

    const fileName = `AFD_TIPO3_${sanitizeFileName(
      nomeUsuario
    )}_${dataInicio}_${dataFim}_${stamp}.txt`;

    // UPLOAD
    const uploadRes = await supabase.storage
      .from("arquivos_ponto")
      .upload(fileName, new Blob([content], { type: "text/plain" }), {
        upsert: true,
        contentType: "text/plain",
        cacheControl: "0",
      });

    if (uploadRes.error) {
      return new Response(
        JSON.stringify({
          fileName: null,
          url: null,
          message: "Falha ao enviar o arquivo para o Storage",
          detail: uploadRes.error.message,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: publicUrl } = supabase.storage.from("arquivos_ponto").getPublicUrl(fileName);

    return new Response(
      JSON.stringify({
        fileName,
        url: publicUrl.publicUrl,
        exported: (content.match(/\r\n/g) ?? []).length,
        skippedWithoutPis,
        nsrStart: 1,
        nsrEnd: seqNsr,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "Erro inesperado", message: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

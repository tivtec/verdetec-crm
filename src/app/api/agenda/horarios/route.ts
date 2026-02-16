import { NextResponse, type NextRequest } from "next/server";

const HORARIOS_ENDPOINT =
  process.env.AGENDA_HORARIOS_ENDPOINT ??
  "https://webh.verdetec.dev.br/webhook/f5bbcdb8-9950-4795-bc63-53fd92da8a18";

const DEFAULT_VERTICAL_ID = "0ec7796e-16d8-469f-a098-6c33063d7384";
const DEFAULT_BATCH_LIMIT = 500;
const MAX_BATCHES = 30;

type HorariosRequestPayload = {
  id_usuario?: number | string | null;
  data_inicio?: string | null;
  data_fim?: string | null;
  limit?: number | string | null;
  offset?: number | string | null;
  id_vertical?: string | null;
};

type HorarioRow = {
  id: string;
  dataInicio: string;
  dataInicioIso: string;
  representantes: string;
};

type HorariosAttemptBase = {
  id_usuario?: number;
  data_inicio: string | null;
  data_fim: string | null;
  id_vertical: string;
};

function asString(value: unknown, fallback = "") {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return fallback;
}

function asNonNegativeInt(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    const intValue = Math.trunc(value);
    return intValue >= 0 ? intValue : null;
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) {
      const intValue = Math.trunc(parsed);
      return intValue >= 0 ? intValue : null;
    }
  }

  return null;
}

function parseDateInput(value: string) {
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const tzHourOnly = trimmed.match(/([+-]\d{2})$/);
  if (tzHourOnly) {
    const normalized = `${trimmed}:00`;
    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  const tzCompact = trimmed.match(/([+-]\d{2})(\d{2})$/);
  if (tzCompact) {
    const normalized = `${trimmed.slice(0, -5)}${tzCompact[1]}:${tzCompact[2]}`;
    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  const brazilianMatch = trimmed.match(
    /^(\d{2})-(\d{2})-(\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (brazilianMatch) {
    const [, dd, mm, yyyy, hh = "00", mi = "00", ss = "00"] = brazilianMatch;
    const normalized = `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

function formatDateForInput(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
    return trimmed;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [yyyy, mm, dd] = trimmed.split("-");
    return `${dd}-${mm}-${yyyy}`;
  }

  const parsed = parseDateInput(trimmed);
  if (!parsed) {
    return null;
  }

  const dd = String(parsed.getDate()).padStart(2, "0");
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  const yyyy = String(parsed.getFullYear());
  return `${dd}-${mm}-${yyyy}`;
}

function formatDateTimeDisplay(value: string) {
  const parsed = parseDateInput(value);
  if (!parsed) {
    return "--";
  }

  const dd = String(parsed.getDate()).padStart(2, "0");
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  const yyyy = String(parsed.getFullYear());
  const hh = String(parsed.getHours()).padStart(2, "0");
  const mi = String(parsed.getMinutes()).padStart(2, "0");

  return `${dd}-${mm}-${yyyy} ${hh}:${mi}`;
}

function asIsoDate(value: string) {
  const parsed = parseDateInput(value);
  return parsed ? parsed.toISOString() : "";
}

function firstNonEmptyString(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const raw = row[key];
    const text = asString(raw).trim();
    if (text) {
      return text;
    }
  }

  return "";
}

function extractRepresentantes(row: Record<string, unknown>) {
  const candidates = [
    "usuarios_formatado",
    "representantes",
    "representante",
    "nome_usuario",
    "nome_representante",
    "usuario",
    "usuarios",
    "responsavel",
  ];

  for (const key of candidates) {
    const raw = row[key];

    if (Array.isArray(raw)) {
      const values = raw.map((item) => asString(item).trim()).filter((item) => item.length > 0);
      if (values.length > 0) {
        return values.join("/");
      }
    }

    const text = asString(raw).trim();
    if (text.length > 0) {
      return text;
    }
  }

  return "-";
}

function extractRows(source: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(source)) {
    return source.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"));
  }

  if (!source || typeof source !== "object") {
    return [];
  }

  const record = source as Record<string, unknown>;

  for (const key of ["rows", "data", "result", "items", "list", "horarios"]) {
    const candidate = record[key];
    if (Array.isArray(candidate)) {
      return candidate.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"));
    }
  }

  return [record];
}

function mapWebhookRows(rows: Array<Record<string, unknown>>): HorarioRow[] {
  const mapped = rows.map((row, index) => {
    const rawDate = firstNonEmptyString(row, [
      "inicio_formatado",
      "data_inicio",
      "inicio_reuniao",
      "inicio",
      "horario_inicio",
      "starts_at",
      "data",
      "data_hora",
      "created_at",
    ]);

    const rawId = firstNonEmptyString(row, [
      "id",
      "id_horario",
      "id_reserva_horario",
      "id_agendamento",
      "id_agenda",
    ]);

    const iso = rawDate ? asIsoDate(rawDate) : "";
    const display = rawDate ? formatDateTimeDisplay(rawDate) : "--";

    return {
      id: rawId || String(index + 1),
      dataInicio: display,
      dataInicioIso: iso,
      representantes: extractRepresentantes(row),
    } satisfies HorarioRow;
  });

  return mapped.filter((row) => row.dataInicio !== "--" || row.representantes !== "-");
}

function extractTotalRegistros(rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) {
    return null;
  }

  const first = rows[0];
  const total = asNonNegativeInt(first.total_registros);
  return typeof total === "number" ? total : null;
}

async function parseResponseBody(response: Response) {
  const text = await response.text();
  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function buildAttempts(payload: HorariosRequestPayload) {
  const idUsuario = asNonNegativeInt(payload.id_usuario);
  const dataInicio = formatDateForInput(payload.data_inicio ?? null);
  const dataFim = formatDateForInput(payload.data_fim ?? null);
  const idVertical = asString(payload.id_vertical, "").trim() || DEFAULT_VERTICAL_ID;

  const base: Omit<HorariosAttemptBase, "id_usuario"> = {
    data_inicio: dataInicio,
    data_fim: dataFim,
    id_vertical: idVertical,
  };

  if (typeof idUsuario === "number" && idUsuario > 0) {
    return [
      {
        ...base,
        id_usuario: idUsuario,
      },
    ];
  }

  return [
    {
      ...base,
      id_usuario: 0,
    },
    {
      ...base,
    },
  ];
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as HorariosRequestPayload | null;
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ ok: false, error: "Payload invalido." }, { status: 400 });
  }

  const attempts = buildAttempts(payload);
  const requestedLimit = asNonNegativeInt(payload.limit);
  const requestedOffset = asNonNegativeInt(payload.offset) ?? 0;
  const shouldLoadAll = requestedLimit === null || requestedLimit === 0;
  const effectiveLimit = shouldLoadAll ? DEFAULT_BATCH_LIMIT : requestedLimit;
  let lastOkRows: HorarioRow[] | null = null;
  let lastOkSent: Record<string, unknown> | null = null;

  for (const basePayload of attempts) {
    let currentOffset = requestedOffset;
    let allRows: HorarioRow[] = [];
    let batches = 0;
    let lastTotal: number | null = null;
    let lastSent: Record<string, unknown> | null = null;
    let attemptHadSuccess = false;

    while (batches < MAX_BATCHES) {
      const webhookPayload = {
        ...basePayload,
        limit: String(effectiveLimit),
        offset: String(currentOffset),
      };

      try {
        const response = await fetch(HORARIOS_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(webhookPayload),
          cache: "no-store",
        });

        const parsed = await parseResponseBody(response);
        if (!response.ok) {
          break;
        }

        attemptHadSuccess = true;
        lastSent = webhookPayload;

        const rawRows = extractRows(parsed);
        const mappedRows = mapWebhookRows(rawRows);
        const totalRegistros = extractTotalRegistros(rawRows);
        lastTotal = totalRegistros;

        if (mappedRows.length > 0) {
          allRows = allRows.concat(mappedRows);
        }

        if (!shouldLoadAll) {
          break;
        }

        if (totalRegistros === null || totalRegistros <= 0) {
          break;
        }

        currentOffset += effectiveLimit;
        batches += 1;

        if (currentOffset >= totalRegistros) {
          break;
        }
      } catch {
        break;
      }
    }

    if (!attemptHadSuccess) {
      continue;
    }

    // Normalize order to keep recent schedule first.
    allRows.sort((a, b) => {
      const aTime = parseDateInput(a.dataInicioIso)?.getTime() ?? 0;
      const bTime = parseDateInput(b.dataInicioIso)?.getTime() ?? 0;
      return bTime - aTime;
    });

    lastOkRows = allRows;
    lastOkSent = lastSent;

    if (allRows.length > 0 || (lastTotal !== null && lastTotal === 0)) {
      return NextResponse.json({
        ok: true,
        rows: allRows,
        sent: lastSent,
      });
    }
  }

  if (lastOkRows) {
    return NextResponse.json({
      ok: true,
      rows: lastOkRows,
      sent: lastOkSent,
    });
  }

  return NextResponse.json(
    {
      ok: false,
      error: "Falha ao carregar horarios no webhook.",
    },
    { status: 502 },
  );
}

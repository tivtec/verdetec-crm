"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import styles from "./page.module.css";

const N8N_WEBHOOK_URL = "https://webh.verdetec.dev.br/webhook/e169015d-dbbc-4e54-8b44-7b90063e96f1";

type WebhookItem = {
  meet_url?: string;
  nome_usuario?: string;
  nome_pessoa?: string;
  tel_pessoa?: string;
  tel_usuario?: string;
  id_agendamento?: number;
  cliente?: string;
  representante?: string;
  mensagem?: string;
};

function normalizeLoose(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function MeetPage() {
  const searchParams = useSearchParams();
  const cod = useMemo(() => (searchParams.get("cod") ?? "").trim(), [searchParams]);

  const [countdown, setCountdown] = useState(3);
  const [meetUrl, setMeetUrl] = useState<string | null>(null);
  const [data, setData] = useState<WebhookItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasFetched = useRef(false);

  useEffect(() => {
    if (countdown <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCountdown((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (hasFetched.current) {
      return;
    }

    hasFetched.current = true;

    const fetchWebhook = async () => {
      if (!cod) {
        setError("Codigo nao encontrado na URL.");
        return;
      }

      try {
        const response = await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ cod }),
          cache: "no-store",
        });

        if (!response.ok) {
          setError("Erro ao conectar com o servidor.");
          return;
        }

        const rawJson = (await response.json().catch(() => null)) as unknown;
        let responseItem: WebhookItem | null = null;

        if (Array.isArray(rawJson) && rawJson.length > 0 && rawJson[0] && typeof rawJson[0] === "object") {
          responseItem = rawJson[0] as WebhookItem;
        } else if (rawJson && typeof rawJson === "object" && !Array.isArray(rawJson)) {
          responseItem = rawJson as WebhookItem;
        }

        const cliente = normalizeLoose(String(responseItem?.cliente ?? ""));
        if (cliente === "nao encontrado") {
          setError(responseItem?.mensagem || "Codigo de reuniao nao encontrado.");
          return;
        }

        if (!responseItem?.meet_url || typeof responseItem.meet_url !== "string" || !responseItem.meet_url.trim()) {
          setError("Dados incompletos recebidos do servidor.");
          return;
        }

        setData(responseItem);
        setMeetUrl(responseItem.meet_url.trim());
      } catch {
        setError("Erro ao conectar com o servidor.");
      }
    };

    void fetchWebhook();
  }, [cod]);

  useEffect(() => {
    if (countdown !== 0 || !meetUrl || error) {
      return;
    }

    const cleanUrl = meetUrl.replace(/['"`]/g, "").trim();
    window.location.href = cleanUrl;
  }, [countdown, meetUrl, error]);

  const isError = Boolean(error);
  const isCounting = !isError && countdown > 0;
  const isLoading = !isError && countdown === 0 && !meetUrl;
  const isRedirecting = !isError && countdown === 0 && Boolean(meetUrl);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <img
          src="https://zosdxuntvhrzjutmvduu.supabase.co/storage/v1/object/public/logo/logoVerdetec-removebg-preview.png"
          className={styles.logo}
          alt="Verdetec Logo"
        />

        <div className={styles.card}>
          {isError ? (
            <div className={styles.attentionContainer}>
              <div className={styles.attentionIconWrapper}>
                <span className={styles.attentionIcon}>!</span>
              </div>
              <h2 className={styles.attentionTitle}>Ops! Nao encontramos sua reuniao</h2>
              <p className={styles.attentionMessage}>
                {error && error !== "Dados incompletos recebidos do servidor."
                  ? error
                  : "O codigo informado nao corresponde a nenhuma reuniao ativa no momento."}
              </p>
              <div className={styles.attentionFooter}>
                <p style={{ margin: 0, marginBottom: "0.5rem" }}>
                  Isso pode acontecer se o link estiver expirado ou incorreto.
                </p>
                <p style={{ margin: 0, color: "#f3f4f6", fontWeight: 500 }}>
                  Para continuar, entre em contato com a equipe da Verdetec.
                </p>
              </div>
            </div>
          ) : (
            <>
              <p className={styles.message}>
                {data?.nome_usuario || data?.cliente ? `Ola, ${data.nome_usuario || data.cliente}!` : "Aguarde..."}
              </p>
              <p className={styles.subMessage}>
                {data?.nome_pessoa || data?.representante
                  ? `Conectando com ${data.nome_pessoa || data.representante}`
                  : "Preparando sua sala de reuniao"}
              </p>

              <div className={styles.statusSlot}>
                {isCounting ? <div className={styles.countdown}>{countdown}</div> : null}

                {isLoading ? (
                  <div>
                    <div className={styles.spinner} />
                    <p className={styles.statusMessage}>Buscando dados da reuniao...</p>
                  </div>
                ) : null}

                {isRedirecting ? (
                  <div>
                    <div className={styles.spinner} />
                    <p className={styles.statusMessage}>Entrando...</p>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

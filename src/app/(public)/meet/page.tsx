import { Suspense } from "react";

import styles from "./page.module.css";
import { MeetClient } from "./meet-client";

type MeetPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getQueryValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function MeetFallback() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <img
          src="https://zosdxuntvhrzjutmvduu.supabase.co/storage/v1/object/public/logo/logoVerdetec-removebg-preview.png"
          className={styles.logo}
          alt="Verdetec Logo"
        />
        <div className={styles.card}>
          <div className={styles.statusSlot}>
            <div>
              <div className={styles.spinner} />
              <p className={styles.statusMessage}>Carregando...</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default async function MeetPage({ searchParams }: MeetPageProps) {
  const params = await searchParams;
  const cod = getQueryValue(params.cod).trim();

  return (
    <Suspense fallback={<MeetFallback />}>
      <MeetClient cod={cod} />
    </Suspense>
  );
}

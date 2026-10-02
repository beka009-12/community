"use client";

import LoadError from "@/src/components/errors/LoadError";

// Lives above admin/layout.tsx so it also catches errors thrown there
// (the layout reads the store for the NEW-requests badge).
export default function AdminError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <LoadError title="Не удалось загрузить админку" retry={retry} />;
}

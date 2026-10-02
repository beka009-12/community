"use client";

import LoadError from "@/src/components/errors/LoadError";

export default function SiteError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <LoadError title="Не удалось загрузить страницу" retry={retry} />;
}

"use client";

import LoadError from "@/src/components/errors/LoadError";

// Above account/layout.tsx so it also catches errors from the shell's own load.
export default function AccountError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <LoadError title="Не удалось загрузить кабинет" retry={retry} />;
}

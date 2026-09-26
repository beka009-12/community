// hooks/useMediaQuery.ts
import { useSyncExternalStore } from "react";

const subscribe = (query: string) => (onChange: () => void) => {
  const mediaQuery = window.matchMedia(query);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
};

// getServerSnapshot always reports false, so SSR and the first client
// render agree — the real value syncs in right after hydration with no
// setState-in-effect and no mismatch warning.
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    subscribe(query),
    () => window.matchMedia(query).matches,
    () => false,
  );
}

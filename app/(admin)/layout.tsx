import type { ReactNode } from "react";

// No site header/footer: the admin area has its own shell.
export default function AdminGroupLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

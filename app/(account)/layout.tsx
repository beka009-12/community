import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Кабинет — Motion Community",
  robots: { index: false, follow: false },
};

// No site header/footer: the cabinet has its own shell (account/layout.tsx).
export default function AccountGroupLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

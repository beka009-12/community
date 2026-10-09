import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Кабинет — Motion Community",
  robots: { index: false, follow: false },
};

// Minimal on purpose: the full cabinet (spec 2) gets its own shell here.
export default function AccountLayout({ children }: { children: ReactNode }) {
  return <main>{children}</main>;
}

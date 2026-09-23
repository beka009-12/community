import type { ReactNode } from "react";
import Layout from "@/src/layout/Layout";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return <Layout>{children}</Layout>;
}

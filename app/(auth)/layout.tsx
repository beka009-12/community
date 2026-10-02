import type { ReactNode } from "react";

// No site header/footer here: auth is its own section, and after login
// the user lands in /dashboard, not back on the public site.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <main>{children}</main>;
}

import type { ReactNode } from "react";

// No site header/footer here: auth is its own section, and after login
// the user lands in /admin (Admin) or /account (Team Lead, Developer).
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <main>{children}</main>;
}

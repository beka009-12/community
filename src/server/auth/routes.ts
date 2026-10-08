import type { UserRole } from "@/src/lib/api-enums";

export const LOGIN_PATH = "/login";

export const homeFor = (role: UserRole): string => (role === "Admin" ? "/admin" : "/account");

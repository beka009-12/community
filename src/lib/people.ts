interface Named {
  first_name?: string | null;
  last_name?: string | null;
}

// Fresh accounts can have empty names; the caller picks the fallback
// (a login in the admin, «Участник» on the public site).
export const fullName = (person: Named, fallback = "Участник"): string =>
  [person.first_name, person.last_name]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ") || fallback;

export const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

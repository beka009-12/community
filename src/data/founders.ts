export interface Founder {
  id: string;
  // Explicit placeholder labels ("Основатель 1"…) — not real names.
  // Real names/roles/photos are coming separately; swap them in here
  // once received, don't invent identities for real people.
  name: string;
}

const PLACEHOLDER_AVATAR = "/team/placeholder-1.webp";

export const FOUNDERS: Founder[] = Array.from({ length: 6 }, (_, i) => ({
  id: `founder-${i + 1}`,
  name: `Основатель ${i + 1}`,
}));

export const FOUNDER_AVATAR = PLACEHOLDER_AVATAR;

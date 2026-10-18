export interface SocialLink {
  href: string;
  label: string;
}

// TODO: placeholder URLs — swap for the real community accounts.
export const SOCIAL_LINKS: SocialLink[] = [
  { href: "https://wa.me/", label: "WhatsApp" },
  { href: "https://t.me/", label: "Telegram" },
  { href: "https://instagram.com/", label: "Instagram" },
  { href: "https://linkedin.com/", label: "LinkedIn" },
];

// Students apply through Telegram; swap the placeholder above to change it everywhere.
export const TELEGRAM_URL =
  SOCIAL_LINKS.find((link) => link.label === "Telegram")?.href ?? "https://t.me/";

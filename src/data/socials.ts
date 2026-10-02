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

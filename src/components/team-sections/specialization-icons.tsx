import { ReactNode } from "react";

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

// Shared between Specializations (description cards) and Roster (filter
// tabs) so both use the exact same icon per direction.
export const SPECIALIZATION_ICONS: Record<string, ReactNode> = {
  frontend: (
    <svg {...ICON_PROPS}>
      <path d="M8 8 3 12l5 4" />
      <path d="M16 8l5 4-5 4" />
    </svg>
  ),
  backend: (
    <svg {...ICON_PROPS}>
      <rect x="3" y="4" width="18" height="6" rx="1.5" />
      <rect x="3" y="14" width="18" height="6" rx="1.5" />
      <circle cx="7" cy="7" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="7" cy="17" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  ),
  fullstack: (
    <svg {...ICON_PROPS}>
      <path d="M12 3 3 8l9 5 9-5-9-5Z" />
      <path d="M3 13l9 5 9-5" />
    </svg>
  ),
  ai: (
    <svg {...ICON_PROPS}>
      <path d="M12 3v3" />
      <rect x="5" y="9" width="14" height="11" rx="3" />
      <circle cx="9.5" cy="14.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="14.5" r="1.2" fill="currentColor" stroke="none" />
      <path d="M9 18h6" />
    </svg>
  ),
  design: (
    <svg {...ICON_PROPS}>
      <path d="M4 20l4-1 10-10a2 2 0 0 0-3-3L5 16l-1 4Z" />
      <path d="M13 6l3 3" />
    </svg>
  ),
  qa: (
    <svg {...ICON_PROPS}>
      <path d="M12 3 4 6v6c0 5 3.5 7.5 8 9 4.5-1.5 8-4 8-9V6l-8-3Z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  mobile: (
    <svg {...ICON_PROPS}>
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M11 18h2" />
    </svg>
  ),
};

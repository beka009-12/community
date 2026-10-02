import { FC, ReactNode } from "react";

// One stroke family (24px grid, 1.75 stroke, round caps) for the whole
// admin, same line language as ArrowIcon on the public site.
const Icon: FC<{ children: ReactNode; size?: number }> = ({ children, size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const OverviewIcon = () => (
  <Icon>
    <circle cx="5" cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="19" cy="12" r="2" />
    <path d="M7 12h3M14 12h3" />
  </Icon>
);

export const MembersIcon = () => (
  <Icon>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5" />
  </Icon>
);

export const TeamsIcon = () => (
  <Icon>
    <circle cx="12" cy="6" r="2.5" />
    <circle cx="5.5" cy="17" r="2.5" />
    <circle cx="18.5" cy="17" r="2.5" />
    <path d="M10.5 8 7 14.8M13.5 8l3.5 6.8M8 17h8" />
  </Icon>
);

export const ProjectsIcon = () => (
  <Icon>
    <rect x="3" y="4" width="18" height="14" rx="2.5" />
    <path d="M3 8h18M8 21h8" />
  </Icon>
);

export const RequestsIcon = () => (
  <Icon>
    <path d="M4 5h16v10H9l-5 4z" />
    <path d="M8 9h8M8 12h5" />
  </Icon>
);

export const SettingsIcon = () => (
  <Icon>
    <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="10" cy="17" r="2" />
  </Icon>
);

export const LogoutIcon = () => (
  <Icon size={16}>
    <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
    <path d="M10 8l-4 4 4 4M6 12h10" />
  </Icon>
);

export const ArrowRightIcon = () => (
  <Icon size={16}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
);

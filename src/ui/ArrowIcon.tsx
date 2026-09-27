import { FC } from "react";

interface ArrowIconProps {
  direction?: "left" | "right";
  className?: string;
}

// Rounded stroke caps/joins on purpose — the typographic "←"/"→"
// glyphs render sharp and pointy at display sizes; this reads softer,
// matching the rest of the site's line-icon language (ServiceIcon etc).
const ArrowIcon: FC<ArrowIconProps> = ({ direction = "right", className }) => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
    style={direction === "left" ? { transform: "scaleX(-1)" } : undefined}
  >
    <path d="M4 12h16" />
    <path d="M13 5l7 7-7 7" />
  </svg>
);

export default ArrowIcon;

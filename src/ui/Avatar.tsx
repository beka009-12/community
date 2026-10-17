import { FC } from "react";
import { initials } from "@/src/lib/people";
import scss from "./Avatar.module.scss";

interface AvatarProps {
  src: string | null;
  name: string;
  imageClassName?: string;
  // Above-the-fold portraits load right away.
  eager?: boolean;
}

// Fills its positioned parent: the API photo when there is one, otherwise
// the person's initials, scaled to the box. API media lives on the backend
// host, so a plain <img> like the project previews.
const Avatar: FC<AvatarProps> = ({ src, name, imageClassName, eager }) =>
  src ? (
    <img
      src={src}
      alt=""
      loading={eager ? "eager" : "lazy"}
      className={`${scss.image} ${imageClassName ?? ""}`}
    />
  ) : (
    <span className={scss.fallback} aria-hidden="true">
      <span className={scss.fallback__text}>{initials(name)}</span>
    </span>
  );

export default Avatar;

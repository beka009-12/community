import { FC } from "react";
import scss from "./ProjectCover.module.scss";

interface ProjectCoverProps {
  src: string | null;
  name: string;
  // The surrounding card already captions the image: drop the name.
  bare?: boolean;
  imageClassName?: string;
}

// Fills its positioned parent. No project has a preview_image yet (the API
// has no upload), so a gradient title card stands in.
const ProjectCover: FC<ProjectCoverProps> = ({ src, name, bare, imageClassName }) =>
  src ? (
    <img
      src={src}
      alt={`${name} — превью`}
      loading="lazy"
      className={`${scss.image} ${imageClassName ?? ""}`}
    />
  ) : (
    <span className={scss.fallback} role="img" aria-label={`${name} — превью`}>
      {!bare && <span className={scss.fallback__name}>{name}</span>}
    </span>
  );

export default ProjectCover;

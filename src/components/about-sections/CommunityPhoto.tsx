import { FC } from "react";
import Image from "next/image";
import { COMMUNITY_PHOTO } from "@/src/data/community-photo";
import scss from "./CommunityPhoto.module.scss";

// Same "browser chrome" card look as the homepage's flagship-projects
// stack (hero-sections/Portfolio) — traffic-light dots + a mono filename
// title bar — applied to one big community photo instead of a stacked
// carousel. Static image, so this stays a Server Component; the hover
// lift is plain CSS.
const CommunityPhoto: FC = () => (
  <div className={scss.card} aria-hidden="true">
    <div className={scss.card__chrome}>
      <div className={scss.card__chromeDots}>
        <span className={scss["card__chrome-dot"]} data-color="red" />
        <span className={scss["card__chrome-dot"]} data-color="yellow" />
        <span className={scss["card__chrome-dot"]} data-color="green" />
      </div>
      <span className={scss.card__chromeTitle}>{COMMUNITY_PHOTO.file}</span>
    </div>

    <div className={scss.card__art}>
      <Image
        src={COMMUNITY_PHOTO.src}
        alt=""
        fill
        sizes="(min-width: 960px) 480px, 90vw"
        className={scss.card__image}
      />
    </div>
  </div>
);

export default CommunityPhoto;

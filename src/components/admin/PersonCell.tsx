import { FC } from "react";
import Image from "next/image";
import scss from "./ui/admin-ui.module.scss";

interface PersonCellProps {
  photo: string;
  name: string;
  caption: string;
}

const PersonCell: FC<PersonCellProps> = ({ photo, name, caption }) => (
  <span className={scss.person}>
    <span className={scss.person__avatar}>
      <Image src={photo} alt="" fill sizes="36px" className={scss.person__img} />
    </span>
    <span className={scss.person__text}>
      <span className={scss.person__name}>{name}</span>
      <span className={scss.person__caption}>{caption}</span>
    </span>
  </span>
);

export default PersonCell;

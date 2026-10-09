import { FC } from "react";
import Avatar from "@/src/ui/Avatar";
import scss from "./ui/admin-ui.module.scss";

interface PersonCellProps {
  avatar: string | null;
  name: string;
  caption?: string;
}

const PersonCell: FC<PersonCellProps> = ({ avatar, name, caption }) => (
  <span className={scss.person}>
    <span className={scss.person__avatar}>
      <Avatar src={avatar} name={name} imageClassName={scss.person__img} />
    </span>
    <span className={scss.person__text}>
      <span className={scss.person__name}>{name}</span>
      {caption && <span className={scss.person__caption}>{caption}</span>}
    </span>
  </span>
);

export default PersonCell;

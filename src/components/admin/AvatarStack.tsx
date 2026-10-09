import { FC } from "react";
import Avatar from "@/src/ui/Avatar";
import scss from "./AvatarStack.module.scss";

export interface AvatarPerson {
  name: string;
  avatar: string | null;
}

const MAX = 4;

const AvatarStack: FC<{ people: AvatarPerson[] }> = ({ people }) => {
  if (people.length === 0) return <span className={scss.none}>Нет участников</span>;
  const visible = people.slice(0, MAX);
  const extra = people.length - visible.length;
  return (
    <span className={scss.stack} aria-label={people.map((person) => person.name).join(", ")}>
      {visible.map((person, index) => (
        <span key={index} className={scss.avatar} title={person.name}>
          <Avatar src={person.avatar} name={person.name} imageClassName={scss.avatar__img} />
        </span>
      ))}
      {extra > 0 && <span className={`${scss.avatar} ${scss.more}`}>+{extra}</span>}
    </span>
  );
};

export default AvatarStack;

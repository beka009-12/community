import { FC } from "react";
import Image from "next/image";
import scss from "./AvatarStack.module.scss";

export interface AvatarPerson {
  id: string;
  name: string;
  photo: string;
}

const MAX = 4;

const AvatarStack: FC<{ people: AvatarPerson[] }> = ({ people }) => {
  if (people.length === 0) return <span className={scss.none}>Нет участников</span>;
  const visible = people.slice(0, MAX);
  const extra = people.length - visible.length;
  return (
    <span className={scss.stack} aria-label={people.map((person) => person.name).join(", ")}>
      {visible.map((person) => (
        <span key={person.id} className={scss.avatar} title={person.name}>
          <Image src={person.photo} alt="" fill sizes="28px" className={scss.avatar__img} />
        </span>
      ))}
      {extra > 0 && <span className={`${scss.avatar} ${scss.more}`}>+{extra}</span>}
    </span>
  );
};

export default AvatarStack;

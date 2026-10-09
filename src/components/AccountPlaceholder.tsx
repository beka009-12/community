import { FC } from "react";
import Button from "@/src/ui/Button";
import { logout } from "@/src/actions/auth";
import scss from "./AccountPlaceholder.module.scss";

// Where Team Leads and Developers land after login until the cabinet
// (spec 2) exists.
const AccountPlaceholder: FC<{ name: string }> = ({ name }) => (
  <section className={scss.page}>
    <div className={scss.card}>
      <p className={scss.eyebrow}>Личный кабинет</p>
      <h1 className={scss.title}>Здравствуйте, {name}</h1>
      <p className={scss.text}>
        Личный кабинет скоро появится: здесь можно будет заполнить профиль,
        опыт, образование и сертификаты.
      </p>
      <div className={scss.actions}>
        <Button href="/" variant="ghost">
          На сайт
        </Button>
        <form action={logout}>
          <Button type="submit" variant="primary">
            Выйти
          </Button>
        </form>
      </div>
    </div>
  </section>
);

export default AccountPlaceholder;

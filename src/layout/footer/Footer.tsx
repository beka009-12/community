import { FC } from "react";
import Image from "next/image";
import Link from "next/link";
import { SOCIAL_LINKS } from "@/src/data/socials";
import scss from "./Footer.module.scss";

const NAV_COLUMNS = [
  {
    title: "Сообщество",
    links: [
      { href: "#community", label: "Специалисты" },
      { href: "#portfolio", label: "Проекты" },
      { href: "#pillars", label: "Как это работает" },
    ],
  },
  {
    title: "Академия",
    links: [
      { href: "/about", label: "О нас" },
      { href: "https://motion.kg", label: "Вступить" },
    ],
  },
];

const Footer: FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className={scss.footer}>
      <div className={`container ${scss.footer__inner}`}>
        <div className={scss.footer__brand}>
          <Image
            src="/brand/motion-logo.svg"
            alt="Motion Community"
            width={253}
            height={134}
            className={scss.logoImage}
          />
          <p className={scss.footer__tagline}>
            Сообщество разработчиков в Бишкеке. Растим специалистов, находим им дело.
          </p>
        </div>

        <div className={scss.footer__columns}>
          {NAV_COLUMNS.map((col) => (
            <div key={col.title} className={scss.footer__column}>
              <h3>{col.title}</h3>
              <ul>
                {col.links.map((link) => (
                  <li key={link.href}>
                    {link.href.startsWith("http") ? (
                      <a href={link.href} target="_blank" rel="noreferrer">
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href}>{link.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className={scss.footer__social}>
          <h3>Связаться</h3>
          <ul>
            {SOCIAL_LINKS.map((social) => (
              <li key={social.href}>
                <a href={social.href} target="_blank" rel="noreferrer">
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={`container ${scss.footer__bottom}`}>
        <span>© {year} Motion Community</span>
        <span>Бишкек, Кыргызстан</span>
      </div>
    </footer>
  );
};

export default Footer;

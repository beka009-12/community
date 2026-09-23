import { ButtonHTMLAttributes, FC } from "react";
import Link from "next/link";
import scss from "./Button.module.scss";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
  href?: string;
  external?: boolean;
}

const Button: FC<ButtonProps> = ({
  variant = "primary",
  className = "",
  children,
  type = "button",
  href,
  external = false,
  ...rest
}) => {
  const combinedClassName = `${scss.button} ${scss[`button--${variant}`]} ${className}`;

  if (href) {
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className={combinedClassName}
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={combinedClassName}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={combinedClassName} {...rest}>
      {children}
    </button>
  );
};

export default Button;

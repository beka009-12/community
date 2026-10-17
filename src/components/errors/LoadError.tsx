"use client";

import { FC } from "react";
import scss from "./LoadError.module.scss";

interface LoadErrorProps {
  title: string;
  retry: () => void;
}

const LoadError: FC<LoadErrorProps> = ({ title, retry }) => (
  <div className={scss.error} role="alert">
    <h1 className={scss.error__title}>{title}</h1>
    <p className={scss.error__text}>
      Сервер не отвечает. Попробуйте ещё раз через минуту.
    </p>
    <button type="button" className={scss.error__button} onClick={retry}>
      Попробовать снова
    </button>
  </div>
);

export default LoadError;

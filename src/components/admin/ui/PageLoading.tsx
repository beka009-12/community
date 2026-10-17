import { FC } from "react";
import scss from "./admin-ui.module.scss";

// The admin's loading.tsx files show this while a page waits on the API.
const PageLoading: FC = () => (
  <div className={scss.emptyState} role="status" aria-live="polite">
    <p className={scss.emptyState__title}>Загружаем…</p>
  </div>
);

export default PageLoading;

"use client";

import { FC, FormEvent, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { motionTokens, springs } from "@/src/lib/motion-tokens";
import Button from "@/src/ui/Button";
import { CATEGORY_LABELS } from "@/src/data/projects";
import scss from "./RequestForm.module.scss";

// No backend yet (matches the rest of the site) — submitting just shows
// a confirmation state client-side. Field names mirror the ClientRequest
// entity from the platform plan (name, company, email, phone, title,
// description, projectType, budget) so wiring this to a real endpoint
// later is a drop-in, not a redesign.
const RequestForm: FC = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <section className={scss.request} id="request">
      <div className="container">
        <div className={scss.request__header}>
          <span className={scss.request__eyebrow}>
            <span className={scss.request__index}>§ 06</span>
            Начать проект
          </span>
          <h2 className={scss.request__title}>Расскажите о задаче</h2>
          <p className={scss.request__lead}>
            Опишите проект — подберём команду и ответим с деталями.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              className={scss.success}
              initial={{ opacity: 0, y: motionTokens.distance.sm }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: motionTokens.distance.sm }}
              transition={springs.snappy}
            >
              <h3>Заявка отправлена</h3>
              <p>Мы свяжемся с вами в ближайшее время.</p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              className={scss.form}
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: motionTokens.distance.sm }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: motionTokens.distance.sm }}
              transition={springs.snappy}
            >
              <div className={scss.field}>
                <label htmlFor="request-name">
                  Имя <span className={scss.required}>*</span>
                </label>
                <input id="request-name" name="name" type="text" autoComplete="name" required />
              </div>

              <div className={scss.field}>
                <label htmlFor="request-company">Компания</label>
                <input
                  id="request-company"
                  name="company"
                  type="text"
                  autoComplete="organization"
                />
              </div>

              <div className={scss.field}>
                <label htmlFor="request-email">
                  Email <span className={scss.required}>*</span>
                </label>
                <input id="request-email" name="email" type="email" autoComplete="email" required />
              </div>

              <div className={scss.field}>
                <label htmlFor="request-phone">Телефон</label>
                <input id="request-phone" name="phone" type="tel" autoComplete="tel" />
              </div>

              <div className={scss.field}>
                <label htmlFor="request-title">
                  Название проекта <span className={scss.required}>*</span>
                </label>
                <input id="request-title" name="title" type="text" required />
              </div>

              <div className={scss.field}>
                <label htmlFor="request-type">Тип проекта</label>
                <select id="request-type" name="projectType" defaultValue="">
                  <option value="" disabled>
                    Выберите тип
                  </option>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={scss.field}>
                <label htmlFor="request-budget">Бюджет (опционально)</label>
                <input
                  id="request-budget"
                  name="budget"
                  type="text"
                  placeholder="Например, 300 000 сом"
                />
              </div>

              <div className={`${scss.field} ${scss["field--full"]}`}>
                <label htmlFor="request-description">
                  Описание проекта <span className={scss.required}>*</span>
                </label>
                <textarea id="request-description" name="description" rows={5} required />
              </div>

              <div className={scss.submitRow}>
                <Button type="submit" variant="primary">
                  Отправить заявку
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default RequestForm;

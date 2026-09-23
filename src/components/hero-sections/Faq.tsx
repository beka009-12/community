"use client";

import { FC, useState } from "react";
import { motion } from "motion/react";
import { motionTokens } from "@/src/lib/motion-tokens";
import scss from "./Faq.module.scss";

const QUESTIONS = [
  {
    question: "Кто гарантирует качество кода?",
    answer:
      "Все проекты проходят код-ревью менторов и синьор-лидов — это часть рабочего процесса, а не разовая проверка перед сдачей.",
  },
  {
    question: "Сколько времени занимает разработка?",
    answer:
      "Зависит от масштаба: лендинг — от 1–2 недель, веб-система с бэкендом — от 4–8 недель. Точные сроки называем после анализа задачи.",
  },
  {
    question: "Как попасть в комьюнити?",
    answer:
      "Оставьте заявку в Telegram — начинаете с рабочего проекта под руководством тимлида, а не с тестового задания в стол.",
  },
];

interface FaqItemProps {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}

const FaqItem: FC<FaqItemProps> = ({ question, answer, open, onToggle }) => {
  return (
    <div className={scss.item}>
      <button
        type="button"
        className={scss.item__trigger}
        aria-expanded={open}
        onClick={onToggle}
      >
        <span>{question}</span>
        <span className={`${scss.item__icon} ${open ? scss["item__icon--open"] : ""}`} />
      </button>

      <motion.div
        initial={false}
        animate={{ opacity: open ? 1 : 0, scaleY: open ? 1 : 0 }}
        style={{ transformOrigin: "top", overflow: "hidden" }}
        transition={{
          duration: motionTokens.duration.normal,
          ease: motionTokens.easing.smooth,
        }}
      >
        <p className={scss.item__answer}>{answer}</p>
      </motion.div>
    </div>
  );
};

const Faq: FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className={scss.faq}>
      <div className={`container ${scss.faq__inner}`}>
        <h2 className={scss.faq__heading}>Частые вопросы</h2>

        <div className={scss.faq__list}>
          {QUESTIONS.map((item, i) => (
            <FaqItem
              key={item.question}
              question={item.question}
              answer={item.answer}
              open={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Faq;

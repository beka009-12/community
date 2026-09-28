export interface Testimonial {
  quote: string;
  author: string;
  company: string;
}

// TODO: placeholder — swap in real partner quotes, names, and companies.
export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Команда закрыла задачу быстрее, чем мы ожидали, и код прошёл ревью без доработок.",
    author: "Имя Фамилия",
    company: "Компания",
  },
  {
    quote:
      "Наняли двух участников сообщества после стажировки — оба уже вели свои проекты.",
    author: "Имя Фамилия",
    company: "Компания",
  },
  {
    quote: "Видно, что за каждым проектом стоит ревью тимлида, а не разовая задача.",
    author: "Имя Фамилия",
    company: "Компания",
  },
];

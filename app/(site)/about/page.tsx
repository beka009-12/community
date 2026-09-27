import type { Metadata } from "next";
import About from "@/src/components/About";

export const metadata: Metadata = {
  title: "О нас — Motion Community",
  description:
    "Сообщество разработчиков в Бишкеке: кто мы, откуда берём людей и как начать проект с нами.",
};

const Page = () => <About />;

export default Page;

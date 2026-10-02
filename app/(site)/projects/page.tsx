import type { Metadata } from "next";
import Projects from "@/src/components/Projects";
import { getPublicProjects } from "@/src/server/queries/public";

export const metadata: Metadata = {
  title: "Проекты — Motion Community",
  description:
    "Проекты, которые сообщество Motion Community делает для себя, и проекты в разработке на заказ.",
};

const Page = async () => <Projects projects={await getPublicProjects()} />;

export default Page;

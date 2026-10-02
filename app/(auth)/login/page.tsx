import type { Metadata } from "next";
import Login from "@/src/components/Login";

export const metadata: Metadata = {
  title: "Вход — Motion Community",
};

const Page = () => <Login />;

export default Page;

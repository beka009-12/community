import type { Metadata } from "next";
import { Unbounded, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.scss";

const displayFont = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic"],
  weight: ["600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Motion Community",
  description:
    "Сообщество разработчиков Бишкека: находим специалистов frontend, backend и AI/ML, помогаем компаниям нанимать проверенных людей.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${displayFont.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body cz-shortcut-listen="true">{children}</body>
    </html>
  );
}

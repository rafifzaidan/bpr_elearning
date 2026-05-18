import type { Metadata } from "next";
import "./globals.css";
import LayoutWrapper from "./components/LayoutWrapper";

export const metadata: Metadata = {
  title: "BPR E-Learning Admin",
  description: "Control Center — Kelola pegawai, modul, ujian, dan hasil belajar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[var(--color-surface)]">
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}

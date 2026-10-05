import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jollibee — Đặt món theo cách của bạn",
  description: "Concept đặt món Jollibee: giao tận nơi, mang về và đặt bàn.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased">{children}</body>
    </html>
  );
}

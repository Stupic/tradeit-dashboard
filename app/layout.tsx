import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TAAS Dashboard",
  description: "비즈니스 현황 대시보드",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

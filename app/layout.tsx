import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "한 눈에 보이는 편의점 재고 현황",
  description: "실시간으로 내 주변 GS25, CU, 세븐일레븐, 이마트24의 상품 재고를 조회하고 마커로 위치를 확인해보세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* Leaflet CSS - 도메인 등록 불필요, 무료 오픈소스 */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          crossOrigin=""
        />
      </head>
      <body className={`${inter.className} bg-slate-50 text-slate-900 h-screen overflow-hidden`}>
        {children}
      </body>
    </html>
  );
}

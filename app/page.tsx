"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Sidebar from "../components/Sidebar";

// Leaflet은 브라우저(window)에서만 동작하므로 SSR 비활성화
const Map = dynamic(() => import("../components/Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100">
      <div className="text-slate-500 text-sm animate-pulse">🗺️ 지도 불러오는 중...</div>
    </div>
  ),
});

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <main className="relative flex h-screen w-screen overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Floating Toggle Button for Mobile view when Sidebar is closed */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="absolute left-4 top-4 z-20 md:hidden bg-white text-slate-800 hover:bg-slate-50 border border-slate-200 shadow-xl px-4 py-2.5 rounded-2xl flex items-center space-x-2 transition duration-200 font-semibold text-xs"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
          <span>점포 목록 & 검색</span>
        </button>
      )}

      {/* Main Map View */}
      <div className="flex-1 h-full relative">
        <Map />
      </div>
    </main>
  );
}

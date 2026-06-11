"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useStockStore } from "../store/useStockStore";
import { Store } from "../types";

// Leaflet 기본 아이콘 경로 수정 (Next.js 빌드 시 필요)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// 브랜드별 마커 색상 설정
const BRAND_COLORS: Record<string, { bg: string; text: string; badge: string; badgeText: string }> = {
  CU: { bg: "#7c3aed", text: "#fff", badge: "#4c1d95", badgeText: "#ede9fe" },
  GS25: { bg: "#0284c7", text: "#fff", badge: "#075985", badgeText: "#e0f2fe" },
  SEVEN: { bg: "#059669", text: "#fff", badge: "#064e3b", badgeText: "#d1fae5" },
  EMART24: { bg: "#f59e0b", text: "#1c1917", badge: "#451a03", badgeText: "#fef3c7" },
};

const BRAND_COLORS_OUT: Record<string, { bg: string; text: string; badge: string; badgeText: string }> = {
  CU: { bg: "#ede9fe", text: "#7c3aed", badge: "#7c3aed", badgeText: "#ede9fe" },
  GS25: { bg: "#e0f2fe", text: "#0369a1", badge: "#0369a1", badgeText: "#e0f2fe" },
  SEVEN: { bg: "#d1fae5", text: "#065f46", badge: "#065f46", badgeText: "#d1fae5" },
  EMART24: { bg: "#fef3c7", text: "#92400e", badge: "#92400e", badgeText: "#fef3c7" },
};

function createStoreIcon(store: Store): L.DivIcon {
  const isOut = !store.stock || store.stock === 0;
  const c = isOut ? BRAND_COLORS_OUT[store.brand] : BRAND_COLORS[store.brand];
  const label = isOut ? "품절" : `${store.stock}개`;
  const border = isOut ? `border: 1.5px solid ${c.badge}66;` : "";

  const html = `
    <div style="
      display:inline-flex;align-items:center;gap:5px;
      padding:5px 10px;border-radius:999px;
      background:${c.bg};color:${c.text};
      font-size:11px;font-weight:700;
      box-shadow:0 2px 10px rgba(0,0,0,0.28);
      white-space:nowrap;font-family:system-ui,sans-serif;
      ${border}
    ">
      <span style="
        font-size:9px;padding:1px 6px;border-radius:999px;
        background:${c.badge};color:${c.badgeText};font-weight:800;
      ">${store.brand}</span>
      ${label}
    </div>
    <div style="
      width:0;height:0;
      border-left:6px solid transparent;border-right:6px solid transparent;
      border-top:6px solid ${isOut ? c.badge + "66" : c.bg};
      margin:0 auto;
    "></div>
  `;

  return L.divIcon({ html, className: "", iconAnchor: [0, 0], popupAnchor: [60, -10] });
}

export default function Map() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);

  const {
    stores, selectedStore, userLocation,
    setUserLocation, setSelectedStore, fetchStocks, searchQuery,
  } = useStockStore();

  // 지도 클릭으로 내 위치 설정 모드
  const [locationPickMode, setLocationPickMode] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string, duration = 3000) => {
    setToast(msg);
    setTimeout(() => setToast(null), duration);
  };

  // 위치 업데이트 + 재고 조회 함수
  const updateLocationAndFetch = (lat: number, lng: number, msg?: string) => {
    setUserLocation(lat, lng);
    fetchStocks(searchQuery);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 15, { animate: true });
    }
    if (msg) showToast(msg);
  };

  // GPS 위치 요청
  const requestGPS = () => {
    if (!navigator.geolocation) {
      showToast("이 브라우저는 위치 정보를 지원하지 않습니다.");
      return;
    }
    showToast("GPS 위치 요청 중...", 5000);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        updateLocationAndFetch(coords.latitude, coords.longitude, "✅ GPS 위치로 업데이트했습니다.");
        setLocationPickMode(false);
      },
      () => {
        showToast("⚠️ GPS 오류: 지도를 클릭해서 내 위치를 직접 설정하세요.", 5000);
        setLocationPickMode(true);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // 지도 초기화
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, { center: [37.45, 127.15], zoom: 14 });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    // 지도 클릭: 위치 직접 설정 모드
    map.on("click", (e: L.LeafletMouseEvent) => {
      // locationPickMode는 클로저에서 최신 값을 읽어야 하므로 ref로 처리
      if (!(window as any).__locationPickMode) return;
      const { lat, lng } = e.latlng;
      updateLocationAndFetch(lat, lng, "📍 내 위치를 지도에서 설정했습니다.");
      (window as any).__locationPickMode = false;
      setLocationPickMode(false);
      map.getContainer().style.cursor = "";
    });

    // 초기 GPS 요청
    requestGPS();

    return () => { map.remove(); mapInstanceRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // locationPickMode 상태가 바뀔 때 전역 변수도 동기화
  useEffect(() => {
    (window as any).__locationPickMode = locationPickMode;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.getContainer().style.cursor = locationPickMode ? "crosshair" : "";
    }
  }, [locationPickMode]);

  // 사용자 위치 마커 렌더링
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation) return;
    const map = mapInstanceRef.current;
    if (userMarkerRef.current) userMarkerRef.current.remove();

    const marker = L.circleMarker([userLocation.lat, userLocation.lng], {
      radius: 10, fillColor: "#2563eb", color: "#fff", weight: 3, fillOpacity: 1,
    }).addTo(map);
    marker.bindTooltip("📍 내 위치", { permanent: false, direction: "top" });
    userMarkerRef.current = marker;
  }, [userLocation]);

  // 편의점 마커 렌더링
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (stores.length === 0) return;

    const bounds: [number, number][] = [];

    stores.forEach((store) => {
      const icon = createStoreIcon(store);
      const marker = L.marker([store.lat, store.lng], { icon }).addTo(map);
      const isOut = !store.stock || store.stock === 0;
      const distText = store.distance !== undefined
        ? store.distance >= 1000 ? `${(store.distance / 1000).toFixed(1)}km` : `${store.distance}m`
        : "";

      marker.bindPopup(`
        <div style="font-family:system-ui,sans-serif;min-width:160px;">
          <div style="font-weight:800;font-size:13px;color:#1e293b;margin-bottom:4px;">${store.name}</div>
          <div style="font-size:11px;color:#64748b;margin-bottom:6px;">${store.address}</div>
          ${distText ? `<div style="font-size:11px;color:#2563eb;font-weight:600;">📍 ${distText}</div>` : ""}
          <div style="margin-top:8px;display:flex;justify-content:space-between;border-top:1px solid #f1f5f9;padding-top:8px;">
            <span style="font-size:11px;color:#64748b;">재고</span>
            <span style="font-weight:900;font-size:13px;color:${isOut ? "#ef4444" : "#059669"};">
              ${isOut ? "품절" : `${store.stock}개 보유`}
            </span>
          </div>
        </div>
      `, { maxWidth: 240 });

      marker.on("click", () => { setSelectedStore(store); marker.openPopup(); });
      markersRef.current.push(marker);
      bounds.push([store.lat, store.lng]);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [40, 40], maxZoom: 15 });
    }
  }, [stores]);

  // 선택된 점포로 지도 이동
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedStore) return;
    mapInstanceRef.current.setView([selectedStore.lat, selectedStore.lng], 16, { animate: true });
    const idx = stores.findIndex((s) => s.id === selectedStore.id);
    if (idx >= 0 && markersRef.current[idx]) markersRef.current[idx].openPopup();
  }, [selectedStore]);

  return (
    <div className="relative w-full h-full">
      {/* 지도 캔버스 */}
      <div ref={mapRef} className="w-full h-full" id="map-canvas" />

      {/* 상단 위치 설정 버튼들 */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
        <button
          onClick={requestGPS}
          className="bg-white border border-slate-200 shadow-lg hover:bg-blue-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition"
          title="GPS로 현재 위치 가져오기"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-blue-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          GPS 위치
        </button>

        <button
          onClick={() => setLocationPickMode((v) => !v)}
          className={`border shadow-lg text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition ${locationPickMode
              ? "bg-amber-500 border-amber-600 text-white"
              : "bg-white border-slate-200 hover:bg-amber-50 text-slate-700"
            }`}
          title="지도를 클릭해서 내 위치 직접 설정"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59" />
          </svg>
          {locationPickMode ? "클릭으로 위치 설정 중..." : "직접 위치 설정"}
        </button>
      </div>

      {/* 위치 설정 모드 안내 배너 */}
      {locationPickMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1001] bg-amber-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672Z" />
          </svg>
          내 위치를 설정할 곳을 지도에서 클릭하세요
        </div>
      )}

      {/* 토스트 알림 */}
      {toast && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1002] bg-slate-800/90 backdrop-blur text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-lg max-w-[280px] text-center">
          {toast}
        </div>
      )}

      {/* 선택 점포 하단 카드 */}
      {selectedStore && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-[90%] sm:w-[360px] bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <span
                  style={{
                    background: BRAND_COLORS[selectedStore.brand]?.bg ?? "#e2e8f0",
                    color: BRAND_COLORS[selectedStore.brand]?.text ?? "#1e293b",
                  }}
                  className="px-2 py-0.5 text-[10px] font-extrabold rounded-full"
                >
                  {selectedStore.brand}
                </span>
                <h3 className="text-sm font-bold text-slate-800">{selectedStore.name}</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">{selectedStore.address}</p>
              {selectedStore.distance !== undefined && (
                <p className="text-[11px] text-blue-600 font-semibold mt-0.5">
                  📍{" "}
                  {selectedStore.distance >= 1000
                    ? `${(selectedStore.distance / 1000).toFixed(1)}km`
                    : `${selectedStore.distance}m`}
                </p>
              )}
            </div>
            <button onClick={() => setSelectedStore(null)} className="text-slate-400 hover:text-slate-600 p-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
            <span className="text-sm font-medium text-slate-600">재고 현황</span>
            <span className={`text-base font-black ${!selectedStore.stock || selectedStore.stock === 0 ? "text-red-500" : "text-emerald-600"}`}>
              {!selectedStore.stock || selectedStore.stock === 0 ? "품절" : `${selectedStore.stock}개 보유`}
            </span>
          </div>


        </div>
      )}
    </div>
  );
}

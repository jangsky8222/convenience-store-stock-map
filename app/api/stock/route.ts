import { NextRequest, NextResponse } from "next/server";
import { Store, BrandType } from "../../../types";

// ──────────────────────────────────────────────────────────
// 카카오 로컬 검색 API로 실제 주변 편의점 조회
// REST API 키가 있으면 가장 정확한 데이터를 받아올 수 있습니다.
// ──────────────────────────────────────────────────────────
const KAKAO_REST_KEY = process.env.KAKAO_REST_API_KEY || "";

async function fetchKakaoStores(lat: number, lng: number, radius = 2000): Promise<Store[]> {
  if (!KAKAO_REST_KEY) throw new Error("KAKAO_REST_API_KEY 미설정");

  const url = `https://dapi.kakao.com/v2/local/search/category.json?category_group_code=CS2&x=${lng}&y=${lat}&radius=${radius}&size=15`;
  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${KAKAO_REST_KEY}` },
  });
  if (!res.ok) throw new Error(`Kakao API ${res.status}`);
  const json = await res.json();

  const brandMap: Record<string, BrandType> = {};
  const stores: Store[] = [];

  for (const doc of json.documents ?? []) {
    const name: string = doc.place_name || "";
    let brand: BrandType | null = null;
    if (name.startsWith("CU") || name.includes("씨유")) brand = "CU";
    else if (name.startsWith("GS25") || name.startsWith("GS 25")) brand = "GS25";
    else if (name.includes("세븐일레븐") || name.includes("7-Eleven")) brand = "SEVEN";
    else if (name.includes("이마트24")) brand = "EMART24";
    if (!brand) continue;

    const storeLat = parseFloat(doc.y);
    const storeLng = parseFloat(doc.x);
    stores.push({
      id: `kakao-${doc.id}`,
      name,
      brand,
      address: doc.road_address_name || doc.address_name,
      lat: storeLat,
      lng: storeLng,
      distance: Math.round(parseFloat(doc.distance)),
    });
  }
  return stores;
}

// ──────────────────────────────────────────────────────────
// 정적 편의점 DB – 역(지하철) 위키피디아 좌표 기반으로 보정됨
//
// 주요 역 기준 좌표 (Wikipedia WGS84)
//   장지역 8호선  : 37.478158, 127.126297
//   문정역 8호선  : 37.484819, 127.117428
//   가락시장역 3·8: 37.491820, 127.122219
//   오금역 3·5호선: 37.503342, 127.132247
//   위례광장 기준 : 37.479000, 127.141000
// ──────────────────────────────────────────────────────────
const STATIC_STORES: Omit<Store, "stock" | "distance">[] = [
  // ── 장지역 인근 (8호선, 37.478158 / 127.126297) ──────
  { id: "gs25-jangji-st", brand: "GS25", name: "GS25 장지역점", address: "서울 송파구 장지로 145 (장지동)", lat: 37.47820, lng: 127.12620 },
  { id: "cu-jangji-st", brand: "CU", name: "CU 장지역점", address: "서울 송파구 장지로 147 (장지동)", lat: 37.47810, lng: 127.12640 },
  { id: "seven-jangji-st", brand: "SEVEN", name: "세븐일레븐 장지역점", address: "서울 송파구 장지로 137 (장지동)", lat: 37.47830, lng: 127.12590 },
  { id: "emart24-jangji-st", brand: "EMART24", name: "이마트24 장지역점", address: "서울 송파구 장지로 152 (장지동)", lat: 37.47800, lng: 127.12660 },

  // ── 문정역 인근 (8호선, 37.484819 / 127.117428) ──────
  { id: "cu-munjeong-st", brand: "CU", name: "CU 문정역점", address: "서울 송파구 중대로 8 (문정동)", lat: 37.48490, lng: 127.11750 },
  { id: "gs25-munjeong-st", brand: "GS25", name: "GS25 문정역점", address: "서울 송파구 법원로 114 (문정동)", lat: 37.48500, lng: 127.11730 },
  { id: "seven-munjeong-st", brand: "SEVEN", name: "세븐일레븐 문정역점", address: "서울 송파구 중대로 12 (문정동)", lat: 37.48480, lng: 127.11770 },
  { id: "emart24-munjeong-st", brand: "EMART24", name: "이마트24 문정동점", address: "서울 송파구 중대로 86 (문정동)", lat: 37.48510, lng: 127.11790 },

  // ── 문정 법조타운 (37.4877 / 127.1177) ─────────────
  { id: "gs25-munjeong-law", brand: "GS25", name: "GS25 문정법조타운점", address: "서울 송파구 법원로 101 (문정동)", lat: 37.48770, lng: 127.11770 },
  { id: "cu-munjeong-rodeo", brand: "CU", name: "CU 문정로데오점", address: "서울 송파구 송파대로22길 21 (문정동)", lat: 37.48590, lng: 127.12240 },

  // ── 가락시장역 인근 (3·8호선, 37.491820 / 127.122219) ──
  { id: "gs25-garak-st", brand: "GS25", name: "GS25 가락시장역점", address: "서울 송파구 오금로 157 (가락동)", lat: 37.49190, lng: 127.12220 },
  { id: "cu-garak-st", brand: "CU", name: "CU 가락시장역점", address: "서울 송파구 가락로 61 (가락동)", lat: 37.49170, lng: 127.12200 },
  { id: "emart24-garak-st", brand: "EMART24", name: "이마트24 가락동점", address: "서울 송파구 오금로 181 (가락동)", lat: 37.49210, lng: 127.12240 },

  // ── 오금역 인근 (3·5호선, 37.503342 / 127.132247) ────
  { id: "gs25-ogeum-st", brand: "GS25", name: "GS25 오금역점", address: "서울 송파구 오금로 71 (오금동)", lat: 37.50330, lng: 127.13220 },
  { id: "seven-ogeum-st", brand: "SEVEN", name: "세븐일레븐 오금역점", address: "서울 송파구 오금로 61 (오금동)", lat: 37.50310, lng: 127.13200 },

  // ── 위례광장 인근 (37.479 / 127.141) ────────────────
  { id: "gs25-wirye-1", brand: "GS25", name: "GS25 송파위례점", address: "서울 송파구 위례광장로 121 (장지동)", lat: 37.47872, lng: 127.14022 },
  { id: "gs25-wirye-2", brand: "GS25", name: "GS25 송파위례2호점", address: "서울 송파구 위례광장로 163 (장지동)", lat: 37.47912, lng: 127.14350 },
  { id: "seven-wirye-1", brand: "SEVEN", name: "세븐일레븐 위례아이파크점", address: "서울 송파구 위례광장로 136 (장지동)", lat: 37.47920, lng: 127.14090 },
  { id: "emart24-wirye-hs", brand: "EMART24", name: "이마트24 위례힐스테이트점", address: "서울 송파구 위례광장로 170 (장지동)", lat: 37.47955, lng: 127.14207 },
  { id: "emart24-wirye-fs", brand: "EMART24", name: "이마트24 위례포레샤인점", address: "서울 송파구 위례순환로 477 (장지동)", lat: 37.47730, lng: 127.14200 },
  { id: "cu-wirye-1", brand: "CU", name: "CU 위례한빛점", address: "서울 송파구 위례한빛로 200 (장지동)", lat: 37.48150, lng: 127.13580 },
];

// ──────────────────────────────────────────────────────────
// 하버사인 거리
// ──────────────────────────────────────────────────────────
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180, p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// ──────────────────────────────────────────────────────────
// 재고 시뮬레이션
// ──────────────────────────────────────────────────────────
function simulateStock(item: string, storeId: string): number {
  const seed = (item + storeId).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const isScarce = /빵|연세|맥주|아사히|몽쉘|삼각김밥/.test(item);
  const rnd = Math.abs(Math.sin(seed * 9301 + 49297)) * 100;
  return isScarce ? Math.floor(rnd % 3) : Math.floor(rnd % 8);
}

// ──────────────────────────────────────────────────────────
// GET /api/stock
// ──────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const item = searchParams.get("item") || "";
  const userLat = parseFloat(searchParams.get("lat") || "37.478");
  const userLng = parseFloat(searchParams.get("lng") || "127.126");
  const radius = 3000;

  try {
    // 1차: 카카오 로컬 API (KAKAO_REST_API_KEY 설정 시)
    if (KAKAO_REST_KEY) {
      try {
        const stores = await fetchKakaoStores(userLat, userLng, radius);
        if (stores.length >= 3) {
          const result = stores.slice(0, 15).map((s) => ({ ...s, stock: simulateStock(item, s.id) }));
          return NextResponse.json({ status: "success", data: result });
        }
      } catch (e) {
        console.warn("Kakao 로컬 실패:", e);
      }
    }

    // 2차 폴백: 정적 DB
    let stores = STATIC_STORES
      .map((s) => ({ ...s, distance: getDistance(userLat, userLng, s.lat, s.lng) }))
      .filter((s) => s.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    if (stores.length < 4) {
      stores = STATIC_STORES
        .map((s) => ({ ...s, distance: getDistance(userLat, userLng, s.lat, s.lng) }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 10);
    }

    const result = stores.slice(0, 15).map((s) => ({ ...s, stock: simulateStock(item, s.id) }));
    return NextResponse.json({ status: "success", data: result });
  } catch (error: any) {
    return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
  }
}

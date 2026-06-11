import { create } from "zustand";
import { Store, StockSearchResponse } from "../types";

interface StockState {
  searchQuery: string;
  stores: Store[];
  selectedStore: Store | null;
  userLocation: { lat: number; lng: number } | null;
  isLoading: boolean;
  searchError: string | null;
  setSearchQuery: (query: string) => void;
  setUserLocation: (lat: number, lng: number) => void;
  setSelectedStore: (store: Store | null) => void;
  fetchStocks: (item: string) => Promise<void>;
}

export const useStockStore = create<StockState>((set, get) => ({
  searchQuery: "",
  stores: [],
  selectedStore: null,
  userLocation: null,
  isLoading: false,
  searchError: null,

  setSearchQuery: (query) => set({ searchQuery: query }),

  setUserLocation: (lat, lng) => set({ userLocation: { lat, lng } }),

  setSelectedStore: (store) => set({ selectedStore: store }),

  fetchStocks: async (item) => {
    const { userLocation } = get();
    if (!item.trim()) return;

    set({ isLoading: true, searchError: null });

    try {
      // Pass coordinates if available to calculate realistic distances and nearby stores
      const latParam = userLocation ? `&lat=${userLocation.lat}` : "";
      const lngParam = userLocation ? `&lng=${userLocation.lng}` : "";

      const response = await fetch(
        `/api/stock?item=${encodeURIComponent(item)}${latParam}${lngParam}`
      );

      if (!response.ok) {
        throw new Error("서버와의 통신에 실패했습니다.");
      }

      const json: StockSearchResponse = await response.json();

      if (json.status === "success") {
        set({ stores: json.data, isLoading: false });

        // If the selected store is no longer in the list or is updated, update it
        const currentSelected = get().selectedStore;
        if (currentSelected) {
          const updatedSelected = json.data.find(s => s.id === currentSelected.id);
          set({ selectedStore: updatedSelected || null });
        }
      } else {
        set({ stores: [], searchError: json.message || "재고 데이터를 불러오지 못했습니다.", isLoading: false });
      }
    } catch (error: any) {
      set({
        stores: [],
        searchError: error.message || "재고 조회 중 오류가 발생했습니다.",
        isLoading: false,
      });
    }
  },
}));

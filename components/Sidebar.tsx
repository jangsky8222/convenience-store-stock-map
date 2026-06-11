"use client";

import React, { useState } from "react";
import { useStockStore } from "../store/useStockStore";
import { Search, MapPin, Loader2, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { BrandType, Store } from "../types";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const {
    searchQuery,
    setSearchQuery,
    stores,
    selectedStore,
    setSelectedStore,
    isLoading,
    searchError,
    fetchStocks,
    userLocation,
    setUserLocation,
  } = useStockStore();

  const [inputVal, setInputVal] = useState(searchQuery);
  const [selectedBrands, setSelectedBrands] = useState<BrandType[]>(["CU", "GS25", "SEVEN", "EMART24"]);
  const [onlyInStock, setOnlyInStock] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      setSearchQuery(inputVal.trim());
      fetchStocks(inputVal.trim());
    }
  };

  const handleRefreshLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation(latitude, longitude);
          fetchStocks(searchQuery);
        },
        (error) => {
          alert("위치 정보를 가져올 수 없습니다. 기본 위치로 조회합니다.");
          setUserLocation(37.450, 127.150);
          fetchStocks(searchQuery);
        }
      );
    }
  };

  const toggleBrand = (brand: BrandType) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  // Filter stores based on brands and stock filter
  const filteredStores = stores.filter((store) => {
    const brandMatches = selectedBrands.includes(store.brand);
    const stockMatches = !onlyInStock || (store.stock !== undefined && store.stock > 0);
    return brandMatches && stockMatches;
  });

  return (
    <div
      className={`fixed md:relative top-0 left-0 h-full w-[320px] sm:w-[380px] bg-white border-r border-slate-200 shadow-2xl md:shadow-none transition-transform duration-300 ease-in-out z-30 flex flex-col ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
    >
      {/* Header */}
      <header className="p-5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-950 fill-amber-950" />
            <h1 className="text-lg font-black tracking-tight">한 눈에 보이는 편의점 재고 현황</h1>
          </div>
          <button
            onClick={handleRefreshLocation}
            className="p-1.5 hover:bg-black/10 rounded-lg transition"
            title="위치 새로고침"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[11px] opacity-80 mt-1">
          GS25 · CU · 세븐일레븐 · 이마트24 실시간 재고 조회
        </p>
      </header>

      {/* Search Bar */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="상품명을 입력하세요 (예: 빵, 맥주)"
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-12 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-sm"
          />
          <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
          <button
            type="submit"
            disabled={isLoading}
            className="absolute right-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1 rounded-lg text-[10px] transition disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "조회"}
          </button>
        </form>

        {/* Brand Filter Badges */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {(["CU", "GS25", "SEVEN", "EMART24"] as BrandType[]).map((brand) => {
            const isSelected = selectedBrands.includes(brand);
            let activeStyle = "";
            switch (brand) {
              case "CU":
                activeStyle = isSelected ? "bg-brand-cu-light text-brand-cu-text border-brand-cu" : "bg-white text-slate-400";
                break;
              case "GS25":
                activeStyle = isSelected ? "bg-brand-gs25-light text-brand-gs25-text border-brand-gs25" : "bg-white text-slate-400";
                break;
              case "SEVEN":
                activeStyle = isSelected ? "bg-brand-seven-light text-brand-seven-text border-brand-seven" : "bg-white text-slate-400";
                break;
              case "EMART24":
                activeStyle = isSelected ? "bg-brand-emart-light text-brand-emart-text border-brand-emart" : "bg-white text-slate-400";
                break;
            }
            return (
              <button
                key={brand}
                onClick={() => toggleBrand(brand)}
                className={`px-2 py-1 rounded-lg text-[10px] font-extrabold border transition ${activeStyle} border border-slate-100 shadow-sm`}
              >
                {brand}
              </button>
            );
          })}
        </div>

        {/* Stock Filter Switch */}
        <div className="flex items-center mt-3 text-[11px] text-slate-600">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyInStock}
              onChange={(e) => setOnlyInStock(e.target.checked)}
              className="rounded text-amber-500 focus:ring-amber-500 border-slate-300 w-3.5 h-3.5"
            />
            <span>재고 있는 점포만 보기</span>
          </label>
        </div>
      </div>

      {/* Stores List Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-2 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-xs">실시간 재고 데이터 조회 중...</p>
          </div>
        ) : searchError ? (
          <div className="flex items-center space-x-2 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{searchError}</span>
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-xs text-center">
            <p className="font-semibold">조회된 편의점이 없습니다.</p>
            <p className="text-[10px] mt-1">검색어를 바꾸거나 필터를 조정해 보세요.</p>
          </div>
        ) : (
          filteredStores.map((store) => {
            const isSelected = selectedStore?.id === store.id;
            const hasStock = store.stock !== undefined && store.stock > 0;

            let badgeClass = "";
            let borderClass = isSelected ? "border-amber-500 ring-2 ring-amber-500/20" : "border-slate-100 hover:border-slate-300";

            switch (store.brand) {
              case "CU":
                badgeClass = "bg-brand-cu-light text-brand-cu-text";
                break;
              case "GS25":
                badgeClass = "bg-brand-gs25-light text-brand-gs25-text";
                break;
              case "SEVEN":
                badgeClass = "bg-brand-seven-light text-brand-seven-text";
                break;
              case "EMART24":
                badgeClass = "bg-brand-emart-light text-brand-emart-text";
                break;
            }

            return (
              <div
                key={store.id}
                onClick={() => setSelectedStore(store)}
                className={`p-3.5 bg-white rounded-2xl border transition duration-200 cursor-pointer shadow-sm relative ${borderClass}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-full ${badgeClass}`}>
                      {store.brand}
                    </span>
                    <h3 className="text-xs font-bold text-slate-800 leading-tight">
                      {store.name}
                    </h3>
                  </div>
                  <span
                    className={`text-xs font-black shrink-0 ${hasStock ? "text-emerald-600" : "text-rose-500"
                      }`}
                  >
                    {hasStock ? `${store.stock}개` : "품절"}
                  </span>
                </div>

                <div className="flex items-center space-x-1 text-[10px] text-slate-400 mt-2">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate max-w-[220px]">{store.address}</span>
                </div>

                {store.distance !== undefined && (
                  <div className="text-[10px] text-blue-600 font-semibold mt-1">
                    {store.distance >= 1000 ? `${(store.distance / 1000).toFixed(1)}km` : `${store.distance}m`}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Close button for mobile views */}
      <button
        onClick={() => setIsOpen(false)}
        className="absolute md:hidden top-4 -right-12 bg-white border border-slate-200 border-l-0 shadow-lg px-3 py-2.5 rounded-r-xl text-slate-500"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>
    </div>
  );
}

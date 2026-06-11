export type BrandType = "CU" | "GS25" | "SEVEN" | "EMART24";

export interface Store {
  id: string;
  name: string;
  brand: BrandType;
  address: string;
  lat: number;
  lng: number;
  distance?: number; // in meters
  stock?: number;
}

export interface StockSearchResponse {
  status: "success" | "error";
  data: Store[];
  message?: string;
}

export interface Product {
  title: string;
  brand: string;
  current_price_brl: number;
  original_price_brl?: number;
  color?: string;
  gender?: string;
  category?: string;
  subcategory?: string;
  product_url: string;
}

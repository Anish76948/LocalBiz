export interface Product {
  id: number;
  vendor_id: number;
  category_slug: string;
  name: string;
  price: number;
  original_price?: number;
  unit: string;
  stock: number;
  rating: number;
  reviews_count: number;
  image_url: string;
  description?: string;
  badge?: string;
  is_featured?: number;
  vendor_name?: string;
  vendor_location?: string;
  vendor_rating?: number;
  vendor_badge?: string;
  vendor_avatar?: string;
  vendor_bio?: string;
}

export interface Vendor {
  id: number;
  name: string;
  slug: string;
  location: string;
  rating: number;
  reviews_count: number;
  avatar: string;
  bio: string;
  speciality: string;
  badge: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  id?: number;
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  payment_method: string;
  total_amount: number;
  status: 'PLACED' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED';
  created_at: string;
  items?: OrderItem[];
}

export interface DashboardStats {
  totalProducts: number;
  totalVendors: number;
  totalOrders: number;
  totalRevenue: number;
}

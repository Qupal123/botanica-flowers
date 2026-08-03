export interface User {
  username: string;
  passwordHash: string;
  role: 'admin' | 'user';
}

export interface Sort {
  id: string;
  name: string;
}

export interface Subcategory {
  id: string;
  name: string;
  sorts: Sort[];
}

export interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
  sorts: Sort[];
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  mediaUrls?: string[];
  imageUrl: string;
  categoryId: string;
  subcategoryId?: string;
  sortId?: string;
  stock?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus = 'new' | 'accepted' | 'in_progress' | 'completed';

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  cityType?: 'omsk' | 'other';
  cdekAddress?: string;
  paymentConfirmed?: boolean;
  status: OrderStatus;
  createdAt: string;
  userId: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  senderId: string;
  senderName: string;
  senderRole: 'admin' | 'user';
  text: string;
  timestamp: string;
  read?: boolean;
  orderId?: string;
}

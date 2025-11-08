// Types for Stamin-Up application

export interface User {
  id: string;
  email: string;
  name: string;
  userType: 'client' | 'provider';
  avatarUrl?: string;
}

export interface TimeSlot {
  start: string; // Formato "HH:MM" (24 horas)
  end: string;   // Formato "HH:MM" (24 horas)
}

export interface TimeAvailability {
  monday: TimeSlot | null;
  tuesday: TimeSlot | null;
  wednesday: TimeSlot | null;
  thursday: TimeSlot | null;
  friday: TimeSlot | null;
  saturday: TimeSlot | null;
  sunday: TimeSlot | null;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  provider: Provider;
  category: Category;
  price: number;
  priceType: 'fixed' | 'hourly' | 'negotiable';
  imageUrl: string;
  rating: number;
  reviewCount: number;
  featured: boolean;
  availability: string[]; // @deprecated - Usar providerAvailability en su lugar
  providerAvailability?: TimeAvailability; // ✅ Horarios disponibles del proveedor
  createdAt: string;
}

export interface Provider {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  bio: string;
  rating: number;
  completedJobs: number;
  verified: boolean;
  joinedDate: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description: string;
  imageUrl?: string;
}

export interface Review {
  id: string;
  serviceId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

export interface SearchFilters {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  location?: string;
}

// Client Profile Types
export interface ClientUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  memberSince: string;
  profileImage?: string;
}

// Order Rating - Calificación embebida en la orden
export interface OrderRating {
  value: number;
  createdAt: string;
}

// Order Report - Reporte embebido en la orden (información resumida)
export interface OrderReport {
  id: string;
  category: 'not_completed' | 'poor_quality' | 'behavior' | 'price_issue' | 'no_show' | 'fraud' | 'other';
  status: 'pending' | 'in_review' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface Order {
  id: string;
  serviceName: string;
  providerName: string;
  date: string;
  status: 'Completado' | 'En curso' | 'Pendiente' | 'Aceptado' | 'Rechazado' | 'Cancelado';
  price: number;
  rating?: OrderRating;
  reports?: OrderReport[];
  // Información detallada del service request
  description?: string;
  preferredDate?: string;
  address?: string;
  contactPhone?: string;
  providerId?: number;
  userId?: string;
  paymentStatus?: 'pending' | 'paid';
  completedAt?: string;
}

// Client Review - Reseña completa del cliente (para la sección "Mis Reseñas")
export interface ClientReview {
  id: string;
  orderId: string;
  serviceName: string;
  providerName: string;
  rating: number;
  comment: string;
  date: string;
  tags?: string[];
}

// Service Request / Booking Types
export type BookingStatus = 
  | 'pending' 
  | 'accepted' 
  | 'rejected' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled';

export interface ServiceRequest {
  requestId?: string;
  serviceId: string;
  userId: string;
  preferredDate: string; // ISO-8601
  address: string;
  contactPhone: string;
  description: string;
  amount?: number;
  status?: BookingStatus;
  createdAt?: string;
}

export interface ServiceRequestResponse {
  requestId: string;
  message?: string; // Mensaje del servidor
  status?: BookingStatus; // Opcional al crear
  createdAt?: string; // Opcional al crear
  serviceRequest?: ServiceRequest; // Opcional al crear
}

// Provider Types
export interface ProviderUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  profileImage?: string;
  bio: string;
  rating: number;
  completedJobs: number;
  verified: boolean;
  joinedDate: string;
  memberSince: string;
}

export interface ProviderRequest {
  requestId: string;
  serviceId: string;
  serviceName: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  preferredDate: string;
  address: string;
  contactPhone: string;
  description: string;
  amount: number;
  status: 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  rejectionReason?: string;
  history: RequestHistoryEntry[];
}

export interface RequestHistoryEntry {
  action: 'created' | 'accepted' | 'rejected' | 'in_progress' | 'completed' | 'cancelled' | 'date_proposed';
  timestamp: string;
  note?: string;
  reason?: string;
  proposedDate?: string;
}

export interface DayAvailability {
  enabled: boolean;
  slots: TimeSlot[];
}

export interface WeekAvailability {
  monday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
  thursday: DayAvailability;
  friday: DayAvailability;
  saturday: DayAvailability;
  sunday: DayAvailability;
}

export interface BlockedSlot {
  id: string;
  date: string;
  start: string;
  end: string;
  reason: string;
}

export interface CalendarData {
  availability: WeekAvailability;
  blockedSlots: BlockedSlot[];
}

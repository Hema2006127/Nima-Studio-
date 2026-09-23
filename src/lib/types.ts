// Row types mirroring supabase/migrations. Regenerate with
// `npx supabase gen types typescript` once the project is linked if you prefer generated types.

export const PORTFOLIO_CATEGORIES = ['wedding', 'engagement', 'session', 'reel', 'other'] as const;
export type PortfolioCategory = (typeof PORTFOLIO_CATEGORIES)[number];

export const EVENT_TYPES = ['wedding', 'engagement', 'session', 'reel', 'other'] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const BOOKING_STATUSES = ['pending', 'quoted', 'confirmed', 'completed', 'cancelled'] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const QUOTATION_STATUSES = ['draft', 'sent', 'accepted', 'declined', 'expired'] as const;
export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];

export const PAYMENT_METHODS = ['cash', 'bank_transfer', 'instapay', 'vodafone_cash', 'card', 'other'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface SiteSettings {
  id: number;
  studio_name_en: string;
  studio_name_ar: string;
  tagline_en: string;
  tagline_ar: string;
  hero_title_en: string;
  hero_title_ar: string;
  hero_subtitle_en: string;
  hero_subtitle_ar: string;
  about_en: string;
  about_ar: string;
  showreel_youtube_id: string | null;
  whatsapp_number: string | null;
  instagram_url: string | null;
  phone: string | null;
  email: string | null;
  city_en: string;
  city_ar: string;
  updated_at: string;
}

export interface Service {
  id: string;
  slug: string;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  price_from: number | null;
  currency: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  youtube_video_id: string;
  cover_image_path: string | null;
  category: PortfolioCategory;
  venue: string;
  event_date: string | null;
  is_published: boolean;
  is_featured: boolean;
  sort_order: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  reference: number;
  customer_id: string;
  event_type: EventType;
  event_date: string;
  venue: string;
  guest_count: number | null;
  contact_name: string;
  contact_phone: string;
  notes: string;
  status: BookingStatus;
  admin_notes: string;
  created_at: string;
  updated_at: string;
}

export interface QuotationItem {
  id: string;
  quotation_id: string;
  description: string;
  amount: number;
  sort_order: number;
}

export interface Quotation {
  id: string;
  booking_id: string;
  status: QuotationStatus;
  currency: string;
  valid_until: string | null;
  notes: string;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
  quotation_items?: QuotationItem[];
}

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  paid_at: string;
  reference: string;
  notes: string;
  created_at: string;
}

/** Standard result returned by server actions to forms. */
export type ActionState = { ok?: boolean; error?: string; message?: string; fieldErrors?: Record<string, string> } | null;

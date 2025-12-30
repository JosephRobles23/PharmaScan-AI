// Database Types
export interface UserSettings {
  user_id: string;
  expiration_alert_months: number;
  updated_at: string;
}

export interface ProductUnit {
  id: string;
  user_id: string;
  product_name: string;
  product_code: string | null;
  expiration_date: string;
  expiration_status: 'valid' | 'expiring_soon' | 'expired';
  created_at: string;
}

export interface ProductSummary {
  id: string;
  user_id: string;
  product_name: string;
  product_name_id: string;
  total_quantity: number;
  last_updated: string;
}

// OCR Types
export interface OCRResult {
  success: boolean;
  productCode: string | null;
  expirationDate: string | null;
  rawText: string;
  error?: string;
}

// Scanning Session Types
export interface ScanningSession {
  productName: string;
  unitsScanned: number;
  currentUnit: {
    productCode: string | null;
    expirationDate: string | null;
    expirationStatus: 'valid' | 'expiring_soon' | 'expired' | null;
  } | null;
}

// Auth Types
export interface User {
  id: string;
  email: string;
}

-- PharmaScan AI Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- User Settings Table
-- ============================================
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  expiration_alert_months INTEGER DEFAULT 3 CHECK (expiration_alert_months >= 1 AND expiration_alert_months <= 12),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own settings
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- Product Units Table (Individual scanned items)
-- ============================================
CREATE TABLE IF NOT EXISTS product_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_code TEXT,
  expiration_date DATE NOT NULL,
  expiration_status TEXT NOT NULL CHECK (expiration_status IN ('valid', 'expiring_soon', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_units_user_id ON product_units(user_id);
CREATE INDEX IF NOT EXISTS idx_product_units_product_name ON product_units(product_name);
CREATE INDEX IF NOT EXISTS idx_product_units_expiration_status ON product_units(expiration_status);
CREATE INDEX IF NOT EXISTS idx_product_units_expiration_date ON product_units(expiration_date);

-- Enable RLS
ALTER TABLE product_units ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own units" ON product_units
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own units" ON product_units
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own units" ON product_units
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own units" ON product_units
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- Products Summary Table (Aggregated data)
-- ============================================
CREATE TABLE IF NOT EXISTS products_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_name_id TEXT NOT NULL,
  total_quantity INTEGER DEFAULT 0 CHECK (total_quantity >= 0),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_name_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_summary_user_id ON products_summary(user_id);
CREATE INDEX IF NOT EXISTS idx_products_summary_product_name_id ON products_summary(product_name_id);

-- Enable RLS
ALTER TABLE products_summary ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own summary" ON products_summary
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own summary" ON products_summary
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own summary" ON products_summary
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own summary" ON products_summary
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- Function to auto-create user settings on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id, expiration_alert_months)
  VALUES (NEW.id, 3)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create settings when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Utility function to update expiration statuses
-- (Can be run periodically via cron or manually)
-- ============================================
CREATE OR REPLACE FUNCTION update_expiration_statuses()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  alert_months INTEGER;
BEGIN
  FOR user_record IN SELECT DISTINCT user_id FROM product_units LOOP
    -- Get user's alert months setting
    SELECT expiration_alert_months INTO alert_months
    FROM user_settings
    WHERE user_id = user_record.user_id;
    
    IF alert_months IS NULL THEN
      alert_months := 3;
    END IF;
    
    -- Update expired products
    UPDATE product_units
    SET expiration_status = 'expired'
    WHERE user_id = user_record.user_id
      AND expiration_date < CURRENT_DATE
      AND expiration_status != 'expired';
    
    -- Update expiring soon products
    UPDATE product_units
    SET expiration_status = 'expiring_soon'
    WHERE user_id = user_record.user_id
      AND expiration_date >= CURRENT_DATE
      AND expiration_date <= (CURRENT_DATE + (alert_months || ' months')::INTERVAL)
      AND expiration_status != 'expiring_soon';
    
    -- Update valid products
    UPDATE product_units
    SET expiration_status = 'valid'
    WHERE user_id = user_record.user_id
      AND expiration_date > (CURRENT_DATE + (alert_months || ' months')::INTERVAL)
      AND expiration_status != 'valid';
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Grant necessary permissions
-- ============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
